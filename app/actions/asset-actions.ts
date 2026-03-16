'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  assetCreateSchema,
  assetEditSchema,
  assetStatusChangeSchema,
  assetTransferSchema,
  transferAcceptSchema,
  transferRejectSchema,
  transferCancelSchema,
} from '@/lib/validations/asset-schema';
import { ASSET_STATUS_TRANSITIONS } from '@/lib/constants/asset-status';
import {
  pauseSchedulesForAsset,
  resumeSchedulesForAsset,
  deactivateSchedulesForAsset,
} from '@/app/actions/schedule-actions';
import { z } from 'zod';
import { assertCompanyAccess } from '@/lib/auth/company-access';

// ============================================================================
// createAsset — ga_staff, ga_lead, admin only
// Generates I{CC}-{YY}-{NNN} display ID atomically via DB function
// ============================================================================
export const createAsset = authActionClient
  .schema(assetCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions to create assets');
    }

    // Determine effective company_id (multi-company access support)
    const effectiveCompanyId = parsedInput.company_id ?? profile.company_id;

    // Validate extra company access if a different company was selected
    if (parsedInput.company_id) {
      await assertCompanyAccess(supabase, profile.id, parsedInput.company_id, profile.company_id);
    }

    // Generate display_id atomically via DB function
    const { data: displayId, error: rpcError } = await supabase
      .rpc('generate_asset_display_id', { p_company_id: effectiveCompanyId });

    if (rpcError || !displayId) {
      const msg = rpcError?.message || '';
      if (msg.includes('Company code')) {
        throw new Error('Company code must be set (exactly 2 characters) before creating assets. Update it in Admin > Companies.');
      }
      throw new Error('Failed to generate asset ID. Please try again.');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        company_id: effectiveCompanyId,
        location_id: parsedInput.location_id,
        category_id: parsedInput.category_id,
        display_id: displayId,
        name: parsedInput.name,
        description: parsedInput.description ?? null,
        brand: parsedInput.brand ?? null,
        model: parsedInput.model ?? null,
        serial_number: parsedInput.serial_number ?? null,
        acquisition_date: parsedInput.acquisition_date || null,
        warranty_expiry: parsedInput.warranty_expiry || null,
        status: 'active',
      })
      .select('id, display_id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/inventory');
    return { success: true, assetId: data.id, displayId: data.display_id };
  });

// ============================================================================
// updateAsset — ga_staff, ga_lead, admin only
// Cannot edit sold_disposed assets
// ============================================================================
export const updateAsset = authActionClient
  .schema(z.object({ asset_id: z.string().uuid(), data: assetEditSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions to update assets');
    }

    // Fetch asset — must exist, belong to company, and not be sold_disposed
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('id, status, company_id')
      .eq('id', parsedInput.asset_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Asset not found');
    }

    if (existing.status === 'sold_disposed') {
      throw new Error('Cannot edit a sold/disposed asset');
    }

    const { error } = await supabase
      .from('inventory_items')
      .update({
        location_id: parsedInput.data.location_id,
        category_id: parsedInput.data.category_id,
        name: parsedInput.data.name,
        description: parsedInput.data.description ?? null,
        brand: parsedInput.data.brand ?? null,
        model: parsedInput.data.model ?? null,
        serial_number: parsedInput.data.serial_number ?? null,
        acquisition_date: parsedInput.data.acquisition_date || null,
        warranty_expiry: parsedInput.data.warranty_expiry || null,
      })
      .eq('id', parsedInput.asset_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/inventory');
    return { success: true };
  });

// ============================================================================
// changeAssetStatus — ga_staff, ga_lead, admin only
// Validates transitions and auto-pauses maintenance schedules for
// broken and sold_disposed statuses
// ============================================================================
export const changeAssetStatus = authActionClient
  .schema(assetStatusChangeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions to change asset status');
    }

    // Fetch current asset
    const { data: asset } = await supabase
      .from('inventory_items')
      .select('id, status, company_id')
      .eq('id', parsedInput.asset_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Cannot transition from sold_disposed (terminal)
    if (asset.status === 'sold_disposed') {
      throw new Error('Cannot change status of a sold/disposed asset');
    }

    // Validate the transition is allowed
    const allowedTargets = ASSET_STATUS_TRANSITIONS[asset.status as keyof typeof ASSET_STATUS_TRANSITIONS];
    if (!allowedTargets.includes(parsedInput.new_status)) {
      throw new Error(`Cannot transition from ${asset.status} to ${parsedInput.new_status}`);
    }

    // Update status (and notes if provided)
    const updateData: Record<string, string | null> = {
      status: parsedInput.new_status,
    };
    if (parsedInput.note !== undefined) {
      updateData.notes = parsedInput.note;
    }

    const { error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', parsedInput.asset_id);

    if (error) {
      throw new Error(error.message);
    }

    // Maintenance schedule hooks based on new status
    if (parsedInput.new_status === 'sold_disposed') {
      // Terminal status: permanently deactivate (soft-delete) all schedules
      // Historical PM jobs remain per CONTEXT.md
      await deactivateSchedulesForAsset(supabase, parsedInput.asset_id);
    } else if (['broken', 'under_repair'].includes(parsedInput.new_status)) {
      // Auto-pause all active schedules, cancel open PM jobs
      await pauseSchedulesForAsset(supabase, parsedInput.asset_id, parsedInput.new_status);
    } else if (parsedInput.new_status === 'active') {
      // Auto-resume schedules that were auto-paused (paused_reason starts with 'auto:')
      // Manual pauses are NOT resumed automatically
      await resumeSchedulesForAsset(supabase, parsedInput.asset_id);
    }

    revalidatePath('/inventory');
    return { success: true };
  });

// ============================================================================
// createTransfer — ga_staff, ga_lead, admin only
// Enforces concurrent transfer guard (one pending movement per asset)
// ============================================================================
export const createTransfer = authActionClient
  .schema(assetTransferSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions to transfer assets');
    }

    // Fetch asset — must exist, not sold_disposed
    const { data: asset } = await supabase
      .from('inventory_items')
      .select('id, status, location_id, company_id')
      .eq('id', parsedInput.asset_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.status === 'sold_disposed') {
      throw new Error('Cannot transfer a sold/disposed asset');
    }

    // Concurrent transfer guard — check for existing pending movement
    const { count: pendingCount } = await supabase
      .from('inventory_movements')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', parsedInput.asset_id)
      .eq('status', 'pending')
      .is('deleted_at', null);

    if ((pendingCount ?? 0) > 0) {
      throw new Error('Asset has a pending transfer. Complete or cancel it first.');
    }

    const isLocationOnly = !parsedInput.receiver_id;

    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        company_id: profile.company_id,
        item_id: parsedInput.asset_id,
        from_location_id: asset.location_id,
        to_location_id: parsedInput.to_location_id,
        initiated_by: profile.id,
        receiver_id: parsedInput.receiver_id ?? null,
        status: isLocationOnly ? 'accepted' : 'pending',
        received_by: isLocationOnly ? profile.id : null,
        received_at: isLocationOnly ? new Date().toISOString() : null,
        notes: parsedInput.notes ?? null,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (isLocationOnly) {
      const { error: itemError } = await supabase
        .from('inventory_items')
        .update({ location_id: parsedInput.to_location_id })
        .eq('id', parsedInput.asset_id);
      if (itemError) throw new Error(itemError.message);
    }

    revalidatePath('/inventory');
    return { success: true, movementId: data.id };
  });

// ============================================================================
// acceptTransfer — designated receiver, ga_lead, or admin
// Updates movement to accepted and moves asset to destination location
// ============================================================================
export const acceptTransfer = authActionClient
  .schema(transferAcceptSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch movement — must be pending (RLS handles company scoping)
    const { data: movement } = await supabase
      .from('inventory_movements')
      .select('id, status, receiver_id, to_location_id, item_id, company_id')
      .eq('id', parsedInput.movement_id)
      .is('deleted_at', null)
      .single();

    if (!movement || movement.status !== 'pending') {
      throw new Error('Transfer not found or not in pending status');
    }

    // Verify user is the designated receiver
    const isReceiver = movement.receiver_id === profile.id;

    if (!isReceiver) {
      throw new Error('Only the designated receiver can accept this transfer');
    }

    // Update movement to accepted
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .update({
        status: 'accepted',
        received_by: profile.id,
        received_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.movement_id);

    if (movementError) {
      throw new Error(movementError.message);
    }

    // Move asset to destination location
    const { error: itemError } = await supabase
      .from('inventory_items')
      .update({ location_id: movement.to_location_id })
      .eq('id', movement.item_id);

    if (itemError) {
      throw new Error(itemError.message);
    }

    revalidatePath('/inventory');
    return { success: true };
  });

// ============================================================================
// rejectTransfer — designated receiver, ga_lead, or admin
// Rejection reason required
// ============================================================================
export const rejectTransfer = authActionClient
  .schema(transferRejectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch movement — must be pending (RLS handles company scoping)
    const { data: movement } = await supabase
      .from('inventory_movements')
      .select('id, status, receiver_id, company_id')
      .eq('id', parsedInput.movement_id)
      .is('deleted_at', null)
      .single();

    if (!movement || movement.status !== 'pending') {
      throw new Error('Transfer not found or not in pending status');
    }

    // Verify user is the designated receiver
    const isReceiver = movement.receiver_id === profile.id;

    if (!isReceiver) {
      throw new Error('Only the designated receiver can reject this transfer');
    }

    const { error } = await supabase
      .from('inventory_movements')
      .update({
        status: 'rejected',
        rejection_reason: parsedInput.reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.movement_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/inventory');
    return { success: true };
  });

// ============================================================================
// cancelTransfer — initiator, ga_lead, or admin
// ============================================================================
export const cancelTransfer = authActionClient
  .schema(transferCancelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch movement — must be pending (RLS handles company scoping)
    const { data: movement } = await supabase
      .from('inventory_movements')
      .select('id, status, initiated_by, company_id')
      .eq('id', parsedInput.movement_id)
      .is('deleted_at', null)
      .single();

    if (!movement || movement.status !== 'pending') {
      throw new Error('Transfer not found or not in pending status');
    }

    // Verify user is the initiator OR admin
    const isInitiator = movement.initiated_by === profile.id;
    const isAdmin = profile.role === 'admin';

    if (!isInitiator && !isAdmin) {
      throw new Error('Only the transfer initiator or an admin can cancel this transfer');
    }

    const { error } = await supabase
      .from('inventory_movements')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.movement_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/inventory');
    return { success: true };
  });

// ============================================================================
// getAssetPhotos — fetch condition photos for an asset with signed URLs
// Includes photos from creation, status changes, and all transfer events
// ============================================================================
export const getAssetPhotos = authActionClient
  .schema(z.object({ asset_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;

    // Fetch asset-level photos (creation and status changes)
    const { data: assetAttachments } = await supabase
      .from('media_attachments')
      .select('id, entity_type, entity_id, file_name, file_path, created_at')
      .in('entity_type', ['asset_creation', 'asset_status_change'])
      .eq('entity_id', parsedInput.asset_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    // Fetch all movement IDs for this asset
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('id')
      .eq('item_id', parsedInput.asset_id)
      .is('deleted_at', null);

    let transferAttachments: Array<{
      id: string;
      entity_type: string;
      entity_id: string;
      file_name: string;
      file_path: string;
      created_at: string;
    }> = [];

    if (movements && movements.length > 0) {
      const movementIds = movements.map((m) => m.id);

      const { data: transferPhotos } = await supabase
        .from('media_attachments')
        .select('id, entity_type, entity_id, file_name, file_path, created_at')
        .in('entity_type', ['asset_transfer_send', 'asset_transfer_receive', 'asset_transfer_reject'])
        .in('entity_id', movementIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      transferAttachments = transferPhotos ?? [];
    }

    const allAttachments = [...(assetAttachments ?? []), ...transferAttachments];

    if (allAttachments.length === 0) {
      return { success: true, photos: [] };
    }

    // Generate signed URLs with 1-hour expiry
    const { data: signedUrls } = await supabase.storage
      .from('asset-photos')
      .createSignedUrls(
        allAttachments.map((a) => a.file_path),
        3600
      );

    const photos = allAttachments.map((attachment, index) => ({
      id: attachment.id,
      entity_type: attachment.entity_type,
      entity_id: attachment.entity_id,
      file_name: attachment.file_name,
      url: signedUrls?.[index]?.signedUrl ?? '',
      created_at: attachment.created_at,
    }));

    return { success: true, photos };
  });

// ============================================================================
// getAssetInvoices — fetch invoice files for an asset with signed URLs
// ============================================================================
export const getAssetInvoices = authActionClient
  .schema(z.object({ asset_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;

    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, entity_type, entity_id, file_name, file_path, created_at')
      .eq('entity_type', 'asset_invoice')
      .eq('entity_id', parsedInput.asset_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!attachments || attachments.length === 0) {
      return { success: true, invoices: [] };
    }

    // Generate signed URLs with 1-hour expiry
    const { data: signedUrls } = await supabase.storage
      .from('asset-invoices')
      .createSignedUrls(
        attachments.map((a) => a.file_path),
        3600
      );

    const invoices = attachments.map((attachment, index) => ({
      id: attachment.id,
      entity_type: attachment.entity_type,
      entity_id: attachment.entity_id,
      file_name: attachment.file_name,
      url: signedUrls?.[index]?.signedUrl ?? '',
      created_at: attachment.created_at,
    }));

    return { success: true, invoices };
  });

// ============================================================================
// deleteAssetPhotos — soft-delete media_attachments + remove from storage
// ga_staff, ga_lead, admin only
// ============================================================================
export const deleteAssetPhotos = authActionClient
  .schema(z.object({
    photo_ids: z.array(z.string().uuid()).min(1).max(10),
    bucket: z.enum(['asset-photos', 'asset-invoices']),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { profile } = ctx;

    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    // Use admin client to bypass RLS for both read and soft-delete
    const adminSupabase = createAdminClient();

    // Fetch the attachments to get file_path for storage removal
    const { data: attachments, error: fetchError } = await adminSupabase
      .from('media_attachments')
      .select('id, file_path, entity_id, company_id')
      .in('id', parsedInput.photo_ids)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null);

    if (fetchError || !attachments || attachments.length === 0) {
      throw new Error('No matching attachments found');
    }

    // Soft-delete the media_attachments records
    const { error: deleteError } = await adminSupabase
      .from('media_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', attachments.map((a) => a.id));

    if (deleteError) {
      throw new Error('Failed to delete attachments');
    }

    // Remove files from storage
    const filePaths = attachments.map((a) => a.file_path);
    await adminSupabase.storage.from(parsedInput.bucket).remove(filePaths);

    return { success: true, deleted: attachments.length };
  });

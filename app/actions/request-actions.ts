'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { requestSubmitSchema, requestEditSchema, triageSchema, rejectSchema } from '@/lib/validations/request-schema';
import { z } from 'zod';

// ============================================================================
// createRequest — any authenticated user, auto-fills division from profile
// ============================================================================
export const createRequest = authActionClient
  .schema(requestSubmitSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Guard: user must have a division assigned
    if (!profile.division_id) {
      throw new Error('Your account has no division assigned. Contact your administrator.');
    }

    // Generate display_id atomically via DB function
    const { data: displayId, error: rpcError } = await supabase
      .rpc('generate_request_display_id', { p_company_id: profile.company_id });

    if (rpcError || !displayId) {
      throw new Error('Failed to generate request ID. Please try again.');
    }

    // Auto-generate title from first 100 chars of description (normalized whitespace)
    const title = parsedInput.description.replace(/\s+/g, ' ').trim().slice(0, 100);

    const { data, error } = await supabase
      .from('requests')
      .insert({
        company_id: profile.company_id,
        division_id: profile.division_id,
        location_id: parsedInput.location_id,
        requester_id: profile.id,
        display_id: displayId,
        title,
        description: parsedInput.description,
        status: 'submitted',
      })
      .select('id, display_id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true, requestId: data.id, displayId: data.display_id };
  });

// ============================================================================
// updateRequest — requester only, while status = 'submitted'
// ============================================================================
export const updateRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: requestEditSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch the request — must be owned by requester and in submitted status
    const { data: existing } = await supabase
      .from('requests')
      .select('id, status, requester_id')
      .eq('id', parsedInput.id)
      .eq('requester_id', profile.id)
      .eq('status', 'submitted')
      .single();

    if (!existing) {
      throw new Error('Cannot edit — request is not in New status or you are not the requester');
    }

    // Regenerate title from updated description
    const title = parsedInput.data.description.replace(/\s+/g, ' ').trim().slice(0, 100);

    const { error } = await supabase
      .from('requests')
      .update({
        description: parsedInput.data.description,
        location_id: parsedInput.data.location_id,
        title,
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// triageRequest — ga_lead or admin only, request must be in 'submitted' status
// ============================================================================
export const triageRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: triageSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Triage access required');
    }

    // Verify request is in submitted status
    const { data: request } = await supabase
      .from('requests')
      .select('id, status')
      .eq('id', parsedInput.id)
      .single();

    if (!request || request.status !== 'submitted') {
      throw new Error('Request can only be triaged when in New status');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        category_id: parsedInput.data.category_id,
        priority: parsedInput.data.priority,
        assigned_to: parsedInput.data.assigned_to,
        status: 'triaged',
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// cancelRequest — requester only, while status = 'submitted'
// ============================================================================
export const cancelRequest = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    const { data, error } = await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', parsedInput.id)
      .eq('requester_id', profile.id)
      .eq('status', 'submitted')
      .select('id');

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('Cannot cancel — request is not in New status or you are not the requester');
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// rejectRequest — ga_lead or admin only, from 'submitted' or 'triaged'
// ============================================================================
export const rejectRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: rejectSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Triage access required');
    }

    // Verify request is in a rejectable status
    const { data: request } = await supabase
      .from('requests')
      .select('id, status')
      .eq('id', parsedInput.id)
      .single();

    if (!request || !['submitted', 'triaged'].includes(request.status)) {
      throw new Error('Request can only be rejected when in New or Triaged status');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        status: 'rejected',
        rejection_reason: parsedInput.data.reason,
        rejected_at: new Date().toISOString(),
        rejected_by: profile.id,
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// deleteMediaAttachment — requester only, while request status = 'submitted'
// ============================================================================
export const deleteMediaAttachment = authActionClient
  .schema(z.object({ attachmentId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch the attachment
    const { data: attachment } = await supabase
      .from('media_attachments')
      .select('id, entity_id, entity_type')
      .eq('id', parsedInput.attachmentId)
      .is('deleted_at', null)
      .single();

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Verify entity_type is 'request'
    if (attachment.entity_type !== 'request') {
      throw new Error('Attachment not found');
    }

    // Verify user owns the parent request and it's in submitted status
    const { data: request } = await supabase
      .from('requests')
      .select('id, status, requester_id')
      .eq('id', attachment.entity_id)
      .eq('requester_id', profile.id)
      .eq('status', 'submitted')
      .single();

    if (!request) {
      throw new Error('Cannot delete — request is not in New status or you are not the requester');
    }

    // Soft-delete the attachment
    const { error } = await supabase
      .from('media_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsedInput.attachmentId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// getRequestPhotos — fetch signed URLs for request photos (6 hour expiry)
// ============================================================================
export const getRequestPhotos = authActionClient
  .schema(z.object({ requestId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;

    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, file_name, file_path, mime_type')
      .eq('entity_type', 'request')
      .eq('entity_id', parsedInput.requestId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (!attachments || attachments.length === 0) {
      return { success: true, photos: [] };
    }

    // Generate signed URLs with 6-hour expiry
    const { data: signedUrls } = await supabase.storage
      .from('request-photos')
      .createSignedUrls(
        attachments.map((a) => a.file_path),
        21600
      );

    const photos = attachments.map((attachment, index) => ({
      id: attachment.id,
      fileName: attachment.file_name,
      url: signedUrls?.[index]?.signedUrl ?? '',
      mimeType: attachment.mime_type,
    }));

    return { success: true, photos };
  });

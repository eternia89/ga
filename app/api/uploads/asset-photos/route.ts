import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GA_ROLES } from '@/lib/constants/roles';

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Map from photo_type form field to entity_type stored in media_attachments
const PHOTO_TYPE_TO_ENTITY_TYPE: Record<string, string> = {
  creation: 'asset_creation',
  status_change: 'asset_status_change',
  transfer_send: 'asset_transfer_send',
  transfer_receive: 'asset_transfer_receive',
  transfer_reject: 'asset_transfer_reject',
};

// Transfer-related entity types that use movement_id as entity_id
const TRANSFER_ENTITY_TYPES = new Set([
  'asset_transfer_send',
  'asset_transfer_receive',
  'asset_transfer_reject',
]);

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const assetId = formData.get('asset_id') as string | null;
    const movementId = formData.get('movement_id') as string | null;
    const photoType = formData.get('photo_type') as string | null;

    // Validate photo_type
    if (!photoType || !PHOTO_TYPE_TO_ENTITY_TYPE[photoType]) {
      return NextResponse.json(
        { error: 'photo_type is required and must be one of: creation, status_change, transfer_send, transfer_receive, transfer_reject' },
        { status: 400 }
      );
    }

    const entityType = PHOTO_TYPE_TO_ENTITY_TYPE[photoType];
    const isTransferType = TRANSFER_ENTITY_TYPES.has(entityType);

    // Validate entity ID — transfer types need movement_id, asset types need asset_id
    if (isTransferType && !movementId) {
      return NextResponse.json(
        { error: 'movement_id is required for transfer photo types' },
        { status: 400 }
      );
    }

    if (!isTransferType && !assetId) {
      return NextResponse.json(
        { error: 'asset_id is required for creation and status_change photo types' },
        { status: 400 }
      );
    }

    const entityId = isTransferType ? movementId! : assetId!;

    // Validate auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, company_id, role, deleted_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.deleted_at) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 401 });
    }

    // Role check — only ga_staff, ga_lead, admin can upload asset photos
    if (!(GA_ROLES as readonly string[]).includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify entity exists and get its company_id for storage path and media_attachment insert
    let entityCompanyId: string;
    if (isTransferType) {
      // Transfer types use movement_id as entity_id — fetch from inventory_movements
      const { data: movement } = await supabase
        .from('inventory_movements')
        .select('id, company_id')
        .eq('id', entityId)
        .single();
      if (!movement) {
        return NextResponse.json({ error: 'Movement not found' }, { status: 400 });
      }
      entityCompanyId = movement.company_id;
    } else {
      // Asset types use asset_id — fetch from inventory_items
      const { data: asset } = await supabase
        .from('inventory_items')
        .select('id, company_id')
        .eq('id', entityId)
        .is('deleted_at', null)
        .single();
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 400 });
      }
      entityCompanyId = asset.company_id;
    }

    // Extract files from form data
    const photoEntries = formData.getAll('photos');
    const files: File[] = photoEntries.filter((entry): entry is File => entry instanceof File);

    // Deduplicate by name and size
    const uniqueFiles = files.filter((file, index, arr) =>
      arr.findIndex((f) => f.name === file.name && f.size === file.size) === index
    );

    if (uniqueFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (uniqueFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of uniqueFiles) {
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 5MB limit` },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" is not an allowed image type (JPEG, PNG, or WebP)` },
          { status: 400 }
        );
      }
    }

    // Check existing attachment count for this entity
    const { count: existingCount } = await supabase
      .from('media_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null);

    const currentCount = existingCount ?? 0;

    if (currentCount + uniqueFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Cannot upload — would exceed ${MAX_FILES} photo limit (currently ${currentCount})` },
        { status: 400 }
      );
    }

    // Upload using admin client (service_role bypasses storage RLS for writes)
    const adminSupabase = createAdminClient();
    let uploadedCount = 0;

    for (let i = 0; i < uniqueFiles.length; i++) {
      const file = uniqueFiles[i];

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${entityCompanyId}/${entityId}/${crypto.randomUUID()}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('asset-photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        continue;
      }

      // Insert media_attachments record
      const { error: insertError } = await adminSupabase
        .from('media_attachments')
        .insert({
          company_id: entityCompanyId,
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          sort_order: currentCount + i,
          uploaded_by: user.id,
        });

      if (insertError) {
        console.error('Insert error:', insertError.message);
        // Clean up uploaded file
        const { error: cleanupError } = await adminSupabase.storage.from('asset-photos').remove([uploadData.path]);
        if (cleanupError) {
          console.error('[asset-photos] Failed to cleanup storage after DB error:', cleanupError.message);
        }
        continue;
      }

      uploadedCount++;
    }

    if (uploadedCount === 0) {
      return NextResponse.json(
        { error: 'All file uploads failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: uploadedCount,
      partial: uploadedCount < uniqueFiles.length,
    });
  } catch (error) {
    console.error('Asset photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

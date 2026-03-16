import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const assetId = formData.get('asset_id') as string | null;

    if (!assetId || typeof assetId !== 'string') {
      return NextResponse.json({ error: 'asset_id is required' }, { status: 400 });
    }

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

    // Role check — only ga_staff, ga_lead, admin can upload invoices
    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify the asset exists (RLS handles company scoping)
    const { data: asset } = await supabase
      .from('inventory_items')
      .select('id, company_id')
      .eq('id', assetId)
      .is('deleted_at', null)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 400 });
    }

    // Extract files from form data
    const invoiceEntries = formData.getAll('invoices');
    const files: File[] = invoiceEntries.filter((entry): entry is File => entry instanceof File);

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
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" is not an allowed type (JPEG, PNG, WebP, or PDF)` },
          { status: 400 }
        );
      }
    }

    // Check existing attachment count
    const { count: existingCount } = await supabase
      .from('media_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', 'asset_invoice')
      .eq('entity_id', assetId)
      .is('deleted_at', null);

    const currentCount = existingCount ?? 0;

    if (currentCount + uniqueFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Cannot upload — would exceed ${MAX_FILES} invoice limit (currently ${currentCount})` },
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
      const storagePath = `${profile.company_id}/${assetId}/${crypto.randomUUID()}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('asset-invoices')
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
          company_id: profile.company_id,
          entity_type: 'asset_invoice',
          entity_id: assetId,
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
        await adminSupabase.storage.from('asset-invoices').remove([uploadData.path]);
        continue;
      }

      uploadedCount++;
    }

    return NextResponse.json({ success: true, count: uploadedCount });
  } catch (error) {
    console.error('Invoice upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

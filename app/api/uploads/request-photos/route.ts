import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_FILES = 3;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const requestId = formData.get('request_id') as string | null;

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
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
      .select('id, company_id, division_id, role, deleted_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.deleted_at) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 401 });
    }

    // Verify request belongs to user and is in submitted status
    const { data: requestRecord } = await supabase
      .from('requests')
      .select('id, company_id, status, requester_id')
      .eq('id', requestId)
      .eq('requester_id', user.id)
      .eq('status', 'submitted')
      .single();

    if (!requestRecord) {
      return NextResponse.json(
        { error: 'Request not found or not editable' },
        { status: 400 }
      );
    }

    // Extract files from form data
    const files: File[] = [];
    for (const [, value] of formData.entries()) {
      if (value instanceof File && value.name !== 'request_id') {
        files.push(value);
      }
    }

    // Also check for files keyed as 'photos' or 'file'
    const photoEntries = formData.getAll('photos');
    for (const entry of photoEntries) {
      if (entry instanceof File) {
        files.push(entry);
      }
    }

    // Deduplicate by combining and filtering
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

    // Check existing attachment count
    const { count: existingCount } = await supabase
      .from('media_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', 'request')
      .eq('entity_id', requestId)
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

      // Sanitize filename: replace spaces and special chars
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${requestRecord.company_id}/${requestId}/${crypto.randomUUID()}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('request-photos')
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
          company_id: requestRecord.company_id,
          entity_type: 'request',
          entity_id: requestId,
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
        await adminSupabase.storage.from('request-photos').remove([uploadData.path]);
        continue;
      }

      uploadedCount++;
    }

    return NextResponse.json({ success: true, count: uploadedCount });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

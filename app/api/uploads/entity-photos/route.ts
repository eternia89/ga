import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type EntityType = 'request' | 'job' | 'inventory' | 'job_comment';

interface EntityConfig {
  bucket: string;
  maxFiles: number;
  /** DB table name for existence/ownership check */
  table: string;
}

const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  request: { bucket: 'request-photos', maxFiles: 10, table: 'requests' },
  job: { bucket: 'job-photos', maxFiles: 10, table: 'jobs' },
  inventory: { bucket: 'inventory-photos', maxFiles: 10, table: 'assets' },
  job_comment: { bucket: 'job-photos', maxFiles: 3, table: 'job_comments' },
};

function isEntityType(value: unknown): value is EntityType {
  return typeof value === 'string' && value in ENTITY_CONFIGS;
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const entityType = formData.get('entity_type') as string | null;
    const entityId = formData.get('entity_id') as string | null;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    if (!isEntityType(entityType)) {
      return NextResponse.json(
        { error: `entity_type must be one of: ${Object.keys(ENTITY_CONFIGS).join(', ')}` },
        { status: 400 }
      );
    }

    const config = ENTITY_CONFIGS[entityType];

    // Validate auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile and verify not deactivated
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, company_id, division_id, role, deleted_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.deleted_at) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 401 });
    }

    // Entity ownership validation
    if (entityType === 'request') {
      // Requests: requester must own it and status must be submitted
      const { data: requestRecord } = await supabase
        .from('requests')
        .select('id, company_id, status, requester_id')
        .eq('id', entityId)
        .eq('requester_id', user.id)
        .eq('status', 'submitted')
        .single();

      if (!requestRecord) {
        return NextResponse.json(
          { error: 'Request not found or not editable' },
          { status: 400 }
        );
      }
    } else {
      // For other entity types: verify entity exists and belongs to user's company
      const { data: entityRecord } = await supabase
        .from(config.table as Parameters<typeof supabase.from>[0])
        .select('id, company_id')
        .eq('id', entityId)
        .eq('company_id', profile.company_id)
        .is('deleted_at', null)
        .single();

      if (!entityRecord) {
        return NextResponse.json(
          { error: `${entityType} not found or access denied` },
          { status: 400 }
        );
      }
    }

    // Extract files from form data
    const photoEntries = formData.getAll('photos');
    const files: File[] = photoEntries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > config.maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${config.maxFiles} files allowed per upload batch` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
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

    // Check existing attachment count against maxFiles
    const { count: existingCount } = await supabase
      .from('media_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null);

    const currentCount = existingCount ?? 0;

    if (currentCount + files.length > config.maxFiles) {
      return NextResponse.json(
        {
          error: `Cannot upload — would exceed ${config.maxFiles} photo limit (currently ${currentCount})`,
        },
        { status: 400 }
      );
    }

    // Upload using admin client (service_role bypasses storage RLS for writes)
    const adminSupabase = createAdminClient();
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Sanitize filename: replace spaces and special chars
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${profile.company_id}/${entityType}/${entityId}/${crypto.randomUUID()}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from(config.bucket)
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
        await adminSupabase.storage.from(config.bucket).remove([uploadData.path]);
        continue;
      }

      uploadedCount++;
    }

    return NextResponse.json({ success: true, count: uploadedCount });
  } catch (error) {
    console.error('Entity photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

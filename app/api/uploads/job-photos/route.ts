import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const commentId = formData.get('comment_id') as string | null;

    if (!commentId || typeof commentId !== 'string') {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 });
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

    // Verify comment exists and belongs to a job the user has access to
    const { data: comment } = await supabase
      .from('job_comments')
      .select('id, job_id, user_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only the comment author can attach a photo
    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to attach photo to this comment' }, { status: 403 });
    }

    // Verify the job belongs to the user's company
    const { data: job } = await supabase
      .from('jobs')
      .select('id, company_id, assigned_to')
      .eq('id', comment.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 403 });
    }

    // Verify user has permission (ga_lead/admin or assigned PIC)
    const isLead = ['ga_lead', 'admin'].includes(profile.role);
    const isPIC = job.assigned_to === user.id;

    if (!isLead && !isPIC) {
      return NextResponse.json({ error: 'Only GA Lead, Admin, or assigned PIC can upload photos' }, { status: 403 });
    }

    // Extract the photo file
    const photo = formData.get('photo') as File | null;

    if (!photo || !(photo instanceof File)) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    // Validate file
    if (photo.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `File exceeds 5MB limit` }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: `File is not an allowed image type (JPEG, PNG, or WebP)` },
        { status: 400 }
      );
    }

    // Upload using admin client (service_role bypasses storage RLS for writes)
    const adminSupabase = createAdminClient();

    const sanitizedName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${job.company_id}/${job.id}/${commentId}/${crypto.randomUUID()}-${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('job-photos')
      .upload(storagePath, photo, {
        cacheControl: '3600',
        upsert: false,
        contentType: photo.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Insert media_attachments record
    const { data: attachment, error: insertError } = await adminSupabase
      .from('media_attachments')
      .insert({
        company_id: job.company_id,
        entity_type: 'job_comment',
        entity_id: commentId,
        file_name: photo.name,
        file_path: uploadData.path,
        file_size: photo.size,
        mime_type: photo.type,
        sort_order: 0,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError.message);
      // Clean up uploaded file
      await adminSupabase.storage.from('job-photos').remove([uploadData.path]);
      return NextResponse.json({ error: 'Failed to save attachment record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    console.error('Job photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCompanyAccess } from '@/lib/auth/company-access';

interface VisionRequestBody {
  imageBase64: string;
  attachmentId: string;
}

interface LabelAnnotation {
  description: string;
  score?: number;
}

interface VisionAnnotateResponse {
  responses?: Array<{
    labelAnnotations?: LabelAnnotation[];
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify profile exists and is not deactivated
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, company_id, deleted_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.deleted_at) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 401 });
    }

    const body: VisionRequestBody = await request.json();
    const { imageBase64, attachmentId } = body;

    if (!imageBase64 || !attachmentId) {
      return NextResponse.json(
        { error: 'imageBase64 and attachmentId are required' },
        { status: 400 }
      );
    }

    // Read API key — server-side only, no NEXT_PUBLIC_ prefix
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      // Graceful degradation — not a hard error
      return NextResponse.json({ description: null, error: 'Vision API not configured' });
    }

    try {
      // Call Google Vision REST API
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: imageBase64 },
                features: [{ type: 'LABEL_DETECTION', maxResults: 5 }],
              },
            ],
          }),
        }
      );

      if (!visionResponse.ok) {
        console.error('Vision API error:', visionResponse.status, await visionResponse.text());
        return NextResponse.json({ description: null });
      }

      const data: VisionAnnotateResponse = await visionResponse.json();

      // Extract labels and join into a comma-separated description
      const labels = data.responses?.[0]?.labelAnnotations ?? [];
      const description =
        labels.length > 0
          ? labels.map((l: LabelAnnotation) => l.description).join(', ')
          : null;

      if (description) {
        // Fetch attachment to validate company access before updating
        const adminClient = createAdminClient();
        const { data: attachment } = await adminClient
          .from('media_attachments')
          .select('id, company_id')
          .eq('id', attachmentId)
          .is('deleted_at', null)
          .single();

        if (!attachment) {
          return NextResponse.json({ description });
        }

        try {
          await assertCompanyAccess(adminClient, user.id, attachment.company_id, profile.company_id);
        } catch {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error: updateError } = await adminClient
          .from('media_attachments')
          .update({ description })
          .eq('id', attachmentId);

        if (updateError) {
          console.error('Failed to update attachment description:', updateError.message);
        }
      }

      return NextResponse.json({ description });
    } catch (visionError) {
      // Never block the caller — Vision errors are non-fatal
      console.error('Vision API call failed:', visionError);
      return NextResponse.json({ description: null });
    }
  } catch (error) {
    console.error('Vision describe route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

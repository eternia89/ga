'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RequestWithRelations } from '@/lib/types/database';
import { RequestDetailInfo } from './request-detail-info';
import { RequestDetailActions } from './request-detail-actions';
import { RequestTimeline, TimelineEvent } from './request-timeline';
import { RequestFeedbackDialog } from './request-feedback-dialog';
import { Button } from '@/components/ui/button';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

export interface LinkedJob {
  id: string;
  display_id: string;
  title: string;
  status: string;
}

interface RequestDetailClientProps {
  request: RequestWithRelations;
  photoUrls: PhotoItem[];
  timelineEvents: TimelineEvent[];
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  linkedJobs: LinkedJob[];
}

export function RequestDetailClient({
  request,
  photoUrls,
  timelineEvents,
  categories,
  users,
  locations,
  currentUserId,
  currentUserRole,
  linkedJobs,
}: RequestDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FORM_ID = 'request-detail-form';

  // Auto-open feedback dialog when ?feedback=1 is in the URL (survives router.refresh)
  useEffect(() => {
    if (searchParams.get('feedback') === '1' && request.status === 'accepted' && !request.feedback_rating) {
      setFeedbackOpen(true);
      // Clean up the URL param
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams, request.status, request.feedback_rating]);

  const handleActionSuccess = () => {
    router.refresh();
  };

  const handleAccepted = () => {
    // Navigate with ?feedback=1 to trigger auto-open after refresh
    router.push(`${window.location.pathname}?feedback=1`);
    router.refresh();
  };

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineEvents]);

  return (
  <>
    <div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
      {/* Left column: info + actions */}
      <div className="space-y-6">
        <RequestDetailInfo
          request={request}
          photoUrls={photoUrls}
          categories={categories}
          users={users}
          locations={locations}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onEditSuccess={handleActionSuccess}
          onTriageSuccess={handleActionSuccess}
          linkedJobs={linkedJobs}
          formId={FORM_ID}
          onDirtyChange={setIsDirty}
          onSubmittingChange={setIsSubmitting}
        />

        <RequestDetailActions
          request={request}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onActionSuccess={handleActionSuccess}
          onAccepted={handleAccepted}
        />
      </div>

      {/* Right column: timeline */}
      <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="rounded-lg border p-4 flex flex-col flex-1 min-h-0">
          <h2 className="text-sm font-semibold mb-4 shrink-0">Activity Timeline</h2>
          <div ref={timelineRef} className="overflow-y-auto flex-1 min-h-0">
            <RequestTimeline events={timelineEvents} />
          </div>
        </div>
      </div>
    </div>

    {isDirty && (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
        <div className="mx-auto max-w-[1300px] px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Unsaved changes</p>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    )}

    <RequestFeedbackDialog
      open={feedbackOpen}
      onOpenChange={setFeedbackOpen}
      requestId={request.id}
      requestDisplayId={request.display_id}
      onSuccess={handleActionSuccess}
    />
  </>
  );
}

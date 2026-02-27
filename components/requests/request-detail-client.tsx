'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequestWithRelations } from '@/lib/types/database';
import { RequestDetailInfo } from './request-detail-info';
import { RequestDetailActions } from './request-detail-actions';
import { RequestTimeline, TimelineEvent } from './request-timeline';
import { RequestFeedbackDialog } from './request-feedback-dialog';

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleActionSuccess = () => {
    router.refresh();
  };

  const handleAccepted = () => {
    // Small delay to let the acceptance dialog close animation finish
    setTimeout(() => {
      setFeedbackOpen(true);
    }, 300);
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

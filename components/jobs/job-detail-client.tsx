'use client';

import { useRouter } from 'next/navigation';
import { JobWithRelations, JobComment } from '@/lib/types/database';
import { JobDetailInfo } from './job-detail-info';
import { JobDetailActions } from './job-detail-actions';
import { JobTimeline, JobTimelineEvent } from './job-timeline';
import { JobCommentForm } from './job-comment-form';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
  commentId: string;
}

interface JobDetailClientProps {
  job: JobWithRelations;
  timelineEvents: JobTimelineEvent[];
  comments: JobComment[];
  commentPhotos: PhotoItem[];
  currentUserId: string;
  currentUserRole: string;
  users: { id: string; name: string }[];
  approvedByName?: string | null;
  approvalRejectedByName?: string | null;
}

export function JobDetailClient({
  job,
  timelineEvents,
  comments,
  commentPhotos,
  currentUserId,
  currentUserRole,
  users,
  approvedByName,
  approvalRejectedByName,
}: JobDetailClientProps) {
  const router = useRouter();

  const handleActionSuccess = () => {
    router.refresh();
  };

  const canComment =
    ['ga_lead', 'admin'].includes(currentUserRole) ||
    job.assigned_to === currentUserId;

  return (
    <div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
      {/* Left column: info + actions */}
      <div className="space-y-4">
        <JobDetailInfo
          job={job}
          approvedByName={approvedByName}
          approvalRejectedByName={approvalRejectedByName}
        />

        <JobDetailActions
          job={job}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          users={users}
          onActionSuccess={handleActionSuccess}
        />
      </div>

      {/* Right column: timeline + comment form */}
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold mb-4">Activity Timeline</h2>
          <JobTimeline
            events={timelineEvents}
            comments={comments}
            commentPhotos={commentPhotos}
          />
        </div>

        {canComment && (
          <JobCommentForm
            jobId={job.id}
            onSuccess={handleActionSuccess}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobWithRelations, JobComment } from '@/lib/types/database';
import { JobDetailInfo } from './job-detail-info';
import { JobDetailActions } from './job-detail-actions';
import { JobTimeline, JobTimelineEvent } from './job-timeline';
import { JobCommentForm } from './job-comment-form';
import { PMChecklist } from '@/components/maintenance/pm-checklist';
import { Button } from '@/components/ui/button';

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
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
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
  categories,
  locations,
  approvedByName,
  approvalRejectedByName,
}: JobDetailClientProps) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FORM_ID = 'job-detail-form';

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const canEdit = isGaLeadOrAdmin && !['completed', 'cancelled'].includes(job.status);

  const handleActionSuccess = () => {
    router.refresh();
  };

  const canComment =
    ['ga_lead', 'admin'].includes(currentUserRole) ||
    job.assigned_to === currentUserId;

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineEvents, comments]);

  return (
    <div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
      {/* Left column: info + actions + PM checklist */}
      <div className="space-y-4">
        <JobDetailInfo
          job={job}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          approvedByName={approvedByName}
          approvalRejectedByName={approvalRejectedByName}
          onActionSuccess={handleActionSuccess}
          categories={categories}
          locations={locations}
          users={users}
          formId={FORM_ID}
          onDirtyChange={setIsDirty}
          onSubmittingChange={setIsSubmitting}
        />

        <JobDetailActions
          job={job}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          users={users.map((u) => ({ id: u.id, full_name: u.name }))}
          onActionSuccess={handleActionSuccess}
        />

        {/* PM Checklist — shown inline for PM jobs with a checklist */}
        {job.job_type === 'preventive_maintenance' && job.checklist_responses && (
          <PMChecklist
            jobId={job.id}
            checklist={job.checklist_responses}
            jobStatus={job.status}
            canEdit={
              (['ga_lead', 'admin'].includes(currentUserRole) ||
                job.assigned_to === currentUserId) &&
              ['assigned', 'in_progress'].includes(job.status)
            }
          />
        )}
      </div>

      {/* Right column: timeline + comment form */}
      <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="rounded-lg border p-4 flex flex-col flex-1 min-h-0">
          <h2 className="text-sm font-semibold mb-4 shrink-0">Activity Timeline</h2>
          <div ref={timelineRef} className="overflow-y-auto flex-1 min-h-0">
            <JobTimeline
              events={timelineEvents}
              comments={comments}
              commentPhotos={commentPhotos}
            />
          </div>
        </div>

        {canComment && (
          <div className="shrink-0 mt-4">
            <JobCommentForm
              jobId={job.id}
              jobStatus={job.status}
              onSuccess={handleActionSuccess}
            />
          </div>
        )}
      </div>

      {canEdit && isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
          <div className="mx-auto max-w-[1300px] px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unsaved changes</p>
            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

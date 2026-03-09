'use client';

import { JobModal } from '@/components/jobs/job-modal';

interface JobViewModalProps {
  jobId: string | null;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUserRole: string;
  onActionSuccess?: () => void;
  /** Ordered list of job IDs for prev/next navigation */
  jobIds?: string[];
  /** Called when user navigates to a different job */
  onNavigate?: (jobId: string) => void;
}

export function JobViewModal({
  jobId,
  onOpenChange,
  currentUserId,
  currentUserRole,
  onActionSuccess,
  jobIds = [],
  onNavigate,
}: JobViewModalProps) {
  return (
    <JobModal
      mode="view"
      jobId={jobId}
      onOpenChange={onOpenChange}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      onActionSuccess={onActionSuccess}
      jobIds={jobIds}
      onNavigate={onNavigate}
    />
  );
}

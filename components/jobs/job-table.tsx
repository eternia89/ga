'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { JobWithRelations } from '@/lib/types/database';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { jobColumns } from './job-columns';
import { JobFilters, jobFilterParsers } from './job-filters';
import { JobCancelDialog } from './job-cancel-dialog';
import { JobViewModal } from './job-view-modal';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';

type PhotoItem = { id: string; url: string; fileName: string };

interface JobTableProps {
  data: JobWithRelations[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  photosByJob: Record<string, PhotoItem[]>;
  initialViewId?: string;
}

export function JobTable({
  data,
  users,
  currentUserId,
  currentUserRole,
  photosByJob,
  initialViewId,
}: JobTableProps) {
  const router = useRouter();
  const [filters] = useQueryStates(jobFilterParsers);

  // View modal state
  const [viewJobId, setViewJobId] = useState<string | null>(initialViewId ?? null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [cancellingDisplayId, setCancellingDisplayId] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Client-side filtering based on URL params
  const filteredData = useMemo(() => {
    return data.filter((job) => {
      // Status filter
      if (filters.status && job.status !== filters.status) return false;

      // Priority filter
      if (filters.priority && job.priority !== filters.priority) return false;

      // PIC filter
      if (filters.pic_id && job.assigned_to !== filters.pic_id) return false;

      // Date range filter
      if (filters.from) {
        const fromDate = startOfDay(parseISO(filters.from));
        if (isBefore(parseISO(job.created_at), fromDate)) return false;
      }
      if (filters.to) {
        const toDate = endOfDay(parseISO(filters.to));
        if (isAfter(parseISO(job.created_at), toDate)) return false;
      }

      // My Assigned filter
      if (filters.mine === 'true' && job.assigned_to !== currentUserId) return false;

      // Search filter (title, display_id)
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesDisplayId = job.display_id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDisplayId) return false;
      }

      return true;
    });
  }, [data, filters, currentUserId]);

  const handleView = (job: JobWithRelations) => {
    setViewJobId(job.id);
  };

  const handlePhotoClick = (photos: PhotoItem[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleModalActionSuccess = () => {
    setFeedback({ type: 'success', message: 'Action completed successfully' });
    router.refresh();
  };

  const handleCancel = (job: JobWithRelations) => {
    setCancellingJobId(job.id);
    setCancellingDisplayId(job.display_id);
    setCancelOpen(true);
  };

  const handleCancelSuccess = () => {
    setFeedback({ type: 'success', message: 'Job cancelled successfully' });
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <JobFilters users={users} currentUserRole={currentUserRole} />

      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <DataTable
        columns={jobColumns}
        data={filteredData}
        emptyMessage="No jobs found"
        meta={{
          onView: handleView,
          photosByJob,
          onPhotoClick: handlePhotoClick,
        }}
      />

      <JobCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        jobId={cancellingJobId}
        jobDisplayId={cancellingDisplayId}
        onSuccess={handleCancelSuccess}
      />

      {/* Job view modal */}
      <JobViewModal
        jobId={viewJobId}
        onOpenChange={(open) => { if (!open) setViewJobId(null); }}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onActionSuccess={handleModalActionSuccess}
        jobIds={filteredData.map((j) => j.id)}
        onNavigate={setViewJobId}
      />

      {lightboxOpen && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

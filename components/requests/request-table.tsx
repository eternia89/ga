'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { RequestWithRelations } from '@/lib/types/database';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { requestColumns } from './request-columns';
import { RequestFilters, filterParsers } from './request-filters';
import { RequestViewModal } from './request-view-modal';
import { PhotoLightbox } from './request-photo-lightbox';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

interface RequestTableProps {
  data: RequestWithRelations[];
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  photosByRequest: Record<string, PhotoItem[]>;
  initialViewId?: string;
}

export function RequestTable({
  data,
  categories,
  users,
  currentUserId,
  currentUserRole,
  photosByRequest,
  initialViewId,
}: RequestTableProps) {
  const router = useRouter();
  const [filters] = useQueryStates(filterParsers);

  // View modal state
  const [viewRequestId, setViewRequestId] = useState<string | null>(initialViewId ?? null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Client-side filtering based on URL params
  const filteredData = useMemo(() => {
    return data.filter((req) => {
      // Status filter
      if (filters.status && req.status !== filters.status) return false;

      // Priority filter
      if (filters.priority && req.priority !== filters.priority) return false;

      // Category filter
      if (filters.category_id && req.category_id !== filters.category_id) return false;

      // Date range filter
      if (filters.from) {
        const fromDate = startOfDay(parseISO(filters.from));
        if (isBefore(parseISO(req.created_at), fromDate)) return false;
      }
      if (filters.to) {
        const toDate = endOfDay(parseISO(filters.to));
        if (isAfter(parseISO(req.created_at), toDate)) return false;
      }

      // My Requests filter (submitted by me)
      if (filters.my_requests === 'true' && req.requester_id !== currentUserId) return false;

      // My Assigned filter
      if (filters.mine === 'true' && req.assigned_to !== currentUserId) return false;

      // Search filter (title, description, display_id)
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matchesTitle = req.title?.toLowerCase().includes(q);
        const matchesDescription = req.description?.toLowerCase().includes(q);
        const matchesDisplayId = req.display_id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDescription && !matchesDisplayId) return false;
      }

      return true;
    });
  }, [data, filters, currentUserId]);

  const handleView = (request: RequestWithRelations) => {
    setViewRequestId(request.id);
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

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <RequestFilters
        categories={categories}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />

      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <DataTable
        columns={requestColumns}
        data={filteredData}
        emptyMessage="No requests found"
        meta={{
          onView: handleView,
          onPhotoClick: handlePhotoClick,
          photosByRequest,
          currentUserId,
          currentUserRole,
        }}
      />

      {/* Request view modal */}
      <RequestViewModal
        requestId={viewRequestId}
        onOpenChange={(open) => { if (!open) setViewRequestId(null); }}
        categories={categories}
        users={users}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onActionSuccess={handleModalActionSuccess}
        requestIds={filteredData.map((r) => r.id)}
        onNavigate={setViewRequestId}
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

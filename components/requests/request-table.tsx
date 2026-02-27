'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { RequestWithRelations } from '@/lib/types/database';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { getRequestPhotos } from '@/app/actions/request-actions';
import { requestColumns } from './request-columns';
import { RequestFilters, filterParsers } from './request-filters';
import { RequestTriageDialog } from './request-triage-dialog';
import { RequestRejectDialog } from './request-reject-dialog';
import { RequestCancelDialog } from './request-cancel-dialog';
import { RequestAcceptanceDialog } from './request-acceptance-dialog';
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
}

export function RequestTable({
  data,
  categories,
  users,
  currentUserId,
  currentUserRole,
  photosByRequest,
}: RequestTableProps) {
  const router = useRouter();
  const [filters] = useQueryStates(filterParsers);

  // Dialog states
  const [triageOpen, setTriageOpen] = useState(false);
  const [triagingRequest, setTriagingRequest] = useState<RequestWithRelations | null>(null);
  const [triagePhotos, setTriagePhotos] = useState<PhotoItem[]>([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectingDisplayId, setRejectingDisplayId] = useState('');

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [cancellingDisplayId, setCancellingDisplayId] = useState('');

  // Acceptance dialog state (handles both accept and reject-work modes)
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [acceptanceMode, setAcceptanceMode] = useState<'accept' | 'reject'>('accept');
  const [acceptanceRequest, setAcceptanceRequest] = useState<RequestWithRelations | null>(null);

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

  const handleTriage = async (request: RequestWithRelations) => {
    // Fetch signed photo URLs before opening dialog
    try {
      const result = await getRequestPhotos({ requestId: request.id });
      if (result?.data?.success && result.data.photos) {
        setTriagePhotos(
          result.data.photos.map((p) => ({
            id: p.id,
            url: p.url,
            fileName: p.fileName,
          }))
        );
      } else {
        setTriagePhotos([]);
      }
    } catch {
      setTriagePhotos([]);
    }
    setTriagingRequest(request);
    setTriageOpen(true);
  };

  const handleReject = (request: RequestWithRelations) => {
    setRejectingRequestId(request.id);
    setRejectingDisplayId(request.display_id);
    setRejectOpen(true);
  };

  const handleCancel = (request: RequestWithRelations) => {
    setCancellingRequestId(request.id);
    setCancellingDisplayId(request.display_id);
    setCancelOpen(true);
  };

  const handleAccept = (request: RequestWithRelations) => {
    setAcceptanceRequest(request);
    setAcceptanceMode('accept');
    setAcceptanceOpen(true);
  };

  const handleRejectWork = (request: RequestWithRelations) => {
    setAcceptanceRequest(request);
    setAcceptanceMode('reject');
    setAcceptanceOpen(true);
  };

  const handleView = (request: RequestWithRelations) => {
    router.push(`/requests/${request.id}`);
  };

  const handlePhotoClick = (photos: PhotoItem[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleTriageSuccess = () => {
    setFeedback({ type: 'success', message: 'Request triaged successfully' });
  };

  const handleRejectSuccess = () => {
    setFeedback({ type: 'success', message: 'Request rejected' });
  };

  const handleCancelSuccess = () => {
    setFeedback({ type: 'success', message: 'Request cancelled' });
  };

  const handleAcceptanceSuccess = () => {
    setFeedback({
      type: 'success',
      message:
        acceptanceMode === 'accept'
          ? 'Work accepted successfully'
          : 'Work rejected and sent back to In Progress',
    });
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
        exportUrl={
          ['ga_lead', 'admin', 'finance_approver'].includes(currentUserRole)
            ? '/api/exports/requests'
            : undefined
        }
        meta={{
          onTriage: handleTriage,
          onReject: handleReject,
          onCancel: handleCancel,
          onAccept: handleAccept,
          onRejectWork: handleRejectWork,
          onView: handleView,
          onPhotoClick: handlePhotoClick,
          photosByRequest,
          currentUserId,
          currentUserRole,
        }}
      />

      {/* Dialogs */}
      <RequestTriageDialog
        open={triageOpen}
        onOpenChange={setTriageOpen}
        request={triagingRequest}
        categories={categories}
        users={users}
        photoUrls={triagePhotos}
        onSuccess={handleTriageSuccess}
      />

      <RequestRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        requestId={rejectingRequestId}
        requestDisplayId={rejectingDisplayId}
        onSuccess={handleRejectSuccess}
      />

      <RequestCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        requestId={cancellingRequestId}
        requestDisplayId={cancellingDisplayId}
        onSuccess={handleCancelSuccess}
      />

      {acceptanceRequest && (
        <RequestAcceptanceDialog
          open={acceptanceOpen}
          onOpenChange={setAcceptanceOpen}
          mode={acceptanceMode}
          requestId={acceptanceRequest.id}
          requestDisplayId={acceptanceRequest.display_id}
          onSuccess={handleAcceptanceSuccess}
        />
      )}

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

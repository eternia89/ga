'use client';

import { useState, useEffect } from 'react';
import { JobWithRelations } from '@/lib/types/database';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { PhotoUpload, ExistingPhoto } from '@/components/media/photo-upload';
import { RequestPreviewDialog } from './request-preview-dialog';
import { PRIORITY_LABELS } from '@/lib/constants/job-status';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateJob, deleteJobAttachment } from '@/app/actions/job-actions';
import { formatIDR, formatNumber, formatDateTime, formatDate } from '@/lib/utils';

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;

interface JobDetailInfoProps {
  job: JobWithRelations;
  currentUserId: string;
  currentUserRole: string;
  photoUrls: ExistingPhoto[];
  approvedByName?: string | null;
  approvalRejectedByName?: string | null;
  onActionSuccess: () => void;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  users: { id: string; name: string }[];
  /** HTML form id — allows external button to submit via form={formId} */
  formId?: string;
  /** Called when form dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Called when form submitting state changes */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  companyName?: string;
}

export function JobDetailInfo({
  job,
  currentUserId,
  currentUserRole,
  photoUrls,
  approvedByName,
  approvalRejectedByName,
  onActionSuccess,
  categories,
  locations,
  users,
  formId,
  onDirtyChange,
  onSubmittingChange,
  companyName,
}: JobDetailInfoProps) {
  const linkedRequests = job.job_requests ?? [];
  const [previewRequest, setPreviewRequest] = useState<typeof linkedRequests[number]['request'] | null>(null);

  // Inline edit state — fields are directly editable when user has permission
  const [editTitle, setEditTitle] = useState(job.title);
  const [editDescription, setEditDescription] = useState(job.description ?? '');
  const [editLocationId, setEditLocationId] = useState(job.location_id ?? '');
  const [editCategoryId, setEditCategoryId] = useState(job.category_id ?? '');
  const [editPriority, setEditPriority] = useState(job.priority ?? 'low');
  const [editAssignedTo, setEditAssignedTo] = useState(job.assigned_to ?? '');
  const [editEstimatedCost, setEditEstimatedCost] = useState(
    job.estimated_cost !== null && job.estimated_cost !== undefined ? String(job.estimated_cost) : ''
  );

  // Photo state
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [visibleExistingPhotos, setVisibleExistingPhotos] = useState<ExistingPhoto[]>(photoUrls);

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);

  // canEdit: GA Lead/Admin can edit any non-terminal job
  const canEdit = isGaLeadOrAdmin && !['completed', 'cancelled'].includes(job.status);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const locationOptions = locations.map((l) => ({ label: l.name, value: l.id }));
  const userOptions = users.map((u) => ({ label: u.name, value: u.id }));

  // Dirty state tracking: compare current edit values against original job values
  const isDirty =
    editTitle !== job.title ||
    editDescription !== (job.description ?? '') ||
    editLocationId !== (job.location_id ?? '') ||
    editCategoryId !== (job.category_id ?? '') ||
    editPriority !== (job.priority ?? 'low') ||
    editAssignedTo !== (job.assigned_to ?? '') ||
    editEstimatedCost !== (job.estimated_cost !== null && job.estimated_cost !== undefined ? String(job.estimated_cost) : '');

  const isPhotoDirty = newPhotos.length > 0 || deletedPhotoIds.length > 0;

  useEffect(() => {
    onDirtyChange?.(canEdit && (isDirty || isPhotoDirty));
  }, [isDirty, isPhotoDirty, canEdit, onDirtyChange]);

  useEffect(() => {
    onSubmittingChange?.(submitting);
  }, [submitting, onSubmittingChange]);

  const handleExistingPhotoRemove = (photoId: string) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
    setVisibleExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleEditSave = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const costValue = editEstimatedCost ? parseInt(editEstimatedCost.replace(/[^0-9]/g, ''), 10) : undefined;

      const result = await updateJob({
        id: job.id,
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
        location_id: editLocationId || undefined,
        category_id: editCategoryId || undefined,
        priority: editPriority as typeof PRIORITY_ORDER[number],
        assigned_to: editAssignedTo || undefined,
        estimated_cost: costValue,
      });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      // Delete removed photos
      if (deletedPhotoIds.length > 0) {
        for (const attachmentId of deletedPhotoIds) {
          await deleteJobAttachment({ attachmentId });
        }
        setDeletedPhotoIds([]);
      }
      // Upload new photos
      if (newPhotos.length > 0) {
        const formData = new FormData();
        formData.append('entity_type', 'job');
        formData.append('entity_id', job.id);
        for (const file of newPhotos) {
          formData.append('photos', file);
        }
        const uploadRes = await fetch('/api/uploads/entity-photos', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          setFeedback({ type: 'error', message: 'Job saved but photo upload failed. Try again.' });
          onActionSuccess();
          return;
        }
        setNewPhotos([]);
      }

      setFeedback({ type: 'success', message: 'Job updated successfully.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update job' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} onSubmit={(e) => { e.preventDefault(); handleEditSave(); }} className="space-y-6">
      {/* Company — always shown, always disabled */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</Label>
        <Input
          value={companyName ?? ''}
          disabled
          className="bg-muted text-muted-foreground cursor-not-allowed"
        />
      </div>

      {/* Title row */}
      <div className="space-y-2">
        <div>
          {canEdit ? (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={150}
                className="text-xl font-semibold"
              />
            </div>
          ) : (
            <h2 className="text-xl font-semibold leading-tight">{job.title}</h2>
          )}
        </div>

        {job.created_by_user?.full_name && (
          <p className="text-sm text-muted-foreground">
            Created by {job.created_by_user.full_name}
            <span> {'\u00b7'} {formatDate(job.created_at)}</span>
          </p>
        )}
      </div>

      {/* Core fields — editable in edit mode */}
      <dl className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            PIC
          </dt>
          <dd className="text-sm">
            {canEdit ? (
              <div className="max-w-xs">
                <Combobox
                  options={userOptions}
                  value={editAssignedTo}
                  onValueChange={setEditAssignedTo}
                  placeholder="Select PIC..."
                  searchPlaceholder="Search users..."
                  emptyText="No users found."
                />
              </div>
            ) : (
              job.pic?.full_name ?? (
                <span className="text-muted-foreground">Unassigned</span>
              )
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Estimated Cost
          </dt>
          <dd className="text-sm">
            {canEdit ? (
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={editEstimatedCost ? formatNumber(parseInt(editEstimatedCost.replace(/[^0-9]/g, ''), 10) || 0) : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    setEditEstimatedCost(digits);
                  }}
                  className="pl-8"
                  maxLength={20}
                />
              </div>
            ) : (
              <span>
                {job.estimated_cost !== null && job.estimated_cost !== undefined
                  ? formatIDR(job.estimated_cost)
                  : <span className="text-muted-foreground">Not set</span>
                }
                {job.approved_at && (
                  <span className="ml-2 text-xs text-green-600">Budget Approved</span>
                )}
                {job.status === 'pending_approval' && (
                  <span className="ml-2 text-xs text-yellow-600">Pending Approval</span>
                )}
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Priority
          </dt>
          <dd className="text-sm">
            {canEdit ? (
              <Select
                value={editPriority}
                onValueChange={setEditPriority}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              job.priority ? (PRIORITY_LABELS[job.priority] ?? job.priority) : (
                <span className="text-muted-foreground">—</span>
              )
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Category
          </dt>
          <dd className="text-sm">
            {canEdit ? (
              <div className="max-w-xs">
                <Combobox
                  options={categoryOptions}
                  value={editCategoryId}
                  onValueChange={setEditCategoryId}
                  placeholder="Select category..."
                  searchPlaceholder="Search categories..."
                  emptyText="No categories found."
                />
              </div>
            ) : (
              job.category?.name ?? (
                <span className="text-muted-foreground">—</span>
              )
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Location
          </dt>
          <dd className="text-sm">
            {canEdit ? (
              <div className="max-w-xs">
                <Combobox
                  options={locationOptions}
                  value={editLocationId}
                  onValueChange={setEditLocationId}
                  placeholder="Select location..."
                  searchPlaceholder="Search locations..."
                  emptyText="No locations found."
                />
              </div>
            ) : (
              job.location?.name ?? (
                <span className="text-muted-foreground">—</span>
              )
            )}
          </dd>
        </div>

        {job.started_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Started At
            </dt>
            <dd className="text-sm">{formatDateTime(job.started_at)}</dd>
          </div>
        )}

        {job.completed_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Completed At
            </dt>
            <dd className="text-sm">{formatDateTime(job.completed_at)}</dd>
          </div>
        )}

        {/* Approval fields */}
        {job.approval_submitted_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Submitted for Approval
            </dt>
            <dd className="text-sm">{formatDateTime(job.approval_submitted_at)}</dd>
          </div>
        )}

        {job.approved_at && (
          <>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Approved At
              </dt>
              <dd className="text-sm">{formatDateTime(job.approved_at)}</dd>
            </div>
            {approvedByName && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Approved By
                </dt>
                <dd className="text-sm">{approvedByName}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {/* Description — editable in edit mode */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Description
        </h3>
        {canEdit ? (
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            maxLength={1000}
            className="min-h-24 resize-y"
            placeholder="Job description..."
          />
        ) : (
          job.description ? (
            <p className="text-sm whitespace-pre-wrap">{job.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )
        )}
      </div>

      {/* Job Photos */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Photos
        </h3>
        <PhotoUpload
          onChange={setNewPhotos}
          existingPhotos={visibleExistingPhotos}
          onRemoveExisting={canEdit ? handleExistingPhotoRemove : undefined}
          disabled={!canEdit || submitting}
          maxPhotos={10}
          showCount
          enableAnnotation={false}
          enableMobileCapture
        />
      </div>

      {/* Rejection reason callout */}
      {job.approval_rejection_reason && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Approval Rejected
            {approvalRejectedByName && (
              <span className="font-normal"> by {approvalRejectedByName}</span>
            )}
            {job.approval_rejected_at && (
              <span className="font-normal ml-1 text-xs text-red-500">
                — {formatDateTime(job.approval_rejected_at)}
              </span>
            )}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {job.approval_rejection_reason}
          </p>
        </div>
      )}

      {/* Inline feedback */}
      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Linked Requests */}
      {linkedRequests.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Linked Requests ({linkedRequests.length})
          </h3>
          <div className="space-y-2">
            {linkedRequests.map(({ request }) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setPreviewRequest(request)}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/40 transition-colors w-full text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                    {request.display_id}
                  </span>
                  <span className="truncate text-sm">{request.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {request.requester?.full_name && (
                    <span className="text-xs text-muted-foreground hidden max-md:hidden">
                      {request.requester.full_name}
                    </span>
                  )}
                  <RequestStatusBadge status={request.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request Preview Dialog */}
      <RequestPreviewDialog
        request={previewRequest}
        open={!!previewRequest}
        onOpenChange={(open) => { if (!open) setPreviewRequest(null); }}
      />
    </form>
  );
}

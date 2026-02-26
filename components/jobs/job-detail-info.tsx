'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { JobWithRelations } from '@/lib/types/database';
import { JobStatusBadge } from './job-status-badge';
import { JobPriorityBadge } from './job-priority-badge';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { RequestPreviewDialog } from './request-preview-dialog';
import { OverdueBadge } from '@/components/maintenance/overdue-badge';
import { PRIORITY_LABELS } from '@/lib/constants/job-status';
import { Lock, LockOpen, Pencil, X, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { updateJob, updateJobBudget } from '@/app/actions/job-actions';

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd-MM-yyyy, HH:mm:ss');
}

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;

interface JobDetailInfoProps {
  job: JobWithRelations;
  currentUserId: string;
  currentUserRole: string;
  approvedByName?: string | null;
  approvalRejectedByName?: string | null;
  onActionSuccess: () => void;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}

export function JobDetailInfo({
  job,
  currentUserId,
  currentUserRole,
  approvedByName,
  approvalRejectedByName,
  onActionSuccess,
  categories,
  locations,
}: JobDetailInfoProps) {
  const linkedRequests = job.job_requests ?? [];
  const [previewRequest, setPreviewRequest] = useState<typeof linkedRequests[number]['request'] | null>(null);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(job.title);
  const [editDescription, setEditDescription] = useState(job.description ?? '');
  const [editLocationId, setEditLocationId] = useState(job.location_id ?? '');
  const [editCategoryId, setEditCategoryId] = useState(job.category_id ?? '');
  const [editPriority, setEditPriority] = useState(job.priority ?? 'low');

  // Budget inline edit state
  const [isBudgetEditing, setIsBudgetEditing] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isPIC = job.assigned_to === currentUserId;

  // canEdit: GA Lead/Admin can edit any non-terminal job
  const canEdit = isGaLeadOrAdmin && !['completed', 'cancelled'].includes(job.status);

  // canEditBudget: PIC or GA Lead/Admin can set budget when in_progress and not yet budget-approved
  const canEditBudget =
    (isPIC || isGaLeadOrAdmin) &&
    job.status === 'in_progress' &&
    !job.approved_at;

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const locationOptions = locations.map((l) => ({ label: l.name, value: l.id }));

  const handleEditStart = () => {
    setEditTitle(job.title);
    setEditDescription(job.description ?? '');
    setEditLocationId(job.location_id ?? '');
    setEditCategoryId(job.category_id ?? '');
    setEditPriority(job.priority ?? 'low');
    setFeedback(null);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setFeedback(null);
  };

  const handleEditSave = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await updateJob({
        id: job.id,
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
        location_id: editLocationId || undefined,
        category_id: editCategoryId || undefined,
        priority: editPriority as typeof PRIORITY_ORDER[number],
      });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Job updated successfully.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update job' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBudgetSubmit = async () => {
    const amount = parseFloat(budgetAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid budget amount.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await updateJobBudget({ id: job.id, estimated_cost: amount });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setIsBudgetEditing(false);
      setBudgetAmount('');
      setFeedback({ type: 'success', message: 'Budget submitted for approval.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to submit budget' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border p-6 space-y-6">
      {/* Header: display_id, title, status, priority, PM badges + Edit button */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              {job.display_id}
            </span>
            <JobStatusBadge status={job.status} />
            {job.priority && <JobPriorityBadge priority={job.priority} />}
            {job.job_type === 'preventive_maintenance' && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                PM
              </span>
            )}
            {job.job_type === 'preventive_maintenance' && job.maintenance_schedule && (
              <OverdueBadge
                nextDueAt={(job.maintenance_schedule as { next_due_at?: string | null }).next_due_at ?? null}
                jobStatus={job.status}
              />
            )}
          </div>

          {/* Edit / Save / Cancel buttons */}
          {canEdit && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditStart}
              disabled={submitting}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleEditSave}
                disabled={submitting}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditCancel}
                disabled={submitting}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Title */}
        {isEditing ? (
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

        {job.created_by_user?.full_name && (
          <p className="text-sm text-muted-foreground">
            Created by {job.created_by_user.full_name}
            <span> · {format(new Date(job.created_at), 'dd-MM-yyyy')}</span>
          </p>
        )}
      </div>

      {/* Estimated Cost — prominent, with inline editing */}
      <div className="rounded-md bg-muted/50 border px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Estimated Cost
          </p>
          <div className="flex items-center gap-2">
            {job.approved_at ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <Lock className="h-3 w-3" />
                Approved
              </span>
            ) : job.status === 'pending_approval' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Pending Approval
              </span>
            ) : canEditBudget && !isBudgetEditing ? (
              <button
                type="button"
                onClick={() => {
                  setBudgetAmount(job.estimated_cost ? String(job.estimated_cost) : '');
                  setIsBudgetEditing(true);
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <LockOpen className="h-3 w-3" />
                Edit
                <Pencil className="h-3 w-3" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <LockOpen className="h-3 w-3" />
                Editable
              </span>
            )}
          </div>
        </div>

        {/* Budget display or inline edit */}
        {isBudgetEditing ? (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={budgetAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setBudgetAmount(raw);
                  }}
                  className="pl-8"
                  maxLength={15}
                  autoFocus
                />
              </div>
              <Button
                size="sm"
                onClick={handleBudgetSubmit}
                disabled={submitting || !budgetAmount}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBudgetEditing(false);
                  setBudgetAmount('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitting a budget will send this job for approval.
            </p>
          </div>
        ) : (
          <p className="text-2xl font-bold tabular-nums">
            {job.estimated_cost !== null && job.estimated_cost !== undefined
              ? formatIDR(job.estimated_cost)
              : <span className="text-muted-foreground text-base font-normal">Not set</span>
            }
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
            {job.pic?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Priority
          </dt>
          <dd className="text-sm">
            {isEditing ? (
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
            {isEditing ? (
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
            {isEditing ? (
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

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Created By
          </dt>
          <dd className="text-sm">
            {job.created_by_user?.full_name ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Created At
          </dt>
          <dd className="text-sm">{formatDate(job.created_at)}</dd>
        </div>

        {job.started_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Started At
            </dt>
            <dd className="text-sm">{formatDate(job.started_at)}</dd>
          </div>
        )}

        {job.completed_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Completed At
            </dt>
            <dd className="text-sm">{formatDate(job.completed_at)}</dd>
          </div>
        )}

        {/* Approval fields */}
        {job.approval_submitted_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Submitted for Approval
            </dt>
            <dd className="text-sm">{formatDate(job.approval_submitted_at)}</dd>
          </div>
        )}

        {job.approved_at && (
          <>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Approved At
              </dt>
              <dd className="text-sm">{formatDate(job.approved_at)}</dd>
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
        {isEditing ? (
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
                — {formatDate(job.approval_rejected_at)}
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
    </div>
  );
}

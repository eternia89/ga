'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { triageSchema, TriageFormData } from '@/lib/validations/request-schema';
import { RequestWithRelations } from '@/lib/types/database';
import { triageRequest } from '@/app/actions/request-actions';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { PhotoLightbox } from './request-photo-lightbox';
import { RequestEditForm } from './request-edit-form';
import { FeedbackStarRating } from './feedback-star-rating';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { ExternalLink } from 'lucide-react';
import { DisplayId } from '@/components/display-id';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PRIORITY_LABELS } from '@/lib/constants/request-status';
import { Input } from '@/components/ui/input';
import { LEAD_ROLES, ROLES } from '@/lib/constants/roles';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

interface LinkedJob {
  id: string;
  display_id: string;
  title: string;
  status: string;
}

interface RequestDetailInfoProps {
  request: RequestWithRelations;
  photoUrls: PhotoItem[];
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  onEditSuccess: () => void;
  onTriageSuccess: () => void;
  linkedJobs: LinkedJob[];
  /** HTML form id — allows external button to submit via form={formId} */
  formId?: string;
  /** Called when dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Called when submitting state changes */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  companyName?: string;
}

export function RequestDetailInfo({
  request,
  photoUrls,
  categories,
  users,
  locations,
  currentUserId,
  currentUserRole,
  onEditSuccess,
  onTriageSuccess,
  linkedJobs,
  formId,
  onDirtyChange,
  onSubmittingChange,
  companyName,
}: RequestDetailInfoProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [triageSubmitting, setTriageSubmitting] = useState(false);
  const [triageFeedback, setTriageFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isGaLeadOrAdmin = (LEAD_ROLES as readonly string[]).includes(currentUserRole);
  const isGaStaff = currentUserRole === ROLES.GA_STAFF;
  const isRequester = request.requester_id === currentUserId;
  const isEditable = isRequester && request.status === 'submitted';
  const canTriage =
    (isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status)) ||
    (isGaStaff && request.status === 'submitted');

  const triageForm = useForm<TriageFormData>({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      category_id: request.category_id ?? '',
      priority: request.priority ?? undefined,
      assigned_to: request.assigned_to ?? (isGaStaff ? currentUserId : ''),
    },
  });

  const handleTriageSubmit = async (data: TriageFormData) => {
    setTriageSubmitting(true);
    setTriageFeedback(null);

    try {
      const result = await triageRequest({ id: request.id, data });
      if (result?.serverError) {
        setTriageFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setTriageFeedback({
        type: 'success',
        message:
          request.status === 'submitted'
            ? 'Request triaged successfully'
            : 'Triage updated successfully',
      });
      onTriageSuccess();
    } catch (err) {
      setTriageFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to triage',
      });
    } finally {
      setTriageSubmitting(false);
    }
  };

  // Track triage form dirty/submitting for external submit button
  const { isDirty: triageIsDirty } = triageForm.formState;
  useEffect(() => {
    if (canTriage) {
      onDirtyChange?.(triageIsDirty);
    }
  }, [triageIsDirty, canTriage, onDirtyChange]);

  useEffect(() => {
    if (canTriage) {
      onSubmittingChange?.(triageSubmitting);
    }
  }, [triageSubmitting, canTriage, onSubmittingChange]);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    label,
    value,
  }));
  const userOptions = users.map((u) => ({ label: u.name, value: u.id }));
  // GA Staff can only assign to themselves; GA Lead/Admin see all users
  const picOptions = isGaStaff
    ? userOptions.filter((u) => u.value === currentUserId)
    : userOptions;

  // Show edit form directly when requester can edit (submitted status)
  if (isEditable) {
    return (
      <>
        {/* Company — always shown, always disabled */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={companyName ?? ''}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        </div>

        <RequestEditForm
          request={request}
          locations={locations}
          existingPhotos={photoUrls}
          onSuccess={onEditSuccess}
          formId={canTriage ? undefined : formId}
          onDirtyChange={canTriage ? undefined : onDirtyChange}
          onSubmittingChange={canTriage ? undefined : onSubmittingChange}
        />

        {/* Triage fields when user is both requester and GA Lead/Admin */}
        {canTriage && (
          <div id="triage-section" className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Triage Details
            </h3>
            <Form {...triageForm}>
              <form
                id={formId}
                onSubmit={triageForm.handleSubmit(handleTriageSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={triageForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>
                        Category <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={categoryOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select category..."
                          searchPlaceholder="Search categories..."
                          emptyText="No categories found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={triageForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>
                        Priority <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={priorityOptions}
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          placeholder="Select priority..."
                          searchPlaceholder="Search priorities..."
                          emptyText="No priorities found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={triageForm.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>
                        PIC <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={picOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select PIC..."
                          searchPlaceholder="Search users..."
                          emptyText="No users found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {triageFeedback && (
                  <InlineFeedback
                    type={triageFeedback.type}
                    message={triageFeedback.message}
                    onDismiss={() => setTriageFeedback(null)}
                  />
                )}
              </form>
            </Form>
          </div>
        )}

        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photoUrls}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Company — always shown, always disabled */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={companyName ?? ''}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-sm whitespace-pre-wrap">{request.description ?? '—'}</p>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Location
          </h3>
          <p className="text-sm">
            {request.location?.name ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>

        {/* Photos */}
        {photoUrls.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Photos
            </h3>
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="w-20 h-20 shrink-0 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity"
                  aria-label={`View photo: ${photo.fileName}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Linked Jobs */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Linked Jobs
          </h3>
          {linkedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked jobs</p>
          ) : (
            <ul className="space-y-1.5">
              {linkedJobs.map((job) => (
                <li key={job.id} className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/jobs/${job.id}`}
                    target="_blank"
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <DisplayId>{job.display_id}</DisplayId>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <span className="text-sm text-muted-foreground">—</span>
                  <span
                    className="text-sm truncate max-w-[200px]"
                    title={job.title}
                  >
                    {job.title}
                  </span>
                  <JobStatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Acceptance rejection reason — shown when work was rejected back to in_progress */}
        {request.acceptance_rejected_reason && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm font-medium text-orange-700">
              Work Rejection Reason
            </p>
            <p className="text-sm text-orange-600 mt-1">
              {request.acceptance_rejected_reason}
            </p>
          </div>
        )}

        {/* Feedback — shown when feedback has been submitted */}
        {request.feedback_rating != null && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Feedback
            </h3>
            <div className="space-y-2">
              <FeedbackStarRating value={request.feedback_rating} readOnly size="md" />
              {request.feedback_comment && (
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{request.feedback_comment}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Triage fields — shown for GA Lead/Admin (editable on submitted, read-only otherwise) */}
        {(canTriage || request.category_id || request.priority || request.assigned_to) && (
          <div id="triage-section">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Triage Details
            </h3>

            {canTriage ? (
              /* Inline triage form for GA Lead/Admin on submitted requests */
              <Form {...triageForm}>
                <form
                  id={formId}
                  onSubmit={triageForm.handleSubmit(handleTriageSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={triageForm.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>
                          Category <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            options={categoryOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select category..."
                            searchPlaceholder="Search categories..."
                            emptyText="No categories found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={triageForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>
                          Priority <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            options={priorityOptions}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder="Select priority..."
                            searchPlaceholder="Search priorities..."
                            emptyText="No priorities found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={triageForm.control}
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>
                          PIC <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            options={userOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select PIC..."
                            searchPlaceholder="Search users..."
                            emptyText="No users found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {triageFeedback && (
                    <InlineFeedback
                      type={triageFeedback.type}
                      message={triageFeedback.message}
                      onDismiss={() => setTriageFeedback(null)}
                    />
                  )}
                </form>
              </Form>
            ) : (
              /* Read-only triage fields for other roles or after triage */
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm mt-0.5">
                    {request.category?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Priority</dt>
                  <dd className="text-sm mt-0.5">
                    {request.priority ? (
                      PRIORITY_LABELS[request.priority] ?? request.priority
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Person in Charge (PIC)
                  </dt>
                  <dd className="text-sm mt-0.5">
                    {request.assigned_user?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photoUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

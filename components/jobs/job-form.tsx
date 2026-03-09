'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { createJobSchema, updateJobSchema } from '@/lib/validations/job-schema';
import { createJob, updateJob } from '@/app/actions/job-actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { PhotoUpload } from '@/components/media/photo-upload';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { RequestPreviewDialog } from './request-preview-dialog';
import { PRIORITY_LABELS } from '@/lib/constants/job-status';
import { formatNumber } from '@/lib/utils';


const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;
type Priority = typeof PRIORITY_ORDER[number];

function highestPriority(priorities: (string | null)[]): Priority {
  let maxIndex = -1;
  for (const p of priorities) {
    if (!p) continue;
    const idx = PRIORITY_ORDER.indexOf(p as Priority);
    if (idx > maxIndex) maxIndex = idx;
  }
  return maxIndex >= 0 ? PRIORITY_ORDER[maxIndex] : 'low';
}

export interface EligibleRequest {
  id: string;
  display_id: string;
  title: string;
  priority: string | null;
  status: string;
  location_id: string | null;
  category_id: string | null;
  description: string | null;
}

interface PrefillRequest {
  id: string;
  display_id: string;
  title: string;
  priority: string | null;
  location_id: string | null;
  category_id: string | null;
  description: string | null;
}

interface JobFormInitialData {
  title: string;
  description: string;
  location_id: string | null;
  category_id: string | null;
  priority: string | null;
  assigned_to: string | null;
  estimated_cost: number | null;
  linked_request_ids: string[];
}

interface JobFormProps {
  locations: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
  eligibleRequests: EligibleRequest[];
  requestJobLinks: Record<string, string>; // request_id -> job display_id
  prefillRequest?: PrefillRequest | null;
  mode: 'create' | 'edit';
  jobId?: string;
  initialData?: JobFormInitialData;
  readOnly?: boolean;
  /** Lock PIC field independently (when job status is past 'assigned') */
  picLocked?: boolean;
  /** For view mode: linked request objects with status info for read-only display */
  linkedRequestDetails?: {
    id: string;
    display_id: string;
    title: string;
    status: string;
    description: string | null;
    priority: string | null;
    created_at: string;
    location?: { name: string } | null;
    category?: { name: string } | null;
    requester?: { full_name: string } | null;
    assigned_user?: { full_name: string } | null;
  }[];
  /** Budget threshold from company_settings (null = no threshold configured) */
  companyBudgetThreshold?: number | null;
  onSuccess?: () => void;
}

export function JobForm({
  locations,
  categories,
  users,
  eligibleRequests,
  requestJobLinks,
  prefillRequest,
  mode,
  jobId,
  initialData,
  readOnly = false,
  picLocked = false,
  linkedRequestDetails,
  companyBudgetThreshold,
  onSuccess,
}: JobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewRequest, setPreviewRequest] = useState<NonNullable<JobFormProps['linkedRequestDetails']>[number] | null>(null);
  const [linkedRequests, setLinkedRequests] = useState<EligibleRequest[]>(() => {
    if (mode === 'edit' && initialData?.linked_request_ids && initialData.linked_request_ids.length > 0) {
      return eligibleRequests.filter((r) => initialData.linked_request_ids.includes(r.id));
    }
    if (prefillRequest) {
      const found = eligibleRequests.find((r) => r.id === prefillRequest.id);
      return found ? [found] : [];
    }
    return [];
  });

  const locationOptions = locations.map((loc) => ({
    label: loc.name,
    value: loc.id,
  }));

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const userOptions = users.map((u) => ({
    label: u.full_name,
    value: u.id,
  }));

  // Build request options for the combobox — include all eligible requests
  const requestOptions = eligibleRequests
    .filter((r) => !linkedRequests.some((lr) => lr.id === r.id))
    .map((r) => {
      const jobLink = requestJobLinks[r.id];
      const label = jobLink
        ? `${r.display_id} — ${r.title} (linked to ${jobLink})`
        : `${r.display_id} — ${r.title}`;
      return { label, value: r.id };
    });

  // Determine default values based on mode
  const isEditMode = mode === 'edit' && initialData;

  const defaultTitle = isEditMode ? initialData.title : (prefillRequest?.title ?? '');
  const defaultDescription = isEditMode ? initialData.description : (prefillRequest?.description ?? '');
  const defaultLocationId = isEditMode ? (initialData.location_id ?? '') : (prefillRequest?.location_id ?? '');
  const defaultCategoryId = isEditMode ? (initialData.category_id ?? '') : (prefillRequest?.category_id ?? '');
  const defaultPriority = isEditMode
    ? ((initialData.priority ?? 'medium') as Priority)
    : ((prefillRequest?.priority ?? 'medium') as Priority);
  const defaultAssignedTo = isEditMode ? (initialData.assigned_to ?? undefined) : undefined;
  const defaultEstimatedCost = isEditMode
    ? (initialData.estimated_cost ?? undefined)
    : undefined;
  const defaultLinkedRequestIds = isEditMode
    ? initialData.linked_request_ids
    : (prefillRequest ? [prefillRequest.id] : []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(mode === 'edit' ? updateJobSchema : createJobSchema),
    defaultValues: {
      ...(mode === 'edit' && jobId ? { id: jobId } : {}),
      title: defaultTitle,
      description: defaultDescription,
      location_id: defaultLocationId,
      category_id: defaultCategoryId,
      priority: defaultPriority as 'low' | 'medium' | 'high' | 'urgent',
      ...(mode === 'edit' ? {
        assigned_to: defaultAssignedTo as string | undefined,
        estimated_cost: defaultEstimatedCost as number | undefined,
      } : {
        estimated_cost: undefined as number | undefined,
      }),
      linked_request_ids: defaultLinkedRequestIds as string[],
    },
  });

  // Auto-calculate priority when linked requests change (create mode only)
  useEffect(() => {
    if (mode === 'create' && linkedRequests.length > 0) {
      const computed = highestPriority(linkedRequests.map((r) => r.priority));
      form.setValue('priority', computed, { shouldValidate: false });
    }
  }, [linkedRequests, form, mode]);

  // Keep linked_request_ids in sync with linkedRequests state
  useEffect(() => {
    form.setValue(
      'linked_request_ids',
      linkedRequests.map((r) => r.id),
      { shouldValidate: false }
    );
  }, [linkedRequests, form]);

  const handleAddRequest = (requestId: string) => {
    const request = eligibleRequests.find((r) => r.id === requestId);
    if (request && !linkedRequests.some((lr) => lr.id === requestId)) {
      setLinkedRequests((prev) => [...prev, request]);
    }
  };

  const handleRemoveRequest = (requestId: string) => {
    setLinkedRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'edit' && jobId) {
        const result = await updateJob({ id: jobId, ...data });
        if (result?.serverError) {
          setError(result.serverError);
          return;
        }
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const result = await createJob(data);
        if (result?.serverError) {
          setError(result.serverError);
          return;
        }
        if (!result?.data?.jobId) {
          setError('Failed to create job. Please try again.');
          return;
        }

        // Step 2: Upload photos if any were selected
        if (photoFiles.length > 0) {
          const formData = new FormData();
          formData.append('entity_type', 'job');
          formData.append('entity_id', result.data.jobId);
          for (const file of photoFiles) {
            formData.append('photos', file);
          }

          const uploadResponse = await fetch('/api/uploads/entity-photos', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            // Photo upload failed — job is still saved, just without photos
            console.warn('Photo upload failed:', await uploadResponse.text());
          }
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/jobs/${result.data.jobId}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || readOnly;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${onSuccess ? '' : 'max-w-2xl'}`}>
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter job title..."
                  maxLength={150}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the work to be done..."
                  className="min-h-28 resize-y"
                  maxLength={1000}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {field.value?.length ?? 0}/1000 characters
              </p>
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>
                Location <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Combobox
                  options={locationOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select location..."
                  searchPlaceholder="Search locations..."
                  emptyText="No locations found."
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
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
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority — hidden in readOnly mode; shown as PriorityBadge in modal header */}
        {!readOnly && (
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Priority <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIORITY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mode === 'create' && linkedRequests.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Auto-set to highest priority among linked requests
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Budget (estimated cost) */}
        {!readOnly && (
          <FormField
            control={form.control}
            name="estimated_cost"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Budget (optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      Rp
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="pl-10"
                      disabled={disabled}
                      value={field.value ? formatNumber(field.value) : ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(digits === '' ? undefined : parseInt(digits, 10));
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* PIC (Person in Charge) — only shown in edit/view mode */}
        {mode === 'edit' && (
          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>PIC (Person in Charge)</FormLabel>
                <FormControl>
                  <Combobox
                    options={userOptions}
                    value={field.value ?? ''}
                    onValueChange={(val) => field.onChange(val || undefined)}
                    placeholder="Select PIC (optional)..."
                    searchPlaceholder="Search users..."
                    emptyText="No users found."
                    disabled={disabled || picLocked}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Linked Requests */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Linked Requests</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {readOnly
                ? 'Requests linked to this job.'
                : 'Link triaged requests to this job. Priority will be auto-set to the highest among linked requests.'}
            </p>
          </div>

          {/* Read-only linked request list (view mode) */}
          {readOnly && linkedRequestDetails && linkedRequestDetails.length > 0 ? (
            <div className="space-y-2">
              {linkedRequestDetails.map((request) => (
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
                  <div className="shrink-0">
                    <RequestStatusBadge status={request.status} />
                  </div>
                </button>
              ))}
            </div>
          ) : readOnly && (!linkedRequestDetails || linkedRequestDetails.length === 0) ? (
            <p className="text-sm text-muted-foreground">No linked requests.</p>
          ) : (
            <>
              {/* Request search combobox */}
              <Combobox
                options={requestOptions}
                value=""
                onValueChange={handleAddRequest}
                placeholder="Search and add requests..."
                searchPlaceholder="Search by ID or title..."
                emptyText="No eligible requests found."
                disabled={disabled}
              />

              {/* Linked requests chips */}
              {linkedRequests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {linkedRequests.map((req) => {
                    const jobLink = requestJobLinks[req.id];
                    return (
                      <div
                        key={req.id}
                        className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        <span className="font-mono text-xs text-muted-foreground">{req.display_id}</span>
                        <span className="max-w-[180px] truncate">{req.title}</span>
                        {jobLink && (
                          <span className="text-xs text-amber-600">
                            ({jobLink})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveRequest(req.id)}
                          disabled={disabled}
                          className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                          aria-label={`Remove ${req.display_id}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Hidden field to carry linked_request_ids errors */}
          <FormField
            control={form.control}
            name="linked_request_ids"
            render={() => (
              <FormItem className="hidden">
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Photos — only show in create mode, not readOnly */}
        {mode === 'create' && !readOnly && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Photos (optional)</p>
            <div className="flex flex-wrap gap-2">
              <PhotoUpload
                onChange={setPhotoFiles}
                disabled={isSubmitting}
                maxPhotos={10}
                showCount
              />
            </div>
          </div>
        )}

        {/* Error feedback */}
        {error && (
          <InlineFeedback
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Submit — hide in readOnly mode */}
        {!readOnly && (
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                ? (() => {
                    const costVal = form.watch('estimated_cost') as number | undefined;
                    if (
                      costVal !== undefined &&
                      costVal > 0 &&
                      companyBudgetThreshold !== null &&
                      companyBudgetThreshold !== undefined &&
                      costVal >= companyBudgetThreshold
                    ) {
                      return 'Create Job & Request Budget';
                    }
                    return 'Create Job';
                  })()
                : 'Save Changes'}
            </Button>
            {!onSuccess && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.push('/jobs')}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </form>

      {/* Request Preview Dialog for read-only linked requests */}
      {readOnly && previewRequest && (
        <RequestPreviewDialog
          request={previewRequest}
          open={!!previewRequest}
          onOpenChange={(open) => { if (!open) setPreviewRequest(null); }}
        />
      )}
    </Form>
  );
}

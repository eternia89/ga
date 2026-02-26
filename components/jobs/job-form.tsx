'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { createJobSchema } from '@/lib/validations/job-schema';
import { createJob } from '@/app/actions/job-actions';
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
import { PRIORITY_LABELS } from '@/lib/constants/job-status';

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

interface EligibleRequest {
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

interface JobFormProps {
  locations: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
  eligibleRequests: EligibleRequest[];
  requestJobLinks: Record<string, string>; // request_id -> job display_id
  prefillRequest?: PrefillRequest | null;
  mode: 'create' | 'edit';
}

export function JobForm({
  locations,
  categories,
  users,
  eligibleRequests,
  requestJobLinks,
  prefillRequest,
  mode,
}: JobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedRequests, setLinkedRequests] = useState<EligibleRequest[]>(() => {
    if (prefillRequest) {
      // Pre-add the prefill request if it's in the eligible list
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

  // Determine prefill values
  const prefillPriority = prefillRequest?.priority as Priority | undefined;
  const prefillLocationId = prefillRequest?.location_id ?? '';
  const prefillCategoryId = prefillRequest?.category_id ?? '';
  const prefillTitle = prefillRequest?.title ?? '';
  const prefillDescription = prefillRequest?.description ?? '';

  const form = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: prefillTitle,
      description: prefillDescription,
      location_id: prefillLocationId,
      category_id: prefillCategoryId,
      priority: (prefillPriority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      assigned_to: undefined as string | undefined,
      estimated_cost: undefined as number | undefined,
      linked_request_ids: (prefillRequest ? [prefillRequest.id] : []) as string[],
    },
  });

  // Auto-calculate priority when linked requests change
  useEffect(() => {
    if (linkedRequests.length > 0) {
      const computed = highestPriority(linkedRequests.map((r) => r.priority));
      form.setValue('priority', computed, { shouldValidate: false });
    }
  }, [linkedRequests, form]);

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

  const onSubmit = async (data: {
    title: string;
    description: string;
    location_id: string;
    category_id: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: string;
    estimated_cost?: number;
    linked_request_ids: string[];
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createJob(data);

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      if (!result?.data?.jobId) {
        setError('Failed to create job. Please try again.');
        return;
      }

      router.push(`/jobs/${result.data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
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
                disabled={isSubmitting}
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
              {linkedRequests.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Auto-set to highest priority among linked requests
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PIC (Person in Charge) */}
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
                  disabled={isSubmitting}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Assigning a PIC will set the job status to &quot;Assigned&quot;
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estimated Cost */}
        <FormField
          control={form.control}
          name="estimated_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="0"
                    className="pl-10"
                    disabled={isSubmitting}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                  />
                </div>
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Optional. Used for budget approval threshold checks.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Linked Requests */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Linked Requests</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Link triaged requests to this job. Priority will be auto-set to the highest among linked requests.
            </p>
          </div>

          {/* Request search combobox */}
          <Combobox
            options={requestOptions}
            value=""
            onValueChange={handleAddRequest}
            placeholder="Search and add requests..."
            searchPlaceholder="Search by ID or title..."
            emptyText="No eligible requests found."
            disabled={isSubmitting}
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
                      disabled={isSubmitting}
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

        {/* Error feedback */}
        {error && (
          <InlineFeedback
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
              ? 'Create Job'
              : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.push('/jobs')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

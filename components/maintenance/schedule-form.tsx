'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleCreateSchema, scheduleEditSchema } from '@/lib/validations/schedule-schema';
import type { ScheduleEditFormData } from '@/lib/validations/schedule-schema';
import { createSchedule, updateSchedule } from '@/app/actions/schedule-actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import type { z } from 'zod';

// Use output type (after Zod defaults applied)
type ScheduleCreateOutput = z.output<typeof scheduleCreateSchema>;

// ============================================================================
// Asset list item type for the form dropdowns
// ============================================================================

export interface AssetListItem {
  id: string;
  name: string;
  display_id: string;
  category_id: string | null;
}

// ============================================================================
// Template list item type for the form dropdowns
// ============================================================================

export interface TemplateListItem {
  id: string;
  name: string;
  category_id: string | null;
}

// ============================================================================
// Interval type toggle shared UI
// ============================================================================

function IntervalTypeToggle({
  value,
  onChange,
  disabled,
}: {
  value: 'fixed' | 'floating';
  onChange: (v: 'fixed' | 'floating') => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange('floating')}
          disabled={disabled}
          className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
            value === 'floating'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-muted-foreground/40'
          }`}
        >
          <div className="font-medium">Floating</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            N days after last completion
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('fixed')}
          disabled={disabled}
          className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
            value === 'fixed'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-muted-foreground/40'
          }`}
        >
          <div className="font-medium">Fixed</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Every N days from start date
          </div>
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 'fixed'
          ? 'Fixed: every N days from start date regardless of when the last PM was completed.'
          : 'Floating: N days after the last PM job was completed (default).'}
      </p>
    </>
  );
}

// ============================================================================
// Create form
// ============================================================================

interface CreateFormProps {
  templates: TemplateListItem[];
  assets: AssetListItem[];
  defaultTemplateId?: string;
  defaultAssetId?: string;
  onSuccess?: () => void;
  primaryCompanyName?: string;
  extraCompanies?: { id: string; name: string }[];
}

function ScheduleCreateForm({ templates, assets, defaultTemplateId, defaultAssetId, onSuccess, primaryCompanyName, extraCompanies }: CreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId ?? '');
  const [selectedAssetId, setSelectedAssetId] = useState(defaultAssetId ?? '');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const filteredAssets = selectedTemplateId && selectedTemplate?.category_id
    ? assets.filter((a) => a.category_id === selectedTemplate.category_id)
    : assets;

  const filteredTemplates = selectedAssetId && selectedAsset?.category_id
    ? templates.filter((t) => !t.category_id || t.category_id === selectedAsset.category_id)
    : templates;

  const templateOptions = filteredTemplates.map((t) => ({ label: t.name, value: t.id }));
  const assetOptions = filteredAssets.map((a) => ({
    label: `${a.name} (${a.display_id})`,
    value: a.id,
  }));

  const templateLocked = !!defaultTemplateId;
  const assetLocked = !!defaultAssetId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ScheduleCreateOutput>({
    resolver: zodResolver(scheduleCreateSchema) as any,
    defaultValues: {
      template_id: defaultTemplateId ?? '',
      item_id: defaultAssetId ?? '',
      interval_days: 30,
      interval_type: 'floating',
      start_date: undefined,
    },
  });

  const intervalType = form.watch('interval_type');

  function handleTemplateChange(value: string) {
    setSelectedTemplateId(value);
    const template = templates.find((t) => t.id === value);
    if (template?.category_id && selectedAsset?.category_id !== template.category_id) {
      setSelectedAssetId('');
      form.setValue('item_id', '');
    }
    form.setValue('template_id', value);
  }

  function handleAssetChange(value: string) {
    setSelectedAssetId(value);
    const asset = assets.find((a) => a.id === value);
    if (asset?.category_id && selectedTemplate?.category_id && selectedTemplate.category_id !== asset.category_id) {
      setSelectedTemplateId('');
      form.setValue('template_id', '');
    }
    form.setValue('item_id', value);
  }

  function onSubmit(data: ScheduleCreateOutput) {
    setFeedback(null);
    startTransition(async () => {
      const result = await createSchedule(data);
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      if (!result?.data?.success) {
        setFeedback({ type: 'error', message: 'Failed to create schedule. Please try again.' });
        return;
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/maintenance');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${onSuccess ? '' : 'max-w-2xl'}`}>

        {/* Company field — always shown at top */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          {extraCompanies && extraCompanies.length > 1 ? (
            <Combobox
              options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
              value={selectedCompanyId ?? extraCompanies[0].id}
              onValueChange={(val) => setSelectedCompanyId(val)}
              placeholder="Select company"
              searchPlaceholder="Search companies..."
              emptyText="No companies found."
            />
          ) : (
            <Input
              value={primaryCompanyName ?? ''}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          )}
        </div>

        {/* Section 1: Template & Asset */}
        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Template &amp; Asset
          </h2>
          <Separator />

          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Template <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={templateOptions}
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleTemplateChange(val);
                    }}
                    placeholder="Select maintenance template..."
                    searchPlaceholder="Search templates..."
                    emptyText="No templates found for this category."
                    disabled={isPending || templateLocked}
                  />
                </FormControl>
                {selectedTemplate?.category_id && (
                  <p className="text-xs text-muted-foreground">
                    Asset list is filtered to match this template&apos;s category.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="item_id"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Asset <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={assetOptions}
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleAssetChange(val);
                    }}
                    placeholder="Select asset..."
                    searchPlaceholder="Search assets..."
                    emptyText={
                      selectedTemplateId
                        ? "No assets found matching this template's category."
                        : 'No assets found.'
                    }
                    disabled={isPending || assetLocked}
                  />
                </FormControl>
                {selectedAsset?.category_id && !selectedTemplateId && (
                  <p className="text-xs text-muted-foreground">
                    Template list is filtered to match this asset&apos;s category.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section 2: Schedule Configuration */}
        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Schedule Configuration
          </h2>
          <Separator />

          <FormField
            control={form.control}
            name="interval_days"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Interval (days) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="e.g. 30"
                    disabled={isPending}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">1 to 365 days</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interval_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Interval Type <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <IntervalTypeToggle
                    value={intervalType}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Start Date <span className="text-muted-foreground text-xs">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={isPending}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  If omitted, the first maintenance due date will be calculated from now + interval days.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {feedback && (
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Schedule'}
          </Button>
          {!onSuccess && (
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => router.push('/maintenance')}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

// ============================================================================
// Edit form
// ============================================================================

interface EditFormProps {
  schedule: MaintenanceSchedule;
  /** HTML form id — allows external button to submit via form={formId} */
  formId?: string;
  /** Called when form dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Called when form submitting state changes */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

function ScheduleEditForm({ schedule, formId, onDirtyChange, onSubmittingChange }: EditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const form = useForm<ScheduleEditFormData>({
    resolver: zodResolver(scheduleEditSchema),
    defaultValues: {
      interval_days: schedule.interval_days,
      interval_type: schedule.interval_type,
    },
  });

  const intervalType = form.watch('interval_type');

  // Track and propagate dirty/submitting state
  const formIsDirty = form.formState.isDirty;
  useEffect(() => {
    onDirtyChange?.(formIsDirty);
  }, [formIsDirty, onDirtyChange]);

  useEffect(() => {
    onSubmittingChange?.(isPending);
  }, [isPending, onSubmittingChange]);

  function onSubmit(data: ScheduleEditFormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateSchedule({ id: schedule.id, data });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      if (!result?.data?.success) {
        setFeedback({ type: 'error', message: 'Failed to update schedule. Please try again.' });
        return;
      }
      setFeedback({ type: 'success', message: 'Schedule updated successfully.' });
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">

        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Schedule Configuration
          </h2>
          <Separator />

          <FormField
            control={form.control}
            name="interval_days"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>
                  Interval (days) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="e.g. 30"
                    disabled={isPending}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">1 to 365 days</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interval_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Interval Type <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <IntervalTypeToggle
                    value={intervalType}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {feedback && (
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

      </form>
    </Form>
  );
}

// ============================================================================
// Public ScheduleForm component — switches between create and edit
// ============================================================================

interface ScheduleFormProps {
  templates: TemplateListItem[];
  assets: AssetListItem[];
  defaultTemplateId?: string;
  defaultAssetId?: string;
  mode: 'create' | 'edit';
  schedule?: MaintenanceSchedule;
  onSuccess?: () => void;
  /** HTML form id — passed to edit form for external submit */
  formId?: string;
  /** Called when form dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Called when form submitting state changes */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  primaryCompanyName?: string;
  extraCompanies?: { id: string; name: string }[];
}

export function ScheduleForm({
  templates,
  assets,
  defaultTemplateId,
  defaultAssetId,
  mode,
  schedule,
  onSuccess,
  formId,
  onDirtyChange,
  onSubmittingChange,
  primaryCompanyName,
  extraCompanies,
}: ScheduleFormProps) {
  if (mode === 'edit' && schedule) {
    return <ScheduleEditForm schedule={schedule} formId={formId} onDirtyChange={onDirtyChange} onSubmittingChange={onSubmittingChange} />;
  }

  return (
    <ScheduleCreateForm
      templates={templates}
      assets={assets}
      defaultTemplateId={defaultTemplateId}
      defaultAssetId={defaultAssetId}
      onSuccess={onSuccess}
      primaryCompanyName={primaryCompanyName}
      extraCompanies={extraCompanies}
    />
  );
}

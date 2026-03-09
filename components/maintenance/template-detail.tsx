'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { templateEditSchema, type TemplateEditFormData } from '@/lib/validations/template-schema';
import { updateTemplate, deactivateTemplate, reactivateTemplate } from '@/app/actions/template-actions';
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
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { TemplateBuilder } from './template-builder';
import { CHECKLIST_TYPES } from '@/lib/constants/checklist-types';
import type { MaintenanceTemplate, ChecklistItem } from '@/lib/types/maintenance';

const TYPE_COLORS: Record<ChecklistItem['type'], string> = {
  checkbox:  'bg-blue-100 text-blue-700',
  pass_fail: 'bg-green-100 text-green-700',
  numeric:   'bg-purple-100 text-purple-700',
  text:      'bg-orange-100 text-orange-700',
  photo:     'bg-pink-100 text-pink-700',
  dropdown:  'bg-yellow-100 text-yellow-700',
};

interface Category {
  id: string;
  name: string;
}

interface TemplateDetailProps {
  template: MaintenanceTemplate;
  categories: Category[];
  userRole: string;
  /** HTML form id — allows external button to submit via form={formId} */
  formId?: string;
  /** Called when form dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Called when form submitting state changes */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export function TemplateDetail({ template, categories, userRole, formId, onDirtyChange, onSubmittingChange }: TemplateDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManage = ['ga_lead', 'admin'].includes(userRole);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FORM_ID = formId ?? 'template-edit-form';

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const form = useForm<TemplateEditFormData>({
    resolver: zodResolver(templateEditSchema),
    defaultValues: {
      name: template.name,
      description: template.description ?? '',
      category_id: template.category_id ?? '',
      checklist: template.checklist,
    },
  });

  const checklist = form.watch('checklist') as ChecklistItem[];

  // Track and propagate dirty/submitting state
  const formIsDirty = form.formState.isDirty;
  useEffect(() => {
    const dirty = canManage && formIsDirty;
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [formIsDirty, canManage, onDirtyChange]);

  useEffect(() => {
    setIsSubmitting(isPending);
    onSubmittingChange?.(isPending);
  }, [isPending, onSubmittingChange]);

  function onSubmit(data: TemplateEditFormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateTemplate({ id: template.id, data });

      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      if (!result?.data?.success) {
        setFeedback({ type: 'error', message: 'Failed to update template.' });
        return;
      }

      setFeedback({ type: 'success', message: 'Template updated successfully.' });
      router.refresh();
    });
  }

  function handleDeactivate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await deactivateTemplate({ id: template.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Template deactivated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to deactivate template.' });
      }
    });
  }

  function handleReactivate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await reactivateTemplate({ id: template.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Template reactivated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to reactivate template.' });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Info bar: status + meta */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {template.is_active ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              Inactive
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {template.item_count ?? template.checklist.length} checklist item{(template.item_count ?? template.checklist.length) !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-muted-foreground">
            Created {format(new Date(template.created_at), 'dd-MM-yyyy')}
          </span>
        </div>

        {/* Action buttons */}
        {canManage && (
          <div className="flex items-center gap-2">
            {template.is_active ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                Deactivate
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReactivate}
                disabled={isPending}
              >
                Reactivate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {canManage ? (
        /* Directly editable form for users with permission */
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Template Information
              </h2>
              <Separator />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Monthly AC Maintenance"
                        maxLength={100}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={categoryOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select asset category..."
                        searchPlaceholder="Search categories..."
                        emptyText="No asset categories found."
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description..."
                        className="min-h-20 resize-y"
                        maxLength={200}
                        disabled={isPending}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      {(field.value ?? '').length}/200 characters
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border border-border p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Checklist Items <span className="text-destructive">*</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Add at least one checklist item. Items can be reordered by dragging.
                </p>
              </div>
              <Separator />

              <FormField
                control={form.control}
                name="checklist"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TemplateBuilder
                        items={checklist}
                        onItemsChange={(items) => field.onChange(items)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </form>
        </Form>
      ) : (
        /* Read-only view */
        <div className="space-y-6">
          {/* Basic info card */}
          <div className="rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Template Information
            </h2>
            <Separator />

            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                <p className="text-sm font-medium">{template.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Category</p>
                <p className="text-sm">{template.category?.name ?? '—'}</p>
              </div>
            </div>

            {template.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.description}</p>
              </div>
            )}
          </div>

          {/* Checklist preview */}
          <div className="rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Checklist Items ({template.checklist.length})
            </h2>
            <Separator />

            {template.checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checklist items.</p>
            ) : (
              <ol className="space-y-2">
                {template.checklist
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item, index) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5"
                    >
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums mt-0.5">
                        {index + 1}.
                      </span>
                      <span
                        className={`
                          shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5
                          ${TYPE_COLORS[item.type]}
                        `}
                      >
                        {CHECKLIST_TYPES[item.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {item.label || <span className="text-muted-foreground italic">No label</span>}
                        </p>
                        {item.type === 'numeric' && item.unit && (
                          <p className="text-xs text-muted-foreground mt-0.5">Unit: {item.unit}</p>
                        )}
                        {item.type === 'dropdown' && item.options.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Options: {item.options.join(', ')}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {canManage && isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
          <div className="mx-auto max-w-[1300px] px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unsaved changes</p>
            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

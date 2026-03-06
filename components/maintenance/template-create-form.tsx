'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { templateCreateSchema, type TemplateCreateFormData } from '@/lib/validations/template-schema';
import { createTemplate } from '@/app/actions/template-actions';
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
import type { ChecklistItem } from '@/lib/types/maintenance';

interface Category {
  id: string;
  name: string;
}

interface TemplateCreateFormProps {
  categories: Category[];
  onSuccess?: () => void;
}

export function TemplateCreateForm({ categories, onSuccess }: TemplateCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const form = useForm<TemplateCreateFormData>({
    resolver: zodResolver(templateCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      checklist: [],
    },
  });

  // Watch checklist for controlled TemplateBuilder
  const checklist = form.watch('checklist') as ChecklistItem[];

  async function onSubmit(data: TemplateCreateFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createTemplate(data);

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      if (!result?.data?.success) {
        setError('Failed to create template. Please try again.');
        return;
      }

      // Close dialog or redirect to templates list on success
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/maintenance/templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${onSuccess ? '' : 'max-w-2xl'}`}>

        {/* Section 1: Basic Info */}
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
                    disabled={isSubmitting}
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
              <FormItem className="max-w-xs">
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
                    disabled={isSubmitting}
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
                    placeholder="Optional description of what this template covers..."
                    className="min-h-20 resize-y"
                    maxLength={200}
                    disabled={isSubmitting}
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

        {/* Section 2: Checklist Items */}
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

        {/* Feedback */}
        {error && (
          <InlineFeedback
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Template...' : 'Create Template'}
          </Button>
          {!onSuccess && (
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => router.push('/maintenance/templates')}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

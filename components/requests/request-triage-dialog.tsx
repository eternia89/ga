'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { triageSchema, TriageFormData } from '@/lib/validations/request-schema';
import { RequestWithRelations } from '@/lib/types/database';
import { triageRequest } from '@/app/actions/request-actions';
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import { PhotoLightbox } from './request-photo-lightbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { PRIORITY_LABELS } from '@/lib/constants/request-status';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

interface RequestTriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  photoUrls: PhotoItem[];
  onSuccess: () => void;
}

export function RequestTriageDialog({
  open,
  onOpenChange,
  request,
  categories,
  users,
  photoUrls,
  onSuccess,
}: RequestTriageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const form = useForm<TriageFormData>({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      category_id: '',
      priority: undefined,
      assigned_to: '',
    },
  });

  // Reset form when dialog opens/closes or request changes
  useEffect(() => {
    if (open) {
      form.reset({
        category_id: request?.category_id ?? '',
        priority: request?.priority ?? undefined,
        assigned_to: request?.assigned_to ?? '',
      });
      setFeedback(null);
      setShowFullDescription(false);
    }
  }, [open, request, form]);

  const onSubmit = async (data: TriageFormData) => {
    if (!request) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await triageRequest({ id: request.id, data });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Request triaged successfully' });
      onSuccess();
      // Close dialog shortly after success feedback
      setTimeout(() => {
        onOpenChange(false);
      }, 800);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to triage request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const description = request?.description ?? '';
  const isLongDescription = description.length > 200;
  const displayedDescription =
    isLongDescription && !showFullDescription
      ? description.slice(0, 200) + '...'
      : description;

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ label, value }));
  const userOptions = users.map((u) => ({ label: u.name, value: u.id }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>
              Triage Request{request ? ` — ${request.display_id}` : ''}
            </DialogTitle>
          </DialogHeader>

          {request && (
            <div className="space-y-4">
              {/* Read-only section */}
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {displayedDescription}
                  </p>
                  {isLongDescription && (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-xs text-blue-600 mt-1 hover:underline"
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {request.location && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Location
                    </p>
                    <p className="text-sm text-foreground">{request.location.name}</p>
                  </div>
                )}

                {photoUrls.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Photos
                    </p>
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
              </div>

              {/* Triage form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
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
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          PIC (Person in Charge) <span className="text-destructive">*</span>
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

                  {feedback && (
                    <InlineFeedback
                      type={feedback.type}
                      message={feedback.message}
                      onDismiss={() => setFeedback(null)}
                    />
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Triaging...' : 'Complete Triage'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

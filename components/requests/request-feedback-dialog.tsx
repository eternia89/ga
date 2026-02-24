'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema, FeedbackFormData } from '@/lib/validations/job-schema';
import { submitFeedback } from '@/app/actions/request-actions';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InlineFeedback } from '@/components/inline-feedback';
import { FeedbackStarRating } from './feedback-star-rating';

interface RequestFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  requestDisplayId: string;
  onSuccess: () => void;
}

export function RequestFeedbackDialog({
  open,
  onOpenChange,
  requestId,
  requestDisplayId,
  onSuccess,
}: RequestFeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      request_id: requestId,
      rating: 0,
      comment: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        request_id: requestId,
        rating: 0,
        comment: '',
      });
      setErrorMessage(null);
    }
  }, [open, form, requestId]);

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitFeedback(data);
      if (result?.serverError) {
        setErrorMessage(result.serverError);
        return;
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingValue = form.watch('rating');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Give Feedback</AlertDialogTitle>
          <AlertDialogDescription>
            Share your feedback for request{' '}
            <span className="font-medium">{requestDisplayId}</span>. Rate the quality of the
            completed work.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Star rating via Controller */}
            <Controller
              control={form.control}
              name="rating"
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Rating <span className="text-destructive">*</span>
                  </label>
                  <FeedbackStarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                  {ratingValue > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {ratingValue === 1 && 'Very poor'}
                      {ratingValue === 2 && 'Poor'}
                      {ratingValue === 3 && 'Acceptable'}
                      {ratingValue === 4 && 'Good'}
                      {ratingValue === 5 && 'Excellent'}
                    </p>
                  )}
                  {fieldState.error && (
                    <p className="text-sm font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share any additional comments about the work done..."
                      maxLength={200}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMessage && (
              <InlineFeedback
                type="error"
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Skip</AlertDialogCancel>
              <Button type="submit" disabled={isSubmitting || ratingValue === 0}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

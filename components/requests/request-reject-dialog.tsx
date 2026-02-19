'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rejectSchema, RejectFormData } from '@/lib/validations/request-schema';
import { rejectRequest } from '@/app/actions/request-actions';
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

interface RequestRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  requestDisplayId: string;
  onSuccess: () => void;
}

export function RequestRejectDialog({
  open,
  onOpenChange,
  requestId,
  requestDisplayId,
  onSuccess,
}: RequestRejectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
      setFeedback(null);
    }
  }, [open, form]);

  const onSubmit = async (data: RejectFormData) => {
    if (!requestId) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await rejectRequest({ id: requestId, data });
      if (result?.serverError) {
        setFeedback(result.serverError);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Request {requestDisplayId}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently reject the request. Please provide a reason for rejection.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Rejection Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this request is being rejected..."
                      maxLength={1000}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {feedback && (
              <InlineFeedback
                type="error"
                message={feedback}
                onDismiss={() => setFeedback(null)}
              />
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

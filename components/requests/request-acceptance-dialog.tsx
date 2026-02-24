'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { acceptRequest, rejectCompletedWork } from '@/app/actions/request-actions';
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

// ============================================================================
// Schemas
// ============================================================================

const rejectWorkSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason must be under 1000 characters'),
});

type RejectWorkFormData = z.infer<typeof rejectWorkSchema>;

// ============================================================================
// Props
// ============================================================================

interface RequestAcceptanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'accept' | 'reject';
  requestId: string;
  requestDisplayId: string;
  onAccepted?: () => void;
  onSuccess: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function RequestAcceptanceDialog({
  open,
  onOpenChange,
  mode,
  requestId,
  requestDisplayId,
  onAccepted,
  onSuccess,
}: RequestAcceptanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<RejectWorkFormData>({
    resolver: zodResolver(rejectWorkSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
      setErrorMessage(null);
    }
  }, [open, form]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await acceptRequest({ request_id: requestId });
      if (result?.serverError) {
        setErrorMessage(result.serverError);
        return;
      }
      onOpenChange(false);
      onSuccess();
      onAccepted?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (data: RejectWorkFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await rejectCompletedWork({ request_id: requestId, reason: data.reason });
      if (result?.serverError) {
        setErrorMessage(result.serverError);
        return;
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reject work');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'accept') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Completed Work?</AlertDialogTitle>
            <AlertDialogDescription>
              You are accepting the completed work for request{' '}
              <span className="font-medium">{requestDisplayId}</span>. This will mark the request as
              accepted. You can optionally submit feedback afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorMessage && (
            <InlineFeedback
              type="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button onClick={handleAccept} disabled={isSubmitting}>
              {isSubmitting ? 'Accepting...' : 'Accept Work'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Reject mode
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Completed Work?</AlertDialogTitle>
          <AlertDialogDescription>
            Work on request <span className="font-medium">{requestDisplayId}</span> will be sent
            back to In Progress. The assigned PIC will be able to rework and resubmit.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleReject)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason for Rejection <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what needs to be fixed or reworked..."
                      maxLength={1000}
                      rows={4}
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
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Rejecting...' : 'Reject Work'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

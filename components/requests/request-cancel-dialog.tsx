'use client';

import { useState } from 'react';
import { cancelRequest } from '@/app/actions/request-actions';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { InlineFeedback } from '@/components/inline-feedback';

interface RequestCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  requestDisplayId: string;
  onSuccess: () => void;
}

export function RequestCancelDialog({
  open,
  onOpenChange,
  requestId,
  requestDisplayId,
  onSuccess,
}: RequestCancelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!requestId) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await cancelRequest({ id: requestId });
      if (result?.serverError) {
        setFeedback(result.serverError);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Request {requestDisplayId}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The request will be marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {feedback && (
          <InlineFeedback
            type="error"
            message={feedback}
            onDismiss={() => setFeedback(null)}
          />
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Keep Request
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import { useState } from 'react';
import { cancelJob } from '@/app/actions/job-actions';
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

interface JobCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  jobDisplayId: string;
  onSuccess: () => void;
}

export function JobCancelDialog({
  open,
  onOpenChange,
  jobId,
  jobDisplayId,
  onSuccess,
}: JobCancelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!jobId) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await cancelJob({ id: jobId });
      if (result?.serverError) {
        setFeedback(result.serverError);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to cancel job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Job {jobDisplayId}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The job will be marked as cancelled and any linked
            requests will be moved back to triaged status.
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
          <AlertDialogCancel disabled={isSubmitting}>Keep Job</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cancelling...' : 'Cancel Job'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

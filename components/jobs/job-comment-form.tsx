'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addJobComment } from '@/app/actions/job-actions';
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

const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be under 1000 characters'),
});

type CommentFormData = z.infer<typeof commentFormSchema>;

interface JobCommentFormProps {
  jobId: string;
  onSuccess?: () => void;
}

export function JobCommentForm({ jobId, onSuccess }: JobCommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addJobComment({ job_id: jobId, content: data.content });

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      form.reset();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-semibold mb-3">Add Comment</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Comment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a comment or progress update..."
                    className="min-h-20 resize-y"
                    maxLength={1000}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  {field.value.length}/1000
                </p>
              </FormItem>
            )}
          />

          {error && (
            <InlineFeedback
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

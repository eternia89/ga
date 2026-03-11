'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ImagePlus } from 'lucide-react';
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

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be under 1000 characters'),
});

type CommentFormData = z.infer<typeof commentFormSchema>;

interface JobCommentFormProps {
  jobId: string;
  jobStatus?: string;
  onSuccess?: () => void;
}

export function JobCommentForm({ jobId, jobStatus, onSuccess }: JobCommentFormProps) {
  if (jobStatus && ['completed', 'cancelled'].includes(jobStatus)) {
    return null;
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: '' },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be under 5 MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the comment record
      const result = await addJobComment({ job_id: jobId, content: data.content });

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      const commentId = result?.data?.commentId as string | undefined;

      // Step 2: Upload photo if selected (requires commentId from action)
      if (photoFile && commentId) {
        const formData = new FormData();
        formData.append('comment_id', commentId);
        formData.append('photo', photoFile);

        const uploadRes = await fetch('/api/uploads/job-photos', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          setError(uploadErr?.error ?? 'Photo upload failed, but comment was saved.');
          // Don't block the success — comment is already saved
        }
      }

      form.reset();
      removePhoto();
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

          {/* Photo upload */}
          <div className="space-y-2">
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Photo preview"
                  className="h-24 w-24 rounded border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={isSubmitting}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded border border-dashed border-border px-3 py-2"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Attach photo (optional)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
              aria-label="Upload photo"
            />
          </div>

          {error && (
            <InlineFeedback
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

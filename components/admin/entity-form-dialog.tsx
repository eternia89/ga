"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/inline-feedback";

export interface EntityFormDialogProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  onSubmit: (data: T) => Promise<{ error?: string }>;
  onSuccess?: () => void;
  title: string;
  description?: string;
  submitLabel: string;
  submittingLabel: string;
  children: (form: UseFormReturn<T>) => React.ReactNode;
}

export function EntityFormDialog<T extends FieldValues>({
  open,
  onOpenChange,
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  title,
  description,
  submitLabel,
  submittingLabel,
  children,
}: EntityFormDialogProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(schema as any) as any,
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setFeedback(null);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setFeedback(null);

      try {
        const result = await onSubmit(data);
        if (result.error) {
          setFeedback({ type: "error", message: result.error });
          return;
        }

        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } catch (err) {
        setFeedback({
          type: "error",
          message:
            err instanceof Error ? err.message : "Something went wrong",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, form, onOpenChange, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {children(form)}

            {feedback && (
              <InlineFeedback
                type={feedback.type}
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
              />
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

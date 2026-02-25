'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { companySettingsSchema, type CompanySettingsFormData } from '@/lib/validations/job-schema';
import { updateCompanySetting } from '@/app/actions/company-settings-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineFeedback } from '@/components/inline-feedback';

interface CompanySettingsFormProps {
  budgetThreshold: number;
}

export function CompanySettingsForm({ budgetThreshold }: CompanySettingsFormProps) {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      budget_threshold: budgetThreshold,
    },
  });

  const { execute, isPending } = useAction(updateCompanySetting, {
    onSuccess: () => {
      setFeedback({
        type: 'success',
        message: 'Company settings saved successfully.',
      });
    },
    onError: ({ error }) => {
      setFeedback({
        type: 'error',
        message: error.serverError ?? 'Failed to save settings. Please try again.',
      });
    },
  });

  function onSubmit(data: CompanySettingsFormData) {
    setFeedback(null);
    execute({
      key: 'budget_threshold',
      value: data.budget_threshold.toString(),
    });
  }

  return (
    <div className="space-y-6">
      {/* Budget Approval Settings Card */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Budget Approval</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the approval threshold for job cost estimates.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="budget_threshold">Budget Threshold</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                Rp
              </span>
              <Input
                id="budget_threshold"
                type="number"
                min={0}
                step={1}
                className="pl-10"
                {...form.register('budget_threshold', { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.budget_threshold && (
              <p className="text-sm text-red-600">
                {form.formState.errors.budget_threshold.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Jobs with estimated cost at or above this amount will require CEO
              approval before proceeding. Set to 0 to disable automatic approval
              routing.
            </p>
          </div>

          {feedback && (
            <InlineFeedback
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
              className="max-w-sm"
            />
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>

      {/* Future settings sections can be added here */}
    </div>
  );
}

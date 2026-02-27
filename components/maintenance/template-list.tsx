'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { InlineFeedback } from '@/components/inline-feedback';
import { templateColumns } from './template-columns';
import { deactivateTemplate, reactivateTemplate } from '@/app/actions/template-actions';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';
import type { TemplateTableMeta } from './template-columns';

interface TemplateListProps {
  templates: MaintenanceTemplate[];
  userRole: string;
}

export function TemplateList({ templates, userRole }: TemplateListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canCreate = ['ga_lead', 'admin'].includes(userRole);
  const canManage = ['ga_lead', 'admin'].includes(userRole);

  function handleDeactivate(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await deactivateTemplate({ id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Template deactivated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to deactivate template.' });
      }
    });
  }

  function handleReactivate(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await reactivateTemplate({ id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Template reactivated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to reactivate template.' });
      }
    });
  }

  const meta: TemplateTableMeta = {
    onDeactivate: canManage ? handleDeactivate : undefined,
    onReactivate: canManage ? handleReactivate : undefined,
    currentUserRole: userRole,
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <DataTable
        columns={templateColumns}
        data={templates}
        emptyMessage="No maintenance templates found."
        createButton={
          canCreate ? (
            <Button asChild size="sm" disabled={isPending}>
              <Link href="/maintenance/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Link>
            </Button>
          ) : undefined
        }
        meta={meta}
      />
    </div>
  );
}

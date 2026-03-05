'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { templateColumns } from './template-columns';
import { TemplateViewModal } from './template-view-modal';
import { deactivateTemplate, reactivateTemplate } from '@/app/actions/template-actions';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';
import type { TemplateTableMeta } from './template-columns';

interface TemplateListProps {
  templates: MaintenanceTemplate[];
  userRole: string;
  initialViewId?: string;
}

export function TemplateList({ templates, userRole, initialViewId }: TemplateListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View modal state
  const [viewTemplateId, setViewTemplateId] = useState<string | null>(initialViewId ?? null);

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

  const handleView = (template: MaintenanceTemplate) => {
    setViewTemplateId(template.id);
  };

  const handleModalActionSuccess = () => {
    setFeedback({ type: 'success', message: 'Action completed successfully' });
    router.refresh();
  };

  const meta: TemplateTableMeta = {
    onView: handleView,
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
        meta={meta}
      />

      {/* Template view modal */}
      <TemplateViewModal
        templateId={viewTemplateId}
        onOpenChange={(open) => { if (!open) setViewTemplateId(null); }}
        userRole={userRole}
        onActionSuccess={handleModalActionSuccess}
        templateIds={templates.map((t) => t.id)}
        onNavigate={setViewTemplateId}
      />
    </div>
  );
}

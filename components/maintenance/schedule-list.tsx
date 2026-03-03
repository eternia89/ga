'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { scheduleColumns } from './schedule-columns';
import { deactivateSchedule, activateSchedule, deleteSchedule } from '@/app/actions/schedule-actions';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import type { ScheduleTableMeta } from './schedule-columns';

interface ScheduleListProps {
  schedules: MaintenanceSchedule[];
  userRole: string;
}

export function ScheduleList({ schedules, userRole }: ScheduleListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManage = ['ga_lead', 'admin'].includes(userRole);

  function handleDeactivate(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await deactivateSchedule({ id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Schedule paused.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to pause schedule.' });
      }
    });
  }

  function handleActivate(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await activateSchedule({ id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Schedule resumed.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to resume schedule.' });
      }
    });
  }

  function handleDelete(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteSchedule({ id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Schedule deactivated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to deactivate schedule.' });
      }
    });
  }

  const meta: ScheduleTableMeta = {
    onDeactivate: canManage ? handleDeactivate : undefined,
    onActivate: canManage ? handleActivate : undefined,
    onDelete: canManage ? handleDelete : undefined,
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
        columns={scheduleColumns}
        data={schedules}
        emptyMessage="No maintenance schedules found."
        meta={meta}
      />
    </div>
  );
}

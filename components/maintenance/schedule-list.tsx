'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
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

  const canCreate = ['ga_lead', 'admin'].includes(userRole);
  const canManage = ['ga_lead', 'admin'].includes(userRole);

  function handleDeactivate(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await deactivateSchedule({ id });
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

  function handleActivate(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await activateSchedule({ id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Schedule activated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to activate schedule.' });
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
        setFeedback({ type: 'success', message: 'Schedule deleted.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to delete schedule.' });
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
        createButton={
          canCreate ? (
            <Button asChild size="sm" disabled={isPending}>
              <Link href="/maintenance/schedules/new">
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Link>
            </Button>
          ) : undefined
        }
        meta={meta}
      />
    </div>
  );
}

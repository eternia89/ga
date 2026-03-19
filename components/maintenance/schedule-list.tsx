'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { scheduleColumns } from './schedule-columns';
import { ScheduleViewModal } from './schedule-view-modal';
import { deactivateSchedule, activateSchedule, deleteSchedule } from '@/app/actions/schedule-actions';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import { LEAD_ROLES } from '@/lib/constants/roles';
import type { ScheduleTableMeta } from './schedule-columns';

interface ScheduleListProps {
  schedules: MaintenanceSchedule[];
  userRole: string;
  initialViewId?: string;
}

export function ScheduleList({ schedules, userRole, initialViewId }: ScheduleListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View modal state
  const [viewScheduleId, setViewScheduleId] = useState<string | null>(initialViewId ?? null);

  const canManage = (LEAD_ROLES as readonly string[]).includes(userRole);

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

  const handleView = (schedule: MaintenanceSchedule) => {
    setViewScheduleId(schedule.id);
  };

  const handleModalActionSuccess = () => {
    setFeedback({ type: 'success', message: 'Action completed successfully' });
    router.refresh();
  };

  const meta: ScheduleTableMeta = {
    onView: handleView,
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

      {/* Schedule view modal */}
      <ScheduleViewModal
        scheduleId={viewScheduleId}
        onOpenChange={(open) => { if (!open) setViewScheduleId(null); }}
        userRole={userRole}
        onActionSuccess={handleModalActionSuccess}
        scheduleIds={schedules.map((s) => s.id)}
        onNavigate={setViewScheduleId}
      />
    </div>
  );
}

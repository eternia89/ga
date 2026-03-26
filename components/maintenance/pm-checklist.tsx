'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { PMChecklistItem } from './pm-checklist-item';
import { JOB_TERMINAL_STATUSES } from '@/lib/constants/job-status';
import type { PMJobChecklist, ChecklistResponse } from '@/lib/types/maintenance';

interface PMChecklistProps {
  jobId: string;
  checklist: PMJobChecklist;
  jobStatus: string;
  canEdit: boolean;
}

/**
 * Checklist fill-out component rendered on the PM job detail page.
 * Shows checklist items from the job's checklist_responses JSONB.
 *
 * Props:
 * - canEdit: true when job status is 'assigned' or 'in_progress' AND current user is the PIC
 * - If job is completed/cancelled, shows read-only view (no edit controls)
 *
 * Per CONTEXT.md: "Checklist appears inline on the PM job detail page;
 * PIC fills it out item by item with save-as-you-go"
 *
 * Integration with Phase 5 job detail page:
 * - Render <PMChecklist> below the job info panel when:
 *   job.job_type === 'preventive_maintenance' && job.checklist_responses !== null
 * - Pass canEdit = (job.status in ['assigned', 'in_progress']) && (currentUserId === job.assigned_to)
 *   OR isGaLeadOrAdmin (leads can also edit)
 */
export function PMChecklist({ jobId, checklist, jobStatus, canEdit }: PMChecklistProps) {
  const [items, setItems] = useState<ChecklistResponse[]>(checklist.items);

  const completedCount = items.filter(
    (r) => r.value !== null && r.value !== undefined
  ).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allComplete = completedCount === totalCount;

  const handleItemSaved = (itemId: string, value: ChecklistResponse['value']) => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId
          ? { ...item, value, completed_at: value !== null ? new Date().toISOString() : undefined }
          : item
      )
    );
  };

  const isReadOnly = !canEdit || (JOB_TERMINAL_STATUSES as readonly string[]).includes(jobStatus);

  return (
    <div className="rounded-lg border p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight truncate">
              {checklist.template_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">PM Checklist</p>
          </div>
        </div>

        {/* Progress counter */}
        <div className="shrink-0 text-right">
          <span className="text-sm font-medium tabular-nums">
            {completedCount}/{totalCount}
          </span>
          <p className="text-xs text-muted-foreground">completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={[
              'h-full rounded-full transition-all duration-300',
              allComplete
                ? 'bg-green-500'
                : 'bg-primary',
            ].join(' ')}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">{progressPct}%</p>
      </div>

      {/* All complete success state */}
      {allComplete && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-700">
            All {totalCount} checklist items completed
          </p>
        </div>
      )}

      {/* Read-only banner */}
      {isReadOnly && !(JOB_TERMINAL_STATUSES as readonly string[]).includes(jobStatus) && (
        <div className="rounded-md bg-muted/50 border px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Read-only — only the assigned PIC or a GA Lead can fill out this checklist.
          </p>
        </div>
      )}
      {(JOB_TERMINAL_STATUSES as readonly string[]).includes(jobStatus) && (
        <div className="rounded-md bg-muted/50 border px-4 py-2">
          <p className="text-xs text-muted-foreground">
            This job is {jobStatus} — checklist is read-only.
          </p>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <PMChecklistItem
            key={item.item_id}
            item={item}
            jobId={jobId}
            canEdit={!isReadOnly}
            onSaved={handleItemSaved}
          />
        ))}
      </div>

      {totalCount === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No checklist items found.
        </p>
      )}
    </div>
  );
}

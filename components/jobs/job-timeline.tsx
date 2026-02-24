'use client';

import { JobComment } from '@/lib/types/database';
import { JOB_STATUS_LABELS } from '@/lib/constants/job-status';

export type JobTimelineEventType =
  | 'created'
  | 'status_change'
  | 'assignment'
  | 'approval'
  | 'approval_rejection'
  | 'approval_submitted'
  | 'cancellation'
  | 'field_update'
  | 'comment';

export interface JobTimelineEvent {
  type: JobTimelineEventType;
  at: string; // ISO timestamp
  by: string; // user name or 'System'
  details?: Record<string, unknown>;
}

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
  commentId: string;
}

interface JobTimelineProps {
  events: JobTimelineEvent[];
  comments: JobComment[];
  commentPhotos: PhotoItem[];
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventLabel(event: JobTimelineEvent): { label: string; detail?: string } {
  switch (event.type) {
    case 'created':
      return { label: 'Job created' };
    case 'assignment': {
      const newPic = event.details?.new_pic as string | undefined;
      const oldPic = event.details?.old_pic as string | null | undefined;
      if (oldPic) {
        return { label: `Reassigned to ${newPic ?? 'Unknown'}`, detail: `Previously: ${oldPic}` };
      }
      return { label: `Assigned to ${newPic ?? 'Unknown'}` };
    }
    case 'status_change': {
      const oldStatus = event.details?.old_status as string | undefined;
      const newStatus = event.details?.new_status as string | undefined;
      const from = oldStatus ? (JOB_STATUS_LABELS[oldStatus] ?? oldStatus) : '—';
      const to = newStatus ? (JOB_STATUS_LABELS[newStatus] ?? newStatus) : '—';
      return { label: `Status changed: ${from} → ${to}` };
    }
    case 'approval_submitted':
      return { label: 'Submitted for approval' };
    case 'approval':
      return { label: 'Approved — work can proceed' };
    case 'approval_rejection': {
      const reason = event.details?.reason as string | undefined;
      return { label: 'Approval rejected', detail: reason };
    }
    case 'cancellation':
      return { label: 'Job cancelled' };
    case 'field_update': {
      const field = event.details?.field as string | undefined;
      return { label: `Field updated: ${field ?? 'unknown'}` };
    }
    default:
      return { label: 'Activity' };
  }
}

export function JobTimeline({ events, comments, commentPhotos }: JobTimelineProps) {
  type TimelineItem =
    | { kind: 'event'; ts: string; data: JobTimelineEvent }
    | { kind: 'comment'; ts: string; data: JobComment & { photo?: PhotoItem } };

  const allItems: TimelineItem[] = [
    ...events.map((e) => ({ kind: 'event' as const, ts: e.at, data: e })),
    ...comments.map((c) => ({
      kind: 'comment' as const,
      ts: c.created_at,
      data: {
        ...c,
        photo: commentPhotos.find((p) => p.commentId === c.id),
      },
    })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  if (allItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {allItems.map((item, i) => {
        const isLast = i === allItems.length - 1;

        if (item.kind === 'event') {
          const { label, detail } = eventLabel(item.data);
          return (
            <div key={`event-${i}`} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center pt-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0 mt-0.5" />
                {!isLast && <div className="w-px flex-1 bg-border min-h-[16px] mt-1" />}
              </div>
              <div className={`min-w-0 ${isLast ? '' : 'pb-4'}`}>
                <p className="font-medium text-sm">{label}</p>
                {detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                    {detail}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {item.data.by} &middot; {formatTimestamp(item.data.at)}
                </p>
              </div>
            </div>
          );
        }

        const comment = item.data;
        return (
          <div key={`comment-${comment.id}`} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center pt-1">
              <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0 mt-0.5" />
              {!isLast && <div className="w-px flex-1 bg-border min-h-[16px] mt-1" />}
            </div>
            <div className={`min-w-0 ${isLast ? '' : 'pb-4'}`}>
              <p className="font-medium text-sm">
                {comment.user?.full_name ?? 'Unknown'}{' '}
                <span className="font-normal text-muted-foreground">commented</span>
              </p>
              <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.content}</p>
              {comment.photo && (
                <img
                  src={comment.photo.url}
                  alt={comment.photo.fileName}
                  className="mt-2 h-24 w-auto rounded border object-cover"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(comment.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

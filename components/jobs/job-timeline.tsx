'use client';

import { useState } from 'react';
import { formatDateTime, formatIDR } from '@/lib/utils';
import {
  Plus,
  ArrowRight,
  UserCheck,
  Pencil,
  Ban,
  Send,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MapPin,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JobComment } from '@/lib/types/database';
import { JOB_STATUS_LABELS } from '@/lib/constants/job-status';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';

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

export type JobTimelineEvent = {
  type: JobTimelineEventType;
  at: string; // ISO timestamp
  by: string; // user name or 'System'
  details?: Record<string, unknown>;
  // GPS coordinates captured at time of status change (REQ-JOB-010)
  latitude?: number | null;
  longitude?: number | null;
};

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

const EVENT_ICONS: Record<JobTimelineEventType, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  assignment: <UserCheck className="h-3.5 w-3.5" />,
  status_change: <ArrowRight className="h-3.5 w-3.5" />,
  approval_submitted: <Send className="h-3.5 w-3.5" />,
  approval: <ThumbsUp className="h-3.5 w-3.5" />,
  approval_rejection: <ThumbsDown className="h-3.5 w-3.5" />,
  cancellation: <Ban className="h-3.5 w-3.5" />,
  field_update: <Pencil className="h-3.5 w-3.5" />,
  comment: <MessageCircle className="h-3.5 w-3.5" />,
};

const EVENT_COLORS: Record<JobTimelineEventType, string> = {
  created: 'bg-green-100 text-green-700',
  assignment: 'bg-blue-100 text-blue-700',
  status_change: 'bg-blue-100 text-blue-700',
  approval_submitted: 'bg-purple-100 text-purple-700',
  approval: 'bg-green-100 text-green-700',
  approval_rejection: 'bg-red-100 text-red-700',
  cancellation: 'bg-stone-100 text-stone-600',
  field_update: 'bg-gray-100 text-gray-600',
  comment: 'bg-muted text-muted-foreground',
};

const FIELD_LABELS: Record<string, string> = {
  estimated_cost: 'Estimated Cost',
};

function formatFieldValue(field: string | undefined, value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (field === 'estimated_cost') {
    const num = parseFloat(value);
    return isNaN(num) ? value : formatIDR(num);
  }
  return value;
}

function EventContent({ event }: { event: JobTimelineEvent }) {
  switch (event.type) {
    case 'created':
      return (
        <span>
          <span className="font-medium">{event.by}</span> created this job
        </span>
      );

    case 'assignment': {
      const newPic = event.details?.new_pic as string | undefined;
      const oldPic = event.details?.old_pic as string | null | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span>{' '}
          {oldPic ? 'reassigned PIC' : 'assigned PIC'}
          {oldPic && (
            <span className="text-muted-foreground"> from {oldPic}</span>
          )}
          {newPic && (
            <span>
              {' '}to <span className="font-medium">{newPic}</span>
            </span>
          )}
        </span>
      );
    }

    case 'status_change': {
      const oldStatus = event.details?.old_status as string | undefined;
      const newStatus = event.details?.new_status as string | undefined;
      const oldLabel = oldStatus ? (JOB_STATUS_LABELS[oldStatus] ?? oldStatus) : '?';
      const newLabel = newStatus ? (JOB_STATUS_LABELS[newStatus] ?? newStatus) : '?';
      return (
        <span>
          <span className="font-medium">{event.by}</span> changed status from{' '}
          <span className="font-medium">{oldLabel}</span> to{' '}
          <span className="font-medium">{newLabel}</span>
        </span>
      );
    }

    case 'approval_submitted':
      return (
        <span>
          <span className="font-medium">{event.by}</span> submitted this job for approval
        </span>
      );

    case 'approval':
      return (
        <span>
          <span className="font-medium">{event.by}</span> approved this job — work can proceed
        </span>
      );

    case 'approval_rejection': {
      const reason = event.details?.reason as string | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span> rejected this job
          {reason && (
            <blockquote className="mt-1 border-l-2 border-red-300 pl-3 text-xs text-muted-foreground italic">
              {reason}
            </blockquote>
          )}
        </span>
      );
    }

    case 'cancellation':
      return (
        <span>
          <span className="font-medium">{event.by}</span> cancelled this job
        </span>
      );

    case 'field_update': {
      const field = event.details?.field as string | undefined;
      const rawOldValue = event.details?.old_value as string | undefined;
      const rawNewValue = event.details?.new_value as string | undefined;
      const displayLabel = FIELD_LABELS[field ?? ''] ?? field ?? 'a field';
      const oldValue = formatFieldValue(field, rawOldValue);
      const newValue = formatFieldValue(field, rawNewValue);
      return (
        <span>
          <span className="font-medium">{event.by}</span> updated{' '}
          <span className="font-medium">{displayLabel}</span>
          {oldValue !== undefined && newValue !== undefined && (
            <span className="text-muted-foreground">
              {' '}from &ldquo;{oldValue}&rdquo; to &ldquo;{newValue}&rdquo;
            </span>
          )}
        </span>
      );
    }

    default:
      return <span>{event.by} made a change</span>;
  }
}

export function JobTimeline({ events, comments, commentPhotos }: JobTimelineProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  // Build photo lookup by commentId
  const photoByComment: Record<string, PhotoItem> = {};
  for (const photo of commentPhotos) {
    photoByComment[photo.commentId] = photo;
  }

  type TimelineEntry =
    | { kind: 'event'; ts: string; event: JobTimelineEvent }
    | { kind: 'comment'; ts: string; comment: JobComment; photo?: PhotoItem };

  // Merge and sort events + comments by timestamp
  const entries: TimelineEntry[] = [
    ...events.map((event) => ({ kind: 'event' as const, ts: event.at, event })),
    ...comments.map((comment) => ({
      kind: 'comment' as const,
      ts: comment.created_at,
      comment,
      photo: photoByComment[comment.id],
    })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No timeline events yet.
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[600px]">
        <div className="relative pl-6">
          {/* Vertical connector line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {entries.map((entry, index) => {
              if (entry.kind === 'event') {
                const { event } = entry;
                const hasGps = event.latitude != null && event.longitude != null;
                return (
                  <div key={`event-${index}`} className="relative flex gap-3">
                    {/* Icon */}
                    <div
                      className={`absolute -left-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${EVENT_COLORS[event.type]}`}
                    >
                      {EVENT_ICONS[event.type]}
                    </div>
                    {/* Content */}
                    <div className="ml-2 min-w-0 flex-1 space-y-1">
                      <div className="text-xs leading-relaxed">
                        <EventContent event={event} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.at)}
                      </p>
                      {hasGps && (
                        <a
                          href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          View location
                        </a>
                      )}
                    </div>
                  </div>
                );
              }

              // Comment entry
              const { comment, photo } = entry;
              const authorName = comment.user?.full_name ?? 'Unknown';

              return (
                <div key={`comment-${comment.id}`} className="relative flex gap-3">
                  {/* Icon */}
                  <div
                    className={`absolute -left-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${EVENT_COLORS.comment}`}
                  >
                    {EVENT_ICONS.comment}
                  </div>
                  {/* Content */}
                  <div className="ml-2 min-w-0 flex-1 space-y-2">
                    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                      {photo && (
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxPhoto({
                              url: photo.url,
                              fileName: photo.fileName,
                            })
                          }
                          className="block w-24 h-24 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity"
                          aria-label={`View photo: ${photo.fileName}`}
                        >
                          <img
                            src={photo.url}
                            alt={photo.fileName}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {lightboxPhoto && (
        <PhotoLightbox
          src={lightboxPhoto.url}
          alt={lightboxPhoto.fileName}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </>
  );
}

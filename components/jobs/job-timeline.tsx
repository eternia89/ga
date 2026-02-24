'use client';

import { useState } from 'react';
import { format } from 'date-fns';
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
  created: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  assignment: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  status_change: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  approval_submitted: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  approval: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  approval_rejection: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancellation: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  field_update: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  comment: 'bg-muted text-muted-foreground',
};

function formatTimestamp(iso: string): string {
  return format(new Date(iso), 'dd-MM-yyyy, HH:mm:ss');
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
            <blockquote className="mt-1 border-l-2 border-red-300 dark:border-red-700 pl-3 text-sm text-muted-foreground italic">
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
      const oldValue = event.details?.old_value as string | undefined;
      const newValue = event.details?.new_value as string | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span> updated{' '}
          <span className="font-medium">{field ?? 'a field'}</span>
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

          <div className="space-y-6">
            {entries.map((entry, index) => {
              if (entry.kind === 'event') {
                const { event } = entry;
                return (
                  <div key={`event-${index}`} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`absolute -left-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${EVENT_COLORS[event.type]}`}
                    >
                      {EVENT_ICONS[event.type]}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-sm leading-relaxed">
                        <EventContent event={event} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(event.at)}
                      </p>
                    </div>
                  </div>
                );
              }

              // Comment entry
              const { comment, photo } = entry;
              const authorName = comment.user?.full_name ?? 'Unknown';

              return (
                <div key={`comment-${comment.id}`} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`absolute -left-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${EVENT_COLORS.comment}`}
                  >
                    {EVENT_ICONS.comment}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
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

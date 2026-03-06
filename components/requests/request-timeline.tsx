'use client';

import { formatDateTime } from '@/lib/utils';
import {
  Plus,
  ArrowRight,
  ClipboardCheck,
  Pencil,
  XCircle,
  Ban,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { STATUS_LABELS } from '@/lib/constants/request-status';
import { FeedbackStarRating } from './feedback-star-rating';

export type TimelineEvent = {
  type:
    | 'created'
    | 'status_change'
    | 'triage'
    | 'field_update'
    | 'rejection'
    | 'cancellation'
    | 'acceptance'
    | 'acceptance_rejection'
    | 'auto_acceptance'
    | 'feedback';
  at: string;
  by: string;
  details?: Record<string, unknown>;
};

interface RequestTimelineProps {
  events: TimelineEvent[];
}

const EVENT_ICONS: Record<TimelineEvent['type'], React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  status_change: <ArrowRight className="h-3.5 w-3.5" />,
  triage: <ClipboardCheck className="h-3.5 w-3.5" />,
  field_update: <Pencil className="h-3.5 w-3.5" />,
  rejection: <XCircle className="h-3.5 w-3.5" />,
  cancellation: <Ban className="h-3.5 w-3.5" />,
  acceptance: <CheckCircle className="h-3.5 w-3.5" />,
  acceptance_rejection: <XCircle className="h-3.5 w-3.5" />,
  auto_acceptance: <Clock className="h-3.5 w-3.5" />,
  feedback: <MessageSquare className="h-3.5 w-3.5" />,
};

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  created: 'bg-green-100 text-green-700',
  status_change: 'bg-blue-100 text-blue-700',
  triage: 'bg-blue-100 text-blue-700',
  field_update: 'bg-gray-100 text-gray-600',
  rejection: 'bg-red-100 text-red-700',
  cancellation: 'bg-stone-100 text-stone-600',
  acceptance: 'bg-emerald-100 text-emerald-700',
  acceptance_rejection: 'bg-orange-100 text-orange-700',
  auto_acceptance: 'bg-teal-100 text-teal-700',
  feedback: 'bg-amber-100 text-amber-700',
};

function EventContent({ event }: { event: TimelineEvent }) {
  switch (event.type) {
    case 'created':
      return (
        <span>
          <span className="font-medium">{event.by}</span> submitted this request
        </span>
      );

    case 'status_change': {
      const oldStatus = event.details?.old_status as string | undefined;
      const newStatus = event.details?.new_status as string | undefined;
      const oldLabel = oldStatus ? (STATUS_LABELS[oldStatus] ?? oldStatus) : '?';
      const newLabel = newStatus ? (STATUS_LABELS[newStatus] ?? newStatus) : '?';
      return (
        <span>
          <span className="font-medium">{event.by}</span> changed status from{' '}
          <span className="font-medium">{oldLabel}</span> to{' '}
          <span className="font-medium">{newLabel}</span>
        </span>
      );
    }

    case 'triage': {
      const category = event.details?.category as string | undefined;
      const priority = event.details?.priority as string | undefined;
      const pic = event.details?.pic as string | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span> triaged this request
          {(category || priority || pic) && (
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {category && <li>Category: {category}</li>}
              {priority && <li>Priority: {priority}</li>}
              {pic && <li>PIC: {pic}</li>}
            </ul>
          )}
        </span>
      );
    }

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
              {' '}
              from &ldquo;{oldValue}&rdquo; to &ldquo;{newValue}&rdquo;
            </span>
          )}
        </span>
      );
    }

    case 'rejection': {
      const reason = event.details?.reason as string | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span> rejected this request
          {reason && (
            <blockquote className="mt-1 border-l-2 border-red-300 pl-3 text-sm text-muted-foreground italic">
              {reason}
            </blockquote>
          )}
        </span>
      );
    }

    case 'cancellation':
      return (
        <span>
          <span className="font-medium">{event.by}</span> cancelled this request
        </span>
      );

    case 'acceptance':
      return (
        <span>
          <span className="font-medium">{event.by}</span> accepted the completed work
        </span>
      );

    case 'acceptance_rejection': {
      const reason = event.details?.reason as string | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span> rejected the completed work
          {reason && (
            <blockquote className="mt-1 border-l-2 border-orange-300 pl-3 text-sm text-muted-foreground italic">
              {reason}
            </blockquote>
          )}
        </span>
      );
    }

    case 'auto_acceptance':
      return <span>Auto-accepted — no response within 7 days</span>;

    case 'feedback': {
      const rating = event.details?.rating as number | undefined;
      const comment = event.details?.comment as string | undefined;
      return (
        <span>
          <span className="font-medium">{event.by}</span> submitted feedback
          {rating != null && (
            <div className="mt-1">
              <FeedbackStarRating value={rating} readOnly size="sm" />
            </div>
          )}
          {comment && (
            <blockquote className="mt-1 border-l-2 border-amber-300 pl-3 text-sm text-muted-foreground italic">
              {comment}
            </blockquote>
          )}
        </span>
      );
    }

    default:
      return <span>{event.by} made a change</span>;
  }
}

export function RequestTimeline({ events }: RequestTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No timeline events yet.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="relative pl-6">
        {/* Vertical connector line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Icon circle on the line */}
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
                <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

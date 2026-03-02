'use client';

import { StatusBadge } from '@/components/status-badge';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/lib/constants/job-status';

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return <StatusBadge status={status} labels={JOB_STATUS_LABELS} colors={JOB_STATUS_COLORS} />;
}

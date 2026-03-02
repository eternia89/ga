'use client';

import { StatusBadge } from '@/components/status-badge';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants/request-status';

interface RequestStatusBadgeProps {
  status: string;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  return <StatusBadge status={status} labels={STATUS_LABELS} colors={STATUS_COLORS} />;
}

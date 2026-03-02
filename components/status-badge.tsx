'use client';

interface StatusBadgeProps {
  status: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
}

export function StatusBadge({ status, labels, colors }: StatusBadgeProps) {
  const label = labels[status] ?? status;
  const colorClass = colors[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

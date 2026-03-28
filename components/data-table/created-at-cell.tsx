import { formatDate } from '@/lib/utils';

export function CreatedAtCell({ date }: { date: string }) {
  return <span className="text-sm">{formatDate(date)}</span>;
}

import { format } from 'date-fns';

export function CreatedAtCell({ date }: { date: string }) {
  return <span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>;
}

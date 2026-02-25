import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type MaintenanceItem } from '@/lib/dashboard/queries';

interface MaintenanceSummaryProps {
  data: MaintenanceItem[];
}

const URGENCY_STYLES: Record<MaintenanceItem['urgency'], string> = {
  overdue: 'bg-red-50 border-red-200',
  due_this_week: 'bg-yellow-50 border-yellow-200',
  due_this_month: 'bg-background border-border',
};

const URGENCY_LABEL: Record<MaintenanceItem['urgency'], string> = {
  overdue: 'Overdue',
  due_this_week: 'Due This Week',
  due_this_month: 'Due This Month',
};

const URGENCY_BADGE_STYLES: Record<MaintenanceItem['urgency'], string> = {
  overdue: 'bg-red-100 text-red-700',
  due_this_week: 'bg-yellow-100 text-yellow-700',
  due_this_month: 'bg-blue-100 text-blue-700',
};

export function MaintenanceSummary({ data }: MaintenanceSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Maintenance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No maintenance due
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start justify-between gap-2 rounded-md border p-3',
                  URGENCY_STYLES[item.urgency]
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.assetName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.templateName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Due: {format(new Date(item.dueDate), 'dd-MM-yyyy')}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-xs px-2 py-0.5 rounded font-medium',
                    URGENCY_BADGE_STYLES[item.urgency]
                  )}
                >
                  {URGENCY_LABEL[item.urgency]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

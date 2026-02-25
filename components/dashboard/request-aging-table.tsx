import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type AgingBucket } from '@/lib/dashboard/queries';

interface RequestAgingTableProps {
  data: AgingBucket[];
}

export function RequestAgingTable({ data }: RequestAgingTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Request Aging</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {data.map((bucket) => (
                <TableHead key={bucket.bucket} className="text-center">
                  {bucket.bucket}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {data.map((bucket) => (
                <TableCell
                  key={bucket.bucket}
                  className={cn(
                    'text-center text-lg font-bold',
                    bucket.bucket === '15+ days' && bucket.count > 0
                      ? 'text-red-600 dark:text-red-400'
                      : ''
                  )}
                >
                  {bucket.count}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

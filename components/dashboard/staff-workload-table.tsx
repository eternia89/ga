'use client';

import { useState } from 'react';
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

export interface StaffWorkloadItem {
  staffName: string;
  staffId: string;
  activeJobs: number;
  completedThisMonth: number;
  overdue: number;
}

type SortColumn = 'staffName' | 'activeJobs' | 'completedThisMonth' | 'overdue';
type SortDirection = 'asc' | 'desc';

interface StaffWorkloadTableProps {
  data: StaffWorkloadItem[];
}

export function StaffWorkloadTable({ data }: StaffWorkloadTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('activeJobs');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const dir = sortDirection === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * dir;
    }
    return ((aVal as number) - (bVal as number)) * dir;
  });

  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <span className="ml-1 text-muted-foreground/50">↕</span>;
    return (
      <span className="ml-1 text-foreground">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const headerClass = 'cursor-pointer select-none hover:text-foreground transition-colors';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Staff Workload</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={headerClass}
                onClick={() => handleSort('staffName')}
              >
                Staff Name
                <SortIndicator column="staffName" />
              </TableHead>
              <TableHead
                className={cn(headerClass, 'text-right')}
                onClick={() => handleSort('activeJobs')}
              >
                Active Jobs
                <SortIndicator column="activeJobs" />
              </TableHead>
              <TableHead
                className={cn(headerClass, 'text-right')}
                onClick={() => handleSort('completedThisMonth')}
              >
                Completed (Month)
                <SortIndicator column="completedThisMonth" />
              </TableHead>
              <TableHead
                className={cn(headerClass, 'text-right')}
                onClick={() => handleSort('overdue')}
              >
                Overdue
                <SortIndicator column="overdue" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  No staff data available
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => (
                <TableRow key={row.staffId}>
                  <TableCell className="font-medium">{row.staffName}</TableCell>
                  <TableCell className="text-right">{row.activeJobs}</TableCell>
                  <TableCell className="text-right">{row.completedThisMonth}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      row.overdue > 0 ? 'text-red-600' : ''
                    )}
                  >
                    {row.overdue}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

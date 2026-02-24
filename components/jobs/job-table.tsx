'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { JobWithRelations } from '@/lib/types/database';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { InlineFeedback } from '@/components/inline-feedback';
import { jobColumns } from './job-columns';
import { JobFilters, jobFilterParsers } from './job-filters';
import { JobCancelDialog } from './job-cancel-dialog';

interface JobTableProps {
  data: JobWithRelations[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
}

export function JobTable({
  data,
  users,
  currentUserId,
  currentUserRole,
}: JobTableProps) {
  const router = useRouter();
  const [filters] = useQueryStates(jobFilterParsers);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [cancellingDisplayId, setCancellingDisplayId] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);

  // Client-side filtering based on URL params
  const filteredData = useMemo(() => {
    return data.filter((job) => {
      // Status filter
      if (filters.status && job.status !== filters.status) return false;

      // Priority filter
      if (filters.priority && job.priority !== filters.priority) return false;

      // PIC filter
      if (filters.pic_id && job.assigned_to !== filters.pic_id) return false;

      // Date range filter
      if (filters.from) {
        const fromDate = startOfDay(parseISO(filters.from));
        if (isBefore(parseISO(job.created_at), fromDate)) return false;
      }
      if (filters.to) {
        const toDate = endOfDay(parseISO(filters.to));
        if (isAfter(parseISO(job.created_at), toDate)) return false;
      }

      // My Assigned filter
      if (filters.mine === 'true' && job.assigned_to !== currentUserId) return false;

      // Search filter (title, display_id)
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesDisplayId = job.display_id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDisplayId) return false;
      }

      return true;
    });
  }, [data, filters, currentUserId]);

  const handleView = (job: JobWithRelations) => {
    router.push(`/jobs/${job.id}`);
  };

  const handleEdit = (job: JobWithRelations) => {
    router.push(`/jobs/${job.id}/edit`);
  };

  const handleCancel = (job: JobWithRelations) => {
    setCancellingJobId(job.id);
    setCancellingDisplayId(job.display_id);
    setCancelOpen(true);
  };

  const handleCancelSuccess = () => {
    setFeedback({ type: 'success', message: 'Job cancelled successfully' });
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <JobFilters users={users} currentUserRole={currentUserRole} />

      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <DataTable
        columns={jobColumns}
        data={filteredData}
        emptyMessage="No jobs found"
        createButton={
          isGaLeadOrAdmin ? (
            <Button asChild size="sm">
              <Link href="/jobs/new">
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Link>
            </Button>
          ) : undefined
        }
        meta={{
          onView: handleView,
          onEdit: handleEdit,
          onCancel: handleCancel,
          currentUserId,
          currentUserRole,
        }}
        pageSize={20}
      />

      <JobCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        jobId={cancellingJobId}
        jobDisplayId={cancellingDisplayId}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
}

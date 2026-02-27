import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import {
  createStyledWorkbook,
  applyStandardStyles,
  generateExcelResponse,
} from '@/lib/exports/excel-helpers';
import { JOB_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants/job-status';

const EXPORT_ROLES = ['ga_lead', 'admin', 'finance_approver'];

export async function GET() {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, company_id, role, deleted_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.deleted_at) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 401 });
    }

    if (!EXPORT_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch ALL jobs with joined FK names (no filter — export everything)
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('*, pic:user_profiles!assigned_to(full_name), created_by_user:user_profiles!created_by(full_name), category:categories(name), location:locations(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Jobs export fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    const { workbook, sheet } = createStyledWorkbook('Jobs', [
      { header: 'ID', key: 'display_id', width: 12 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Category', key: 'category_name', width: 25 },
      { header: 'Location', key: 'location_name', width: 25 },
      { header: 'PIC', key: 'pic_name', width: 25 },
      { header: 'Created By', key: 'created_by_name', width: 25 },
      { header: 'Created At', key: 'created_at', width: 14 },
      { header: 'Updated At', key: 'updated_at', width: 14 },
    ]);

    for (const job of jobs ?? []) {
      const pic = job.pic as { full_name: string } | null;
      const createdByUser = job.created_by_user as { full_name: string } | null;
      const category = job.category as { name: string } | null;
      const location = job.location as { name: string } | null;

      sheet.addRow({
        display_id: job.display_id,
        title: job.title ?? '',
        description: job.description ?? '',
        status: JOB_STATUS_LABELS[job.status] ?? job.status ?? '',
        priority: PRIORITY_LABELS[job.priority] ?? job.priority ?? '',
        category_name: category?.name ?? '',
        location_name: location?.name ?? '',
        pic_name: pic?.full_name ?? '',
        created_by_name: createdByUser?.full_name ?? '',
        created_at: job.created_at
          ? format(new Date(job.created_at), 'dd-MM-yyyy')
          : '',
        updated_at: job.updated_at
          ? format(new Date(job.updated_at), 'dd-MM-yyyy')
          : '',
      });
    }

    applyStandardStyles(sheet);

    const today = format(new Date(), 'dd-MM-yyyy');
    return generateExcelResponse(workbook, `jobs-export-${today}.xlsx`);
  } catch (error) {
    console.error('Jobs export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

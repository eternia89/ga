import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import {
  createStyledWorkbook,
  applyStandardStyles,
  generateExcelResponse,
} from '@/lib/exports/excel-helpers';

const EXPORT_ROLES = ['ga_lead', 'admin'];

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

    // Fetch ALL maintenance schedules (no filter — export everything)
    const { data: schedules, error: fetchError } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Maintenance export fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch maintenance schedules' }, { status: 500 });
    }

    const { workbook, sheet } = createStyledWorkbook('Maintenance', [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Template Name', key: 'template_name', width: 40 },
      { header: 'Asset ID', key: 'asset_id', width: 36 },
      { header: 'Interval Days', key: 'interval_days', width: 14 },
      { header: 'Interval Type', key: 'interval_type', width: 14 },
      { header: 'Is Active', key: 'is_active', width: 10 },
      { header: 'Next Due At', key: 'next_due_at', width: 14 },
      { header: 'Last Completed At', key: 'last_completed_at', width: 18 },
      { header: 'Created At', key: 'created_at', width: 14 },
    ]);

    for (const schedule of schedules ?? []) {
      sheet.addRow({
        id: schedule.id,
        template_name: schedule.template_name ?? '',
        asset_id: schedule.asset_id ?? '',
        interval_days: schedule.interval_days ?? '',
        interval_type: schedule.interval_type ?? '',
        is_active: schedule.is_active ? 'Yes' : 'No',
        next_due_at: schedule.next_due_at
          ? format(new Date(schedule.next_due_at), 'dd-MM-yyyy')
          : '',
        last_completed_at: schedule.last_completed_at
          ? format(new Date(schedule.last_completed_at), 'dd-MM-yyyy')
          : '',
        created_at: schedule.created_at
          ? format(new Date(schedule.created_at), 'dd-MM-yyyy')
          : '',
      });
    }

    applyStandardStyles(sheet);

    const today = format(new Date(), 'dd-MM-yyyy');
    return generateExcelResponse(workbook, `maintenance-export-${today}.xlsx`);
  } catch (error) {
    console.error('Maintenance export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

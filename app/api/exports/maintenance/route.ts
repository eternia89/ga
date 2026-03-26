import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import {
  createStyledWorkbook,
  applyStandardStyles,
  generateExcelResponse,
} from '@/lib/exports/excel-helpers';
import { LEAD_ROLES } from '@/lib/constants/roles';

const EXPORT_ROLES: readonly string[] = LEAD_ROLES;

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

    // Fetch user's extra company access for multi-company scoping
    const { data: companyAccessRows } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', profile.id);
    const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
    const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

    const { data: schedules, error: fetchError } = await supabase
      .from('maintenance_schedules')
      .select('*, asset:inventory_items(display_id, name), template:maintenance_templates(name)')
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Maintenance export fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch maintenance schedules' }, { status: 500 });
    }

    // Capitalize interval type for display
    const capitalizeInterval = (type: string | null) => {
      if (!type) return '';
      return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const { workbook, sheet } = createStyledWorkbook('Maintenance', [
      { header: 'Template Name', key: 'template_name', width: 40 },
      { header: 'Asset', key: 'asset_name', width: 35 },
      { header: 'Interval Days', key: 'interval_days', width: 14 },
      { header: 'Interval Type', key: 'interval_type', width: 14 },
      { header: 'Is Active', key: 'is_active', width: 10 },
      { header: 'Next Due At', key: 'next_due_at', width: 14 },
      { header: 'Last Completed At', key: 'last_completed_at', width: 18 },
      { header: 'Created At', key: 'created_at', width: 14 },
    ]);

    for (const schedule of schedules ?? []) {
      const asset = schedule.asset as { display_id: string; name: string } | null;
      const template = schedule.template as { name: string } | null;

      sheet.addRow({
        template_name: template?.name ?? '',
        asset_name: asset ? `${asset.name} (${asset.display_id})` : '',
        interval_days: schedule.interval_days ?? '',
        interval_type: capitalizeInterval(schedule.interval_type),
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

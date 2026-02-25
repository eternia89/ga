import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import {
  createStyledWorkbook,
  applyStandardStyles,
  generateExcelResponse,
} from '@/lib/exports/excel-helpers';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants/request-status';

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

    // Fetch ALL requests (no filter — export everything)
    const { data: requests, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Requests export fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    const { workbook, sheet } = createStyledWorkbook('Requests', [
      { header: 'ID', key: 'display_id', width: 12 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Location ID', key: 'location_id', width: 36 },
      { header: 'Category ID', key: 'category_id', width: 36 },
      { header: 'Requester ID', key: 'requester_id', width: 36 },
      { header: 'Assigned To', key: 'assigned_to', width: 36 },
      { header: 'Created At', key: 'created_at', width: 14 },
      { header: 'Updated At', key: 'updated_at', width: 14 },
    ]);

    for (const req of requests ?? []) {
      sheet.addRow({
        display_id: req.display_id,
        description: req.description ?? '',
        status: STATUS_LABELS[req.status] ?? req.status,
        priority: PRIORITY_LABELS[req.priority] ?? req.priority ?? '',
        location_id: req.location_id ?? '',
        category_id: req.category_id ?? '',
        requester_id: req.requester_id ?? '',
        assigned_to: req.assigned_to ?? '',
        created_at: req.created_at
          ? format(new Date(req.created_at), 'dd-MM-yyyy')
          : '',
        updated_at: req.updated_at
          ? format(new Date(req.updated_at), 'dd-MM-yyyy')
          : '',
      });
    }

    applyStandardStyles(sheet);

    const today = format(new Date(), 'dd-MM-yyyy');
    return generateExcelResponse(workbook, `requests-export-${today}.xlsx`);
  } catch (error) {
    console.error('Requests export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import {
  createStyledWorkbook,
  applyStandardStyles,
  generateExcelResponse,
} from '@/lib/exports/excel-helpers';

const EXPORT_ROLES = ['ga_staff', 'ga_lead', 'admin'];

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

    // Fetch ALL inventory items (no filter — export everything)
    const { data: items, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Inventory export fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    const { workbook, sheet } = createStyledWorkbook('Inventory', [
      { header: 'ID', key: 'display_id', width: 12 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Category ID', key: 'category_id', width: 36 },
      { header: 'Location ID', key: 'location_id', width: 36 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Warranty Expiry', key: 'warranty_expiry', width: 16 },
      { header: 'Purchase Date', key: 'purchase_date', width: 14 },
      { header: 'Condition', key: 'condition', width: 14 },
      { header: 'Created At', key: 'created_at', width: 14 },
      { header: 'Updated At', key: 'updated_at', width: 14 },
    ]);

    for (const item of items ?? []) {
      sheet.addRow({
        display_id: item.display_id,
        name: item.name ?? '',
        category_id: item.category_id ?? '',
        location_id: item.location_id ?? '',
        status: item.status ?? '',
        warranty_expiry: item.warranty_expiry
          ? format(new Date(item.warranty_expiry), 'dd-MM-yyyy')
          : '',
        purchase_date: item.purchase_date
          ? format(new Date(item.purchase_date), 'dd-MM-yyyy')
          : '',
        condition: item.condition ?? '',
        created_at: item.created_at
          ? format(new Date(item.created_at), 'dd-MM-yyyy')
          : '',
        updated_at: item.updated_at
          ? format(new Date(item.updated_at), 'dd-MM-yyyy')
          : '',
      });
    }

    applyStandardStyles(sheet);

    const today = format(new Date(), 'dd-MM-yyyy');
    return generateExcelResponse(workbook, `inventory-export-${today}.xlsx`);
  } catch (error) {
    console.error('Inventory export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

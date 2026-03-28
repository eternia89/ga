import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import {
  createStyledWorkbook,
  applyStandardStyles,
  generateExcelResponse,
} from '@/lib/exports/excel-helpers';
import { GA_ROLES } from '@/lib/constants/roles';
import { getAccessibleCompanyIds } from '@/lib/auth/company-access';

const EXPORT_ROLES: readonly string[] = GA_ROLES;

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

    // Fetch user's accessible companies (primary + extra via user_company_access)
    const { allAccessibleCompanyIds } = await getAccessibleCompanyIds(supabase, profile.id, profile.company_id);

    const { data: items, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*, category:categories(name), location:locations(name), holder:user_profiles!holder_id(full_name)')
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Inventory export fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    // Human-readable status labels
    const STATUS_DISPLAY: Record<string, string> = {
      active: 'Active',
      under_repair: 'Under Repair',
      broken: 'Broken',
      sold_disposed: 'Sold/Disposed',
    };

    const { workbook, sheet } = createStyledWorkbook('Inventory', [
      { header: 'ID', key: 'display_id', width: 12 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Category', key: 'category_name', width: 25 },
      { header: 'Location', key: 'location_name', width: 25 },
      { header: 'Holder', key: 'holder_name', width: 25 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Warranty Expiry', key: 'warranty_expiry', width: 16 },
      { header: 'Purchase Date', key: 'purchase_date', width: 14 },
      { header: 'Condition', key: 'condition', width: 14 },
      { header: 'Created At', key: 'created_at', width: 14 },
      { header: 'Updated At', key: 'updated_at', width: 14 },
    ]);

    for (const item of items ?? []) {
      const category = item.category as { name: string } | null;
      const location = item.location as { name: string } | null;
      const holder = item.holder as { full_name: string } | null;

      sheet.addRow({
        display_id: item.display_id,
        name: item.name ?? '',
        category_name: category?.name ?? '',
        location_name: location?.name ?? '',
        holder_name: holder?.full_name ?? '',
        status: STATUS_DISPLAY[item.status] ?? item.status ?? '',
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

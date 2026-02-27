import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AssetTable } from '@/components/assets/asset-table';
import { PendingTransfer } from '@/components/assets/asset-columns';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/export-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default async function InventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch all active assets for this company with relations
  const { data: assets } = await supabase
    .from('inventory_items')
    .select('*, category:categories(name), location:locations(name)')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const assetList = assets ?? [];

  // Build pending transfers map: assetId -> PendingTransfer
  let pendingTransfersMap: Record<string, PendingTransfer> = {};

  if (assetList.length > 0) {
    const assetIds = assetList.map((a) => a.id);

    const { data: pendingMovements } = await supabase
      .from('inventory_movements')
      .select('id, item_id, to_location_id, to_location:locations!to_location_id(name), receiver_id')
      .in('item_id', assetIds)
      .eq('status', 'pending')
      .is('deleted_at', null);

    if (pendingMovements) {
      for (const movement of pendingMovements) {
        pendingTransfersMap[movement.item_id] = {
          id: movement.id,
          to_location: Array.isArray(movement.to_location)
            ? movement.to_location[0] ?? null
            : movement.to_location,
          receiver_id: movement.receiver_id,
        };
      }
    }
  }

  // Fetch asset-type categories for filter dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'asset')
    .is('deleted_at', null)
    .order('name');

  // Fetch locations for this company for filter dropdown
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="space-y-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inventory</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all company assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ga_staff', 'ga_lead', 'admin'].includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/inventory" />
          )}
          {['ga_staff', 'ga_lead', 'admin'].includes(profile.role) && (
            <Button asChild size="sm">
              <Link href="/inventory/new">
                <Plus className="mr-2 h-4 w-4" />
                New Asset
              </Link>
            </Button>
          )}
        </div>
      </div>

      <AssetTable
        data={assetList}
        pendingTransfers={pendingTransfersMap}
        categories={categories ?? []}
        locations={locations ?? []}
        currentUserRole={profile.role}
      />
    </div>
  );
}

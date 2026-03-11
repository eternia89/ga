import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsContent } from "./settings-content";
import { Company, Division, Location, Category } from "@/lib/types/database";
import type { UserRow } from "@/components/admin/users/user-columns";
import { SetBreadcrumbs } from "@/lib/breadcrumb-context";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; userid?: string }>;
}) {
  const { tab: initialTab, userid: initialUserId } = await searchParams;
  // Use admin client to bypass RLS — admin needs full visibility across all companies
  // including soft-deleted items (for the deactivated toggle)
  const supabase = createAdminClient();

  const [companiesResult, divisionsResult, locationsResult, categoriesResult, profilesResult, authUsersResult, accessRowsResult] =
    await Promise.all([
      supabase.from("companies").select("*").order("name"),
      supabase
        .from("divisions")
        .select("*, company:companies(name)")
        .order("name"),
      supabase
        .from("locations")
        .select("*, company:companies(name)")
        .order("name"),
      // CRITICAL: Categories are GLOBAL - fetch ALL regardless of company_id
      supabase.from("categories").select("*").order("name"),
      // Users data
      supabase
        .from("user_profiles")
        .select("*, division:divisions(name), company:companies(name), location:locations(name)")
        .order("full_name"),
      supabase.auth.admin.listUsers(),
      // Multi-company access rows
      supabase.from("user_company_access").select("user_id, company_id"),
    ]);

  const companies = (companiesResult.data as Company[]) || [];
  const divisions = (divisionsResult.data as Division[]) || [];
  const locations = (locationsResult.data as Location[]) || [];
  const categories = (categoriesResult.data as Category[]) || [];

  // Merge auth user data into profiles for Users tab
  const authUserMap = new Map(
    (authUsersResult.data?.users ?? []).map(u => [u.id, { last_sign_in_at: u.last_sign_in_at }])
  );
  const users: UserRow[] = (profilesResult.data || []).map(profile => ({
    ...profile,
    last_sign_in_at: authUserMap.get(profile.id)?.last_sign_in_at || null,
  }));

  const adminProfile = profilesResult.data?.find(p => p.role === 'admin');
  const defaultCompanyId = adminProfile?.company_id || companies?.[0]?.id || '';

  // Build userCompanyAccessMap: user_id -> company_id[]
  const userCompanyAccessMap: Record<string, string[]> = {};
  for (const row of accessRowsResult.data ?? []) {
    if (!userCompanyAccessMap[row.user_id]) userCompanyAccessMap[row.user_id] = [];
    userCompanyAccessMap[row.user_id].push(row.company_id);
  }

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]} />

      <SettingsContent
        companies={companies}
        divisions={divisions}
        locations={locations}
        categories={categories}
        users={users}
        defaultCompanyId={defaultCompanyId}
        initialTab={initialTab}
        initialUserId={initialUserId}
        userCompanyAccessMap={userCompanyAccessMap}
      />
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsContent } from "./settings-content";
import { Company, Division, Location, Category } from "@/lib/types/database";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: initialTab } = await searchParams;
  // Use admin client to bypass RLS — admin needs full visibility across all companies
  // including soft-deleted items (for the deactivated toggle)
  const supabase = createAdminClient();

  const [companiesResult, divisionsResult, locationsResult, categoriesResult] =
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
    ]);

  const companies = (companiesResult.data as Company[]) || [];
  const divisions = (divisionsResult.data as Division[]) || [];
  const locations = (locationsResult.data as Location[]) || [];
  const categories = (categoriesResult.data as Category[]) || [];

  return (
    <SettingsContent
      companies={companies}
      divisions={divisions}
      locations={locations}
      categories={categories}
      initialTab={initialTab}
    />
  );
}

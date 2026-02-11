import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "./settings-content";
import { Company, Division, Location, Category } from "@/lib/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();

  // Fetch all data in parallel
  // Note: Including deleted items so admin can see them with the toggle
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
    />
  );
}

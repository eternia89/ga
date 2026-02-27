"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Company, Division, Location, Category } from "@/lib/types/database";
import { CompanyTable } from "@/components/admin/companies/company-table";
import { DivisionTable } from "@/components/admin/divisions/division-table";
import { LocationTable } from "@/components/admin/locations/location-table";
import { CategoryTable } from "@/components/admin/categories/category-table";
import { UserTable } from "@/components/admin/users/user-table";
import type { UserRow } from "@/components/admin/users/user-columns";

interface SettingsContentProps {
  companies: Company[];
  divisions: Division[];
  locations: Location[];
  categories: Category[];
  users: UserRow[];
  defaultCompanyId: string;
  initialTab?: string;
  initialUserId?: string;
}

const VALID_TABS = ["companies", "divisions", "locations", "categories", "users"];

export function SettingsContent({
  companies,
  divisions,
  locations,
  categories,
  users,
  defaultCompanyId,
  initialTab,
  initialUserId,
}: SettingsContentProps) {
  const defaultTab = initialTab && VALID_TABS.includes(initialTab) ? initialTab : "companies";
  const [tab, setTab] = useQueryState("tab", { defaultValue: defaultTab });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization's configuration
        </p>
      </div>

      {/* Main tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="companies" className="space-y-4">
          <CompanyTable data={companies} />
        </TabsContent>

        <TabsContent value="divisions" className="space-y-4">
          <DivisionTable data={divisions} companies={companies} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationTable data={locations} companies={companies} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryTable data={categories} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserTable
            users={users}
            companies={companies}
            divisions={divisions}
            defaultCompanyId={defaultCompanyId}
            initialUserId={initialUserId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

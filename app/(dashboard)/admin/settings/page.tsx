"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "companies" });
  const [categoryType, setCategoryType] = useQueryState("categoryType", {
    defaultValue: "request",
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's configuration
        </p>
      </div>

      {/* Main tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Companies table coming in next plan
            </p>
          </div>
        </TabsContent>

        <TabsContent value="divisions" className="space-y-4">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Divisions table coming in next plan
            </p>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Locations table coming in next plan
            </p>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {/* Category sub-tabs */}
          <Tabs value={categoryType} onValueChange={setCategoryType}>
            <TabsList>
              <TabsTrigger value="request">Request Categories</TabsTrigger>
              <TabsTrigger value="asset">Asset Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">
                  Request Categories table coming in next plan
                </p>
              </div>
            </TabsContent>

            <TabsContent value="asset" className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">
                  Asset Categories table coming in next plan
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

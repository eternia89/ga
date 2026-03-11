"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobModal } from "@/components/jobs/job-modal";
import type { EligibleRequest } from "@/components/jobs/job-form";

interface JobCreateDialogProps {
  locations: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
  eligibleRequests: EligibleRequest[];
  requestJobLinks: Record<string, string>;
  companyBudgetThreshold?: number | null;
  initialOpen?: boolean;
  extraCompanies?: { id: string; name: string }[];
  allLocations?: { id: string; name: string; company_id: string }[];
  primaryCompanyName: string;
}

export function JobCreateDialog({
  locations,
  categories,
  users,
  eligibleRequests,
  requestJobLinks,
  companyBudgetThreshold,
  initialOpen,
  extraCompanies,
  allLocations,
  primaryCompanyName,
}: JobCreateDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(initialOpen ?? false);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("action", "create");
      router.replace(`?${params.toString()}`, { scroll: false });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, {
        scroll: false,
      });
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => handleOpenChange(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Job
      </Button>
      <JobModal
        mode="create"
        open={open}
        onOpenChange={handleOpenChange}
        locations={locations}
        categories={categories}
        users={users}
        eligibleRequests={eligibleRequests}
        requestJobLinks={requestJobLinks}
        companyBudgetThreshold={companyBudgetThreshold}
        extraCompanies={extraCompanies}
        allLocations={allLocations}
        primaryCompanyName={primaryCompanyName}
      />
    </>
  );
}

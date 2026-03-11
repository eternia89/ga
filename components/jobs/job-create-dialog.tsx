"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
}: JobCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen ?? false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Job
      </Button>
      <JobModal
        mode="create"
        open={open}
        onOpenChange={setOpen}
        locations={locations}
        categories={categories}
        users={users}
        eligibleRequests={eligibleRequests}
        requestJobLinks={requestJobLinks}
        companyBudgetThreshold={companyBudgetThreshold}
        extraCompanies={extraCompanies}
        allLocations={allLocations}
      />
    </>
  );
}

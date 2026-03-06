"use client";

import { useState } from "react";
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
}

export function JobCreateDialog({
  locations,
  categories,
  users,
  eligibleRequests,
  requestJobLinks,
}: JobCreateDialogProps) {
  const [open, setOpen] = useState(false);

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
      />
    </>
  );
}

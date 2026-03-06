"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/jobs/job-form";

interface JobCreateDialogProps {
  locations: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
  eligibleRequests: {
    id: string;
    display_id: string;
    title: string;
    priority: string | null;
    status: string;
    location_id: string | null;
    category_id: string | null;
    description: string | null;
  }[];
  requestJobLinks: Record<string, string>;
}

export function JobCreateDialog({
  locations,
  categories,
  users,
  eligibleRequests,
  requestJobLinks,
}: JobCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Job
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <JobForm
            locations={locations}
            categories={categories}
            users={users}
            eligibleRequests={eligibleRequests}
            requestJobLinks={requestJobLinks}
            prefillRequest={null}
            mode="create"
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

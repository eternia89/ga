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
import { ScheduleForm } from "@/components/maintenance/schedule-form";
import type {
  TemplateListItem,
  AssetListItem,
} from "@/components/maintenance/schedule-form";

interface ScheduleCreateDialogProps {
  templates: TemplateListItem[];
  assets: AssetListItem[];
  initialOpen?: boolean;
}

export function ScheduleCreateDialog({
  templates,
  assets,
  initialOpen,
}: ScheduleCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen ?? false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Schedule
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>New Schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            templates={templates}
            assets={assets}
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

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
import { RequestSubmitForm } from "@/components/requests/request-submit-form";

interface Location {
  id: string;
  name: string;
}

interface RequestCreateDialogProps {
  locations: Location[];
}

export function RequestCreateDialog({ locations }: RequestCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Request
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
          </DialogHeader>
          <RequestSubmitForm
            locations={locations}
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

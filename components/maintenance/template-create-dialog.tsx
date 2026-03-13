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
import { TemplateCreateForm } from "@/components/maintenance/template-create-form";

interface TemplateCreateDialogProps {
  categories: { id: string; name: string }[];
  initialOpen?: boolean;
}

export function TemplateCreateDialog({
  categories,
  initialOpen,
}: TemplateCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen ?? false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Template
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <TemplateCreateForm
            categories={categories}
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

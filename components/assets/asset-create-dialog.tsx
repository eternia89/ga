"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AssetSubmitForm } from "@/components/assets/asset-submit-form";

interface AssetCreateDialogProps {
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  initialOpen?: boolean;
  extraCompanies?: { id: string; name: string }[];
  allLocations?: { id: string; name: string; company_id: string }[];
}

export function AssetCreateDialog({
  categories,
  locations,
  initialOpen,
  extraCompanies,
  allLocations,
}: AssetCreateDialogProps) {
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
        New Asset
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>New Asset</DialogTitle>
          </DialogHeader>
          <AssetSubmitForm
            categories={categories}
            locations={locations}
            extraCompanies={extraCompanies}
            allLocations={allLocations}
            onSuccess={() => {
              handleOpenChange(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

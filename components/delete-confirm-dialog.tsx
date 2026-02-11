"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: string;
  onConfirm: () => Promise<void>;
  dependencyCount?: number;
  dependencyLabel?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
  dependencyCount,
  dependencyLabel,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const hasDependencies = dependencyCount !== undefined && dependencyCount > 0;
  const isConfirmValid = confirmText === entityName;

  const handleConfirm = async () => {
    if (!isConfirmValid || hasDependencies) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmText("");
      onOpenChange(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {hasDependencies ? (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                  <p className="text-sm font-medium text-destructive">
                    Cannot delete — {dependencyCount} {dependencyLabel} assigned
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You must reassign or remove all {dependencyLabel} before deleting this {entityType}.
                  </p>
                </div>
              ) : (
                <>
                  <p>
                    This action cannot be undone. This will permanently delete the {entityType}{" "}
                    <span className="font-semibold">{entityName}</span>.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-text" className="text-sm font-medium">
                      Type <span className="font-mono font-semibold">{entityName}</span> to confirm:
                    </Label>
                    <Input
                      id="confirm-text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={entityName}
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={hasDependencies || !isConfirmValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

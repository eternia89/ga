"use client";

import { useState, useMemo } from "react";
import { Location, Company } from "@/lib/types/database";
import { DataTable } from "@/components/data-table/data-table";
import { locationColumns } from "./location-columns";
import { LocationFormDialog } from "./location-form-dialog";
import { DeactivateConfirmDialog } from "@/components/delete-confirm-dialog";
import { InlineFeedback } from "@/components/inline-feedback";
import {
  deactivateLocation,
  reactivateLocation,
  bulkDeactivateLocations,
} from "@/app/actions/location-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { downloadCSV } from "@/lib/utils";

interface LocationTableProps {
  data: Location[];
  companies: Company[];
}

export function LocationTable({ data, companies }: LocationTableProps) {
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter data based on showDeactivated toggle
  const filteredData = useMemo(() => {
    if (showDeactivated) {
      return data;
    }
    return data.filter((location) => !location.deleted_at);
  }, [data, showDeactivated]);

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
  };

  const handleRestore = async () => {
    if (!editingLocation) return;
    try {
      const result = await reactivateLocation({ id: editingLocation.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${editingLocation.name} reactivated successfully`,
        });
        setEditingLocation(null);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to reactivate",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;

    try {
      const result = await deactivateLocation({ id: deletingLocation.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${deletingLocation.name} deactivated successfully`,
        });
        setDeletingLocation(null);
        setEditingLocation(null);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to deactivate",
      });
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      const result = await bulkDeactivateLocations({ ids: selectedIds });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else if (result?.data) {
        const { deleted, blocked, failed } = result.data;
        if (blocked > 0 || failed > 0) {
          const parts = [];
          if (deleted > 0) parts.push(`Deactivated ${deleted}`);
          if (blocked > 0) parts.push(`${blocked} blocked due to dependencies`);
          if (failed > 0) parts.push(`${failed} failed due to errors`);
          setFeedback({ type: "error", message: parts.join(". ") + "." });
        } else {
          setFeedback({
            type: "success",
            message: `${deleted} locations deactivated successfully`,
          });
        }
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to bulk deactivate",
      });
    }
  };

  const handleBulkExport = (selectedIds: string[]) => {
    // Simple CSV export - map IDs to full location objects
    const selectedRows = data.filter((location) =>
      selectedIds.includes(location.id)
    );

    const headers = ["Name", "Address", "Company", "Status"];
    const csvRows = selectedRows.map((location) => [
      location.name,
      location.address || "",
      location.company?.name || "",
      location.deleted_at ? "Deactivated" : "Active",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    downloadCSV(csvContent, 'locations');
  };

  const handleSuccess = () => {
    setFeedback({
      type: "success",
      message: editingLocation
        ? "Location updated successfully"
        : "Location created successfully",
    });
    setEditingLocation(null);
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Locations</h2>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Location
        </Button>
      </div>

      <DataTable
        columns={locationColumns}
        data={filteredData}
        searchKey="name"
        showDeactivatedToggle
        onDeactivatedToggleChange={setShowDeactivated}
        showDeactivated={showDeactivated}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        getRowClassName={(row) => (row.deleted_at ? "bg-muted/40" : "")}
        meta={{
          onEdit: handleEdit,
        }}
      />

      <LocationFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companies={companies}
        onSuccess={handleSuccess}
      />

      <LocationFormDialog
        open={!!editingLocation}
        onOpenChange={(open) => !open && setEditingLocation(null)}
        location={editingLocation || undefined}
        companies={companies}
        onSuccess={handleSuccess}
        onDeactivate={() => setDeletingLocation(editingLocation)}
        onReactivate={handleRestore}
      />

      <DeactivateConfirmDialog
        open={!!deletingLocation}
        onOpenChange={(open) => !open && setDeletingLocation(null)}
        entityName={deletingLocation?.name || ""}
        entityType="location"
        onConfirm={handleConfirmDelete}
        dependencyCount={0}
      />
    </div>
  );
}

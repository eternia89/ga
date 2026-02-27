"use client";

import { useState, useMemo } from "react";
import { Location, Company } from "@/lib/types/database";
import { DataTable } from "@/components/data-table/data-table";
import { locationColumns } from "./location-columns";
import { LocationFormDialog } from "./location-form-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { InlineFeedback } from "@/components/inline-feedback";
import {
  deleteLocation,
  restoreLocation,
  bulkDeleteLocations,
} from "@/app/actions/location-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  const handleDelete = (location: Location) => {
    setDeletingLocation(location);
  };

  const handleRestore = async (location: Location) => {
    try {
      const result = await restoreLocation({ id: location.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${location.name} restored successfully`,
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to restore",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;

    try {
      const result = await deleteLocation({ id: deletingLocation.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${deletingLocation.name} deleted successfully`,
        });
        setDeletingLocation(null);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete",
      });
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      const result = await bulkDeleteLocations({ ids: selectedIds });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else if (result?.data) {
        const { deleted, blocked } = result.data;
        if (blocked > 0) {
          setFeedback({
            type: "error",
            message: `Deleted ${deleted} locations. ${blocked} blocked due to dependencies.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `${deleted} locations deleted successfully`,
          });
        }
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to bulk delete",
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

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
          onRestore: handleRestore,
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
      />

      <DeleteConfirmDialog
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

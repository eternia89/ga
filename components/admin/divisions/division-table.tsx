"use client";

import { useState, useMemo } from "react";
import { Division, Company } from "@/lib/types/database";
import { DataTable } from "@/components/data-table/data-table";
import { divisionColumns } from "./division-columns";
import { DivisionFormDialog } from "./division-form-dialog";
import { DeactivateConfirmDialog } from "@/components/delete-confirm-dialog";
import { InlineFeedback } from "@/components/inline-feedback";
import {
  deactivateDivision,
  reactivateDivision,
  bulkDeactivateDivisions,
} from "@/app/actions/division-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { downloadCSV } from "@/lib/utils";

interface DivisionTableProps {
  data: Division[];
  companies: Company[];
}

export function DivisionTable({ data, companies }: DivisionTableProps) {
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(
    null
  );
  const [deletingDivision, setDeletingDivision] = useState<Division | null>(
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
    return data.filter((division) => !division.deleted_at);
  }, [data, showDeactivated]);

  const handleEdit = (division: Division) => {
    setEditingDivision(division);
  };

  const handleRestore = async () => {
    if (!editingDivision) return;
    try {
      const result = await reactivateDivision({ id: editingDivision.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${editingDivision.name} reactivated successfully`,
        });
        setEditingDivision(null);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to reactivate",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDivision) return;

    try {
      const result = await deactivateDivision({ id: deletingDivision.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${deletingDivision.name} deactivated successfully`,
        });
        setDeletingDivision(null);
        setEditingDivision(null);
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
      const result = await bulkDeactivateDivisions({ ids: selectedIds });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else if (result?.data) {
        const { deleted, blocked } = result.data;
        if (blocked > 0) {
          setFeedback({
            type: "error",
            message: `Deactivated ${deleted} divisions. ${blocked} blocked due to dependencies.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `${deleted} divisions deactivated successfully`,
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
    // Simple CSV export - map IDs to full division objects
    const selectedRows = data.filter((division) => selectedIds.includes(division.id));

    const headers = [
      "Name",
      "Code",
      "Company",
      "Description",
      "Status",
    ];
    const csvRows = selectedRows.map((division) => [
      division.name,
      division.code || "",
      division.company?.name || "",
      division.description || "",
      division.deleted_at ? "Deactivated" : "Active",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    downloadCSV(csvContent, 'divisions');
  };

  const handleSuccess = () => {
    setFeedback({
      type: "success",
      message: editingDivision
        ? "Division updated successfully"
        : "Division created successfully",
    });
    setEditingDivision(null);
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Divisions</h2>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Division
        </Button>
      </div>

      <DataTable
        columns={divisionColumns}
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

      <DivisionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companies={companies}
        onSuccess={handleSuccess}
      />

      <DivisionFormDialog
        open={!!editingDivision}
        onOpenChange={(open) => !open && setEditingDivision(null)}
        division={editingDivision || undefined}
        companies={companies}
        onSuccess={handleSuccess}
        onDeactivate={() => setDeletingDivision(editingDivision)}
        onReactivate={handleRestore}
      />

      <DeactivateConfirmDialog
        open={!!deletingDivision}
        onOpenChange={(open) => !open && setDeletingDivision(null)}
        entityName={deletingDivision?.name || ""}
        entityType="division"
        onConfirm={handleConfirmDelete}
        dependencyCount={0}
      />
    </div>
  );
}

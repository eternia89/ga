"use client";

import { useState, useMemo } from "react";
import { Company } from "@/lib/types/database";
import { DataTable } from "@/components/data-table/data-table";
import { companyColumns } from "./company-columns";
import { CompanyFormDialog } from "./company-form-dialog";
import { DeactivateConfirmDialog } from "@/components/delete-confirm-dialog";
import { InlineFeedback } from "@/components/inline-feedback";
import {
  deleteCompany,
  restoreCompany,
  bulkDeleteCompanies,
} from "@/app/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { downloadCSV } from "@/lib/utils";

interface CompanyTableProps {
  data: Company[];
}

export function CompanyTable({ data }: CompanyTableProps) {
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter data based on showDeactivated toggle
  const filteredData = useMemo(() => {
    if (showDeactivated) {
      return data;
    }
    return data.filter((company) => !company.deleted_at);
  }, [data, showDeactivated]);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
  };

  const handleRestore = async () => {
    if (!editingCompany) return;
    try {
      const result = await restoreCompany({ id: editingCompany.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${editingCompany.name} reactivated successfully`,
        });
        setEditingCompany(null);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to reactivate",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;

    try {
      const result = await deleteCompany({ id: deletingCompany.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${deletingCompany.name} deactivated successfully`,
        });
        setDeletingCompany(null);
        setEditingCompany(null);
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
      const result = await bulkDeleteCompanies({ ids: selectedIds });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else if (result?.data) {
        const { deleted, blocked } = result.data;
        if (blocked > 0) {
          setFeedback({
            type: "error",
            message: `Deactivated ${deleted} companies. ${blocked} blocked due to dependencies.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `${deleted} companies deactivated successfully`,
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
    // Simple CSV export - map IDs to full company objects
    const selectedRows = data.filter((company) => selectedIds.includes(company.id));

    const headers = ["Name", "Code", "Email", "Phone", "Address", "Status"];
    const csvRows = selectedRows.map((company) => [
      company.name,
      company.code || "",
      company.email || "",
      company.phone || "",
      company.address || "",
      company.deleted_at ? "Deactivated" : "Active",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    downloadCSV(csvContent, 'companies');
  };

  const handleSuccess = () => {
    setFeedback({
      type: "success",
      message: editingCompany
        ? "Company updated successfully"
        : "Company created successfully",
    });
    setEditingCompany(null);
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
        <h2 className="text-lg font-semibold">Companies</h2>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </div>

      <DataTable
        columns={companyColumns}
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

      <CompanyFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      <CompanyFormDialog
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
        company={editingCompany || undefined}
        onSuccess={handleSuccess}
        onDeactivate={() => setDeletingCompany(editingCompany)}
        onReactivate={handleRestore}
      />

      <DeactivateConfirmDialog
        open={!!deletingCompany}
        onOpenChange={(open) => !open && setDeletingCompany(null)}
        entityName={deletingCompany?.name || ""}
        entityType="company"
        onConfirm={handleConfirmDelete}
        dependencyCount={0}
      />
    </div>
  );
}

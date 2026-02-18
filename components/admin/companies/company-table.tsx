"use client";

import { useState, useMemo } from "react";
import { Company } from "@/lib/types/database";
import { DataTable } from "@/components/data-table/data-table";
import { companyColumns } from "./company-columns";
import { CompanyFormDialog } from "./company-form-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { InlineFeedback } from "@/components/inline-feedback";
import {
  deleteCompany,
  restoreCompany,
  bulkDeleteCompanies,
} from "@/app/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  const handleDelete = (company: Company) => {
    setDeletingCompany(company);
  };

  const handleRestore = async (company: Company) => {
    try {
      const result = await restoreCompany({ id: company.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${company.name} restored successfully`,
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
    if (!deletingCompany) return;

    try {
      const result = await deleteCompany({ id: deletingCompany.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${deletingCompany.name} deleted successfully`,
        });
        setDeletingCompany(null);
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
      const result = await bulkDeleteCompanies({ ids: selectedIds });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else if (result?.data) {
        const { deleted, blocked } = result.data;
        if (blocked > 0) {
          setFeedback({
            type: "error",
            message: `Deleted ${deleted} companies. ${blocked} blocked due to dependencies.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `${deleted} companies deleted successfully`,
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

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

      <DataTable
        columns={companyColumns}
        data={filteredData}
        searchKey="name"
        showDeactivatedToggle
        onDeactivatedToggleChange={setShowDeactivated}
        showDeactivated={showDeactivated}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        createButton={
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Company
          </Button>
        }
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
          onRestore: handleRestore,
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
      />

      <DeleteConfirmDialog
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

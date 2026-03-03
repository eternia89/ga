"use client";

import { useState } from "react";
import { Category } from "@/lib/types/database";
import { DataTable } from "@/components/data-table/data-table";
import { categoryColumns } from "./category-columns";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeactivateConfirmDialog } from "@/components/delete-confirm-dialog";
import { InlineFeedback } from "@/components/inline-feedback";
import {
  deleteCategory,
  restoreCategory,
  bulkDeleteCategories,
} from "@/app/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CategoryTableProps {
  data: Category[];
  categoryType: "request" | "asset";
}

export function CategoryTable({ data, categoryType }: CategoryTableProps) {
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter by deactivated status only (type filtering handled by parent sub-tabs)
  const filteredData = showDeactivated
    ? data
    : data.filter((cat) => !cat.deleted_at);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  const handleRestore = async (category: Category) => {
    try {
      const result = await restoreCategory({ id: category.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${category.name} reactivated successfully`,
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to reactivate",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      const result = await deleteCategory({ id: deletingCategory.id });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else {
        setFeedback({
          type: "success",
          message: `${deletingCategory.name} deactivated successfully`,
        });
        setDeletingCategory(null);
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
      const result = await bulkDeleteCategories({ ids: selectedIds });
      if (result?.serverError) {
        setFeedback({ type: "error", message: result.serverError });
      } else if (result?.data) {
        const { deleted, blocked } = result.data;
        if (blocked > 0) {
          setFeedback({
            type: "error",
            message: `Deactivated ${deleted} categories. ${blocked} blocked due to dependencies.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `${deleted} categories deactivated successfully`,
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
    const selectedRows = data.filter((category) =>
      selectedIds.includes(category.id)
    );

    const headers = ["Name", "Description", "Status"];
    const csvRows = selectedRows.map((category) => [
      category.name,
      category.description || "",
      category.deleted_at ? "Deactivated" : "Active",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSuccess = () => {
    setFeedback({
      type: "success",
      message: editingCategory
        ? "Category updated successfully"
        : "Category created successfully",
    });
    setEditingCategory(null);
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {categoryType === "request" ? "Request Categories" : "Asset Categories"}
        </h2>
        <Button onClick={handleCreateClick} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </div>

      <DataTable
        columns={categoryColumns}
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

      <CategoryFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultType={categoryType}
        onSuccess={handleSuccess}
      />

      <CategoryFormDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory || undefined}
        defaultType={categoryType}
        onSuccess={handleSuccess}
      />

      <DeactivateConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        entityName={deletingCategory?.name || ""}
        entityType="category"
        onConfirm={handleConfirmDelete}
        dependencyCount={0}
      />
    </div>
  );
}

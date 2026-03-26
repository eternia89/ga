/**
 * Shared response types for all server actions.
 *
 * Actions return flat objects: { success: true, ...extraFields }.
 * next-safe-action wraps the return in { data?, serverError? },
 * so the client accesses result?.data?.success, result?.data?.fieldName.
 * We keep returns FLAT (no nested data property) to avoid double-nesting.
 */

/** Base response type — all successful action returns include { success: true }. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ActionResponse<T extends Record<string, unknown> = {}> =
  { success: true } & T;

/** Shorthand for actions that only return { success: true } */
export type ActionOk = { success: true };

/** Bulk deactivate actions — return count of deactivated, blocked, and failed items */
export type BulkDeactivateResponse = ActionResponse<{
  deleted: number;
  blocked: number;
  failed: number;
}>;

/** Photo fetch actions — return signed photo URLs (asset photos/invoices) */
export type PhotosResponse = ActionResponse<{
  photos: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    url: string;
    created_at: string;
  }>;
}>;

/** Invoice fetch actions — return signed invoice URLs */
export type InvoicesResponse = ActionResponse<{
  invoices: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    url: string;
    created_at: string;
  }>;
}>;

/** Photo/attachment deletion actions */
export type DeleteAttachmentsResponse = ActionResponse<{
  deleted: number;
}>;

/** PM checklist save — return completed/total counts */
export type ChecklistProgressResponse = ActionResponse<{
  completedCount: number;
  totalCount: number;
}>;

/** PM checklist complete — return completed count */
export type ChecklistCompleteResponse = ActionResponse<{
  completedCount: number;
}>;

/** Schedule advance — return whether it advanced and next due date */
export type AdvanceScheduleResponse = ActionResponse<{
  advanced: boolean;
  nextDueAt?: string;
}>;

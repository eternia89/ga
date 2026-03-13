// ============================================================================
// Maintenance TypeScript Types
// Phase 7: Preventive Maintenance
// ============================================================================

// ============================================================================
// Checklist Item — Discriminated Union (6 types)
// Stored as JSONB array in maintenance_templates.checklist
// ============================================================================

export type ChecklistItemBase = {
  id: string;          // UUID for stable identity during reordering
  label: string;       // Display label (e.g., "Check oil level")
  sort_order: number;  // Position in list (0-based)
};

export type CheckboxItem = ChecklistItemBase & { type: 'checkbox' };
export type PassFailItem = ChecklistItemBase & { type: 'pass_fail' };
export type NumericItem = ChecklistItemBase & { type: 'numeric' };
export type TextItem = ChecklistItemBase & { type: 'text' };
export type PhotoItem = ChecklistItemBase & { type: 'photo' };
export type DropdownItem = ChecklistItemBase & { type: 'dropdown'; options: string[] };

export type ChecklistItem =
  | CheckboxItem
  | PassFailItem
  | NumericItem
  | TextItem
  | PhotoItem
  | DropdownItem;

export type ChecklistItemType = ChecklistItem['type'];

// ============================================================================
// Checklist Response — PM job completion data
// Stored as JSONB on jobs.checklist_responses (snapshot of template + responses)
// Ensures completed PM jobs are immune to template edits (Pitfall 1 mitigation)
// ============================================================================

export type ChecklistResponse = {
  item_id: string;                              // References ChecklistItem.id
  type: ChecklistItemType;
  label: string;                                // Snapshot of label at time of generation
  value: boolean | 'pass' | 'fail' | number | string | string[] | null;
  photo_urls?: string[];                        // For photo-type items
  completed_at?: string;                        // ISO timestamp when this item was filled
};

export type PMJobChecklist = {
  template_name: string;         // Snapshot of template name at time of PM job generation
  template_id: string;           // Reference to source template (for audit)
  items: ChecklistResponse[];
  checklist_completed_at?: string; // ISO timestamp when all items were completed
};

// ============================================================================
// MaintenanceTemplate — joined type for server action returns
// ============================================================================

export type MaintenanceTemplate = {
  id: string;
  company_id: string | null;
  category_id: string | null;
  name: string;
  description: string | null;
  checklist: ChecklistItem[];
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined relations
  category?: {
    name: string;
    type: string;
  } | null;
  // Computed field: checklist item count
  item_count?: number;
};

// ============================================================================
// MaintenanceSchedule — joined type for server action returns
// ============================================================================

export type MaintenanceSchedule = {
  id: string;
  company_id: string;
  item_id: string | null;
  template_id: string;
  assigned_to: string | null;
  interval_days: number;
  interval_type: 'fixed' | 'floating';
  auto_create_days_before: number;
  last_completed_at: string | null;
  next_due_at: string | null;
  is_paused: boolean;
  paused_at: string | null;
  paused_reason: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined relations
  template?: {
    name: string;
    checklist: ChecklistItem[];
  } | null;
  asset?: {
    name: string;
    display_id: string;
  } | null;
  category?: {
    name: string;
  } | null;
};

// ============================================================================
// ScheduleDisplayStatus — derived from is_active, is_paused, paused_reason
// 4 distinct states for GA Lead visibility (Pattern 2 from RESEARCH.md)
// ============================================================================

export type ScheduleDisplayStatus = 'active' | 'paused_auto' | 'paused_manual' | 'deactivated';

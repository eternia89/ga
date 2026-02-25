// Database entity types
export interface Company {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export interface Location {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: "request" | "asset";
  description: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Request = {
  id: string;
  company_id: string;
  division_id: string;
  location_id: string | null;
  category_id: string | null;
  requester_id: string;
  assigned_to: string | null;
  display_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  status: 'submitted' | 'triaged' | 'in_progress' | 'pending_approval' | 'approved' | 'completed' | 'pending_acceptance' | 'accepted' | 'closed' | 'rejected' | 'cancelled';
  estimated_cost: number | null;
  actual_cost: number | null;
  requires_approval: boolean;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  completed_at: string | null;
  accepted_at: string | null;
  auto_accepted: boolean;
  feedback_rating: number | null;
  feedback_comment: string | null;
  acceptance_rejected_reason: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

// Request with joined relations (for list and detail views)
export type RequestWithRelations = Request & {
  location: { name: string } | null;
  category: { name: string } | null;
  requester: { name: string; email: string } | null;
  assigned_user: { name: string; email: string } | null;
  division: { name: string } | null;
};

export type MediaAttachment = {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  description: string | null;
  sort_order: number;
  uploaded_by: string | null;
  deleted_at: string | null;
  created_at: string;
};

export interface Job {
  id: string;
  company_id: string;
  display_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  location_id: string | null;
  category_id: string | null;
  assigned_to: string | null;
  created_by: string;
  estimated_cost: number | null;
  request_id: string | null; // Legacy single FK, kept for PM jobs
  job_type: 'standard' | 'preventive_maintenance' | null;
  maintenance_schedule_id: string | null;
  checklist_responses: import('@/lib/types/maintenance').PMJobChecklist | null;
  approval_submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approval_rejected_at: string | null;
  approval_rejected_by: string | null;
  approval_rejection_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobWithRelations extends Job {
  location?: { name: string } | null;
  category?: { name: string } | null;
  pic?: { full_name: string } | null;
  created_by_user?: { full_name: string } | null;
  job_requests?: Array<{
    request: {
      id: string;
      display_id: string;
      title: string;
      status: string;
      requester?: { full_name: string } | null;
    };
  }>;
  maintenance_schedule?: {
    id: string;
    next_due_at: string | null;
    interval_type: 'fixed' | 'floating';
    interval_days: number;
  } | null;
}

export interface JobComment {
  id: string;
  job_id: string;
  user_id: string;
  content: string;
  photo_url: string | null;
  deleted_at: string | null;
  created_at: string;
  user?: { full_name: string } | null;
}

export interface CompanySetting {
  id: string;
  company_id: string;
  key: string;
  value: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Inventory types
// ============================================================================

export type AssetStatus = 'active' | 'under_repair' | 'broken' | 'sold_disposed';
export type MovementStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface InventoryItem {
  id: string;
  company_id: string;
  location_id: string | null;
  category_id: string | null;
  display_id: string;
  name: string;
  description: string | null;
  status: AssetStatus;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  acquisition_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemWithRelations extends InventoryItem {
  category: { name: string } | null;
  location: { name: string } | null;
  company: { name: string } | null;
}

export interface InventoryMovement {
  id: string;
  company_id: string;
  item_id: string;
  from_location_id: string | null;
  to_location_id: string;
  initiated_by: string;
  receiver_id: string | null;
  received_by: string | null;
  status: MovementStatus;
  notes: string | null;
  received_at: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovementWithRelations extends InventoryMovement {
  from_location: { name: string } | null;
  to_location: { name: string } | null;
  initiator: { full_name: string } | null;
  receiver: { full_name: string } | null;
}

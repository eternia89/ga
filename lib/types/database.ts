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
  status: 'submitted' | 'triaged' | 'in_progress' | 'completed' | 'accepted' | 'rejected' | 'cancelled';
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

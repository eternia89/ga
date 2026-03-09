// Role type matching DB CHECK constraint exactly
export type Role = 'general_user' | 'ga_staff' | 'ga_lead' | 'finance_approver' | 'admin';

// UserProfile type matching user_profiles table schema from 00001_initial_schema.sql
export type UserProfile = {
  id: string;
  company_id: string;
  division_id: string | null;
  location_id: string | null;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  notification_preferences: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

// Permission string type - defined here to avoid circular imports
export type Permission =
  // User management (Phase 3)
  | 'user:view'
  | 'user:create'
  | 'user:edit'
  | 'user:deactivate'
  // Company/Division/Location/Category management (Phase 3)
  | 'company:manage'
  | 'division:manage'
  | 'location:manage'
  | 'category:manage'
  // Request management (Phase 4)
  | 'request:view:all'
  | 'request:create'
  | 'request:edit:own'
  | 'request:triage'
  // Job management (Phase 5)
  | 'job:view:all'
  | 'job:create'
  | 'job:assign'
  | 'job:update_status'
  | 'job:comment'
  // Approval (Phase 5)
  | 'approval:view'
  | 'approval:decide'
  // Inventory (Phase 6)
  | 'inventory:view:all'
  | 'inventory:manage'
  | 'inventory:transfer'
  // Maintenance (Phase 7)
  | 'maintenance:view:all'
  | 'maintenance:manage'
  // Dashboard (Phase 8)
  | 'dashboard:view'
  | 'dashboard:export'
  // Admin (Phase 3+)
  | 'admin:panel'
  | 'audit:view';

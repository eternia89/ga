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

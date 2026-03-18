# GA Operations — Consolidated Database Schema

> Generated from `supabase/migrations/00001` through `00029`.
> Shows **final state** after all migrations are applied.

---

## 1. Table Definitions

### 1.1 `companies`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| name | text | NO | | |
| code | text | YES | | UNIQUE |
| address | text | YES | | |
| phone | text | YES | | |
| email | text | YES | | |
| logo_url | text | YES | | |
| is_active | boolean | YES | `true` | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.2 `divisions`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| name | text | NO | | |
| code | text | YES | | |
| description | text | YES | | |
| is_active | boolean | YES | `true` | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

**Table constraint:** `divisions_company_name_unique` UNIQUE (company_id, name) DEFERRABLE INITIALLY DEFERRED

---

### 1.3 `locations`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| name | text | NO | | |
| address | text | YES | | |
| latitude | double precision | YES | | |
| longitude | double precision | YES | | |
| is_active | boolean | YES | `true` | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

**Table constraint:** `locations_company_name_unique` UNIQUE (company_id, name) DEFERRABLE INITIALLY DEFERRED

---

### 1.4 `categories`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| name | text | NO | | |
| type | text | NO | | CHECK (type IN ('request', 'asset')) |
| description | text | YES | | |
| is_active | boolean | YES | `true` | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

**Table constraint:** `categories_company_name_type_unique` UNIQUE (company_id, name, type) DEFERRABLE INITIALLY DEFERRED

---

### 1.5 `user_profiles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | | PK, FK -> auth.users(id) |
| company_id | uuid | NO | | FK -> companies(id) |
| division_id | uuid | YES | | FK -> divisions(id) |
| location_id | uuid | YES | | FK -> locations(id) ON DELETE SET NULL *(added 00017)* |
| email | text | NO | | |
| full_name | text | NO | | |
| avatar_url | text | YES | | |
| phone | text | YES | | |
| role | text | NO | `'general_user'` | CHECK (role IN ('general_user', 'ga_staff', 'ga_lead', 'finance_approver', 'admin')) |
| is_active | boolean | YES | `true` | |
| notification_preferences | jsonb | YES | `'{}'` | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.6 `user_company_access` *(added 00018)*

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| user_id | uuid | NO | | FK -> user_profiles(id) ON DELETE CASCADE |
| company_id | uuid | NO | | FK -> companies(id) ON DELETE CASCADE |
| granted_by | uuid | YES | | FK -> user_profiles(id) |
| granted_at | timestamptz | NO | `now()` | |

**Table constraint:** UNIQUE (user_id, company_id)

---

### 1.7 `id_counters`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| entity_type | text | NO | | |
| prefix | text | NO | | |
| current_value | bigint | NO | `0` | |
| reset_period | text | YES | | CHECK (reset_period IN ('never', 'yearly', 'monthly')) |
| last_reset_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

**Table constraint:** UNIQUE (company_id, entity_type)

---

### 1.8 `requests`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| division_id | uuid | NO | | FK -> divisions(id) |
| location_id | uuid | YES | | FK -> locations(id) |
| category_id | uuid | YES | | FK -> categories(id) |
| requester_id | uuid | NO | | FK -> user_profiles(id) |
| assigned_to | uuid | YES | | FK -> user_profiles(id) |
| display_id | text | NO | | UNIQUE *(globally unique, restored 00015)* |
| title | text | NO | | |
| description | text | YES | | |
| priority | text | YES | | CHECK (priority IN ('low', 'medium', 'high', 'urgent')) |
| status | text | NO | `'submitted'` | CHECK (status IN ('submitted', 'triaged', 'in_progress', 'pending_approval', 'approved', 'rejected', 'completed', 'pending_acceptance', 'accepted', 'closed', 'cancelled')) |
| estimated_cost | bigint | YES | | |
| actual_cost | bigint | YES | | |
| requires_approval | boolean | YES | `false` | |
| approved_at | timestamptz | YES | | |
| approved_by | uuid | YES | | FK -> user_profiles(id) |
| rejected_at | timestamptz | YES | | |
| rejected_by | uuid | YES | | FK -> user_profiles(id) |
| rejection_reason | text | YES | | |
| completed_at | timestamptz | YES | | |
| accepted_at | timestamptz | YES | | |
| auto_accepted | boolean | YES | `false` | |
| feedback_rating | smallint | YES | | |
| feedback_comment | text | YES | | |
| acceptance_rejected_reason | text | YES | | *(added 00008)* |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

> Note: `feedback_rating`, `feedback_comment`, `accepted_at`, `auto_accepted`, `completed_at` were originally in CREATE TABLE (00001) and also appear in ALTER TABLE (00008) with `IF NOT EXISTS`; the final schema has one of each.

---

### 1.9 `jobs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| location_id | uuid | YES | | FK -> locations(id) |
| category_id | uuid | YES | | FK -> categories(id) *(added 00012)* |
| display_id | text | NO | | UNIQUE *(globally unique, restored 00015)* |
| title | text | NO | | |
| description | text | YES | | |
| status | text | NO | `'created'` | CHECK (status IN ('created', 'assigned', 'in_progress', 'pending_approval', 'pending_completion_approval', 'completed', 'cancelled')) *(final from 00013)* |
| priority | text | YES | | CHECK (priority IN ('low', 'medium', 'high', 'urgent')) |
| job_type | text | YES | `'standalone'` | CHECK (job_type IN ('request_linked', 'standalone', 'preventive_maintenance')) |
| assigned_to | uuid | YES | | FK -> user_profiles(id) |
| created_by | uuid | NO | | FK -> user_profiles(id) |
| request_id | uuid | YES | | FK -> requests(id) |
| maintenance_schedule_id | uuid | YES | | FK -> maintenance_schedules(id) |
| estimated_cost | bigint | YES | | |
| actual_cost | bigint | YES | | |
| started_at | timestamptz | YES | | |
| completed_at | timestamptz | YES | | |
| checklist_responses | jsonb | YES | `NULL` | *(added 00010)* |
| approval_submitted_at | timestamptz | YES | | *(added 00008)* |
| approved_at | timestamptz | YES | | *(added 00008)* |
| approved_by | uuid | YES | | FK -> user_profiles(id) *(added 00008)* |
| approval_rejected_at | timestamptz | YES | | *(added 00008)* |
| approval_rejected_by | uuid | YES | | FK -> user_profiles(id) *(added 00008)* |
| approval_rejection_reason | text | YES | | *(added 00008)* |
| completion_submitted_at | timestamptz | YES | | *(added 00013)* |
| completion_approved_at | timestamptz | YES | | *(added 00013)* |
| completion_approved_by | uuid | YES | | FK -> user_profiles(id) *(added 00013)* |
| completion_rejected_at | timestamptz | YES | | *(added 00013)* |
| completion_rejected_by | uuid | YES | | FK -> user_profiles(id) *(added 00013)* |
| completion_rejection_reason | text | YES | | *(added 00013)* |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.10 `job_comments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| job_id | uuid | NO | | FK -> jobs(id) |
| user_id | uuid | NO | | FK -> user_profiles(id) |
| company_id | uuid | NO | | FK -> companies(id) |
| content | text | NO | | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.11 `job_requests` *(added 00008)*

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| job_id | uuid | NO | | FK -> jobs(id) |
| request_id | uuid | NO | | FK -> requests(id) |
| company_id | uuid | NO | | FK -> companies(id) |
| linked_at | timestamptz | YES | `now()` | |
| linked_by | uuid | YES | | FK -> user_profiles(id) |

**Table constraint:** UNIQUE (job_id, request_id)

---

### 1.12 `job_status_changes` *(added 00011)*

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| job_id | uuid | NO | | FK -> jobs(id) |
| company_id | uuid | NO | | FK -> companies(id) |
| from_status | text | NO | | |
| to_status | text | NO | | |
| changed_by | uuid | NO | | FK -> user_profiles(id) |
| latitude | double precision | YES | | |
| longitude | double precision | YES | | |
| gps_accuracy | double precision | YES | | |
| created_at | timestamptz | NO | `now()` | |

> Immutable audit table -- no UPDATE or DELETE policies. No `deleted_at` or `updated_at`.

---

### 1.13 `inventory_items`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| location_id | uuid | YES | | FK -> locations(id) |
| category_id | uuid | YES | | FK -> categories(id) |
| display_id | text | NO | | UNIQUE *(globally unique, restored 00015)* |
| name | text | NO | | |
| description | text | YES | | |
| status | text | NO | `'active'` | CHECK (status IN ('active', 'under_repair', 'broken', 'sold_disposed')) *(updated 00009)* |
| condition | text | YES | | CHECK (condition IN ('excellent', 'good', 'fair', 'poor')) |
| brand | text | YES | | *(added 00009)* |
| model | text | YES | | *(added 00009)* |
| serial_number | text | YES | | *(added 00009)* |
| acquisition_date | date | YES | | *(added 00009)* |
| purchase_date | date | YES | | |
| purchase_price | bigint | YES | | |
| warranty_expiry | date | YES | | |
| invoice_url | text | YES | | |
| notes | text | YES | | |
| holder_id | uuid | YES | | FK -> user_profiles(id) *(added 00028)* |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.14 `inventory_movements`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| item_id | uuid | NO | | FK -> inventory_items(id) |
| from_location_id | uuid | YES | | FK -> locations(id) |
| to_location_id | uuid | NO | | FK -> locations(id) |
| initiated_by | uuid | NO | | FK -> user_profiles(id) |
| received_by | uuid | YES | | FK -> user_profiles(id) |
| receiver_id | uuid | YES | | FK -> user_profiles(id) *(added 00009)* |
| status | text | NO | `'pending'` | CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) *(updated 00009)* |
| notes | text | YES | | |
| rejection_reason | text | YES | | *(added 00009)* |
| rejected_at | timestamptz | YES | | *(added 00009)* |
| cancelled_at | timestamptz | YES | | *(added 00009)* |
| received_at | timestamptz | YES | | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.15 `maintenance_templates`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | **YES** | | FK -> companies(id) *(made nullable 00023 -- templates are global/shared)* |
| category_id | uuid | YES | | FK -> categories(id) |
| name | text | NO | | |
| description | text | YES | | |
| checklist | jsonb | NO | `'[]'` | |
| is_active | boolean | YES | `true` | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

> Templates are shared globally (company_id is NULL for all rows per 00023). Any ga_lead or admin can create/update.

---

### 1.16 `maintenance_schedules`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| item_id | uuid | **YES** | | FK -> inventory_items(id) *(made nullable 00024)* |
| template_id | uuid | NO | | FK -> maintenance_templates(id) |
| assigned_to | uuid | YES | | FK -> user_profiles(id) |
| interval_days | integer | NO | | |
| interval_type | text | NO | `'floating'` | CHECK (interval_type IN ('fixed', 'floating')) |
| last_completed_at | timestamptz | YES | | |
| next_due_at | timestamptz | YES | | |
| is_paused | boolean | YES | `false` | |
| paused_at | timestamptz | YES | | |
| paused_reason | text | YES | | |
| is_active | boolean | YES | `true` | *(added 00010)* |
| auto_create_days_before | integer | NO | `0` | *(added 00025)* |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

---

### 1.17 `company_settings` *(added 00008)*

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| key | text | NO | | |
| value | text | NO | | |
| updated_by | uuid | YES | | FK -> user_profiles(id) |
| created_at | timestamptz | YES | `now()` | |
| updated_at | timestamptz | YES | `now()` | |

**Table constraint:** UNIQUE (company_id, key)

---

### 1.18 `notifications`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| user_id | uuid | NO | | FK -> user_profiles(id) |
| title | text | NO | | |
| body | text | YES | | |
| type | text | NO | | |
| entity_type | text | YES | | |
| entity_id | uuid | YES | | |
| is_read | boolean | YES | `false` | |
| read_at | timestamptz | YES | | |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |

> No `updated_at` column.

---

### 1.19 `audit_logs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | YES | | |
| table_name | text | NO | | |
| record_id | uuid | NO | | |
| operation | text | NO | | CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRANSITION')) |
| old_data | jsonb | YES | | |
| new_data | jsonb | YES | | |
| changed_fields | text[] | YES | | |
| user_id | uuid | YES | | |
| user_email | text | YES | | |
| ip_address | text | YES | | |
| performed_at | timestamptz | YES | `now()` | |

> Immutable table -- no `deleted_at`, no `updated_at`. No FKs. Writes via SECURITY DEFINER trigger only.

---

### 1.20 `media_attachments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| company_id | uuid | NO | | FK -> companies(id) |
| entity_type | text | NO | | |
| entity_id | uuid | NO | | |
| file_name | text | NO | | |
| file_path | text | NO | | |
| file_size | integer | YES | | |
| mime_type | text | YES | | |
| alt_text | text | YES | | |
| description | text | YES | | |
| sort_order | integer | YES | `0` | |
| uploaded_by | uuid | YES | | FK -> user_profiles(id) |
| deleted_at | timestamptz | YES | | |
| created_at | timestamptz | YES | `now()` | |

> Polymorphic attachment table. No `updated_at` column.

---

## 2. RLS Policies

All tables have RLS enabled. Below shows the **final active** policy for each table after all DROP/CREATE cycles.

### 2.1 `companies`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `companies_select_policy` | SELECT | `(id = current_user_company_id() OR EXISTS (SELECT 1 FROM user_company_access WHERE user_id = auth.uid() AND company_id = companies.id)) AND deleted_at IS NULL` |
| `companies_insert_admin` | INSERT | WITH CHECK: `id = current_user_company_id() AND current_user_role() = 'admin'` |
| `companies_update_admin` | UPDATE | USING: `id = current_user_company_id() AND current_user_role() = 'admin'` / WITH CHECK: `id = current_user_company_id()` |

### 2.2 `divisions`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `divisions_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `divisions_insert_admin` | INSERT | WITH CHECK: `company_id = current_user_company_id() AND current_user_role() = 'admin'` |
| `divisions_update_admin` | UPDATE | USING: `company_id = current_user_company_id() AND current_user_role() = 'admin'` / WITH CHECK: `company_id = current_user_company_id()` |

### 2.3 `locations`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `locations_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `locations_insert_admin` | INSERT | WITH CHECK: `company_id = current_user_company_id() AND current_user_role() = 'admin'` |
| `locations_update_admin` | UPDATE | USING: `company_id = current_user_company_id() AND current_user_role() = 'admin'` / WITH CHECK: `company_id = current_user_company_id()` |

### 2.4 `categories`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `categories_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `categories_insert_admin` | INSERT | WITH CHECK: `company_id = current_user_company_id() AND current_user_role() = 'admin'` |
| `categories_update_admin` | UPDATE | USING: `company_id = current_user_company_id() AND current_user_role() = 'admin'` / WITH CHECK: `company_id = current_user_company_id()` |

### 2.5 `user_profiles`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `user_profiles_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `user_profiles_select_self` | SELECT | `id = auth.uid()` *(allows seeing own profile even when deactivated)* |
| `user_profiles_insert_admin` | INSERT | WITH CHECK: `company_id = current_user_company_id() AND current_user_role() = 'admin'` |
| `user_profiles_update_role_aware` | UPDATE | USING: `company_id = current_user_company_id() AND (id = auth.uid() OR current_user_role() = 'admin')` / WITH CHECK: `company_id = current_user_company_id()` |

### 2.6 `user_company_access`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `user_company_access_select_own` | SELECT | `user_id = auth.uid()` |
| `user_company_access_select_admin` | SELECT | `current_user_role() = 'admin'` |

> No INSERT/UPDATE/DELETE policies -- all writes via service role client.

### 2.7 `id_counters`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `id_counters_select` | SELECT | `company_id = current_user_company_id()` |
| `id_counters_update` | UPDATE | USING + WITH CHECK: `company_id = current_user_company_id()` |

### 2.8 `requests`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `requests_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `requests_insert_multi_company` | INSERT | WITH CHECK: `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND (current_user_role() != 'general_user' OR division_id = current_user_division_id())` |
| `requests_update_multi_company` | UPDATE | USING: `(company_id = current_user_company_id() OR EXISTS (...)) AND (current_user_role() != 'general_user' OR requester_id = auth.uid())` / WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...)` |

### 2.9 `jobs`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `jobs_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `jobs_insert_multi_company` | INSERT | WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |
| `jobs_update_multi_company` | UPDATE | USING + WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |

### 2.10 `job_comments`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `job_comments_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `job_comments_select_own_company` | SELECT | `EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_comments.job_id AND jobs.company_id = current_user_company_id() AND jobs.deleted_at IS NULL)` *(created in 00008 via DO block, may coexist)* |
| `job_comments_insert_multi_company` | INSERT | WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |
| `job_comments_update` | UPDATE | USING + WITH CHECK: `company_id = current_user_company_id()` *(from 00003, never dropped)* |

### 2.11 `job_requests`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `job_requests_select_multi_company` | SELECT | `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |
| `job_requests_insert_multi_company` | INSERT | WITH CHECK: `(company_id = current_user_company_id() OR EXISTS (...)) AND current_user_role() IN ('ga_lead', 'admin', 'ga_staff')` |
| `job_requests_delete_lead_admin` | DELETE | USING: `company_id = current_user_company_id() AND current_user_role() IN ('ga_lead', 'admin')` |

### 2.12 `job_status_changes`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `job_status_changes_select_multi_company` | SELECT | `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |
| `job_status_changes_insert_multi_company` | INSERT | WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |

> No UPDATE/DELETE policies -- immutable audit records.

### 2.13 `inventory_items`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `inventory_items_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `inventory_items_insert_multi_company` | INSERT | WITH CHECK: `(company_id = current_user_company_id() OR EXISTS (...)) AND current_user_role() IN ('ga_staff', 'ga_lead', 'admin')` |
| `inventory_items_update_multi_company` | UPDATE | USING: `(company_id = current_user_company_id() OR EXISTS (...)) AND current_user_role() IN ('ga_staff', 'ga_lead', 'admin')` |

### 2.14 `inventory_movements`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `inventory_movements_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `inventory_movements_insert_multi_company` | INSERT | WITH CHECK: `(company_id = current_user_company_id() OR EXISTS (...)) AND current_user_role() IN ('ga_staff', 'ga_lead', 'admin')` |
| `inventory_movements_update_multi_company` | UPDATE | USING: `(company_id = current_user_company_id() OR EXISTS (...)) AND (initiated_by = auth.uid() OR receiver_id = auth.uid() OR current_user_role() IN ('ga_lead', 'admin'))` |

### 2.15 `maintenance_templates`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `maintenance_templates_select_global` | SELECT | `deleted_at IS NULL` *(no company check -- global/shared)* |
| `maintenance_templates_insert_role` | INSERT | WITH CHECK: `current_user_role() IN ('ga_lead', 'admin')` |
| `maintenance_templates_update_role` | UPDATE | USING + WITH CHECK: `current_user_role() IN ('ga_lead', 'admin')` |

### 2.16 `maintenance_schedules`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `maintenance_schedules_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `maintenance_schedules_insert_ga_lead` | INSERT | WITH CHECK: `company_id = current_user_company_id() AND current_user_role() IN ('ga_lead', 'admin')` |
| `maintenance_schedules_update_ga_lead` | UPDATE | USING: `company_id = current_user_company_id() AND current_user_role() IN ('ga_lead', 'admin')` / WITH CHECK: `company_id = current_user_company_id()` |

### 2.17 `company_settings`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `company_settings_select_multi_company` | SELECT | `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |
| `company_settings_insert_multi_company` | INSERT | WITH CHECK: `(company_id = current_user_company_id() OR EXISTS (...)) AND current_user_role() = 'admin'` |
| `company_settings_update_multi_company` | UPDATE | USING: `(company_id = current_user_company_id() OR EXISTS (...)) AND current_user_role() = 'admin'` |

### 2.18 `notifications`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `notifications_select` | SELECT | `user_id = auth.uid() AND deleted_at IS NULL` |
| `notifications_update` | UPDATE | USING + WITH CHECK: `user_id = auth.uid()` |

> INSERT done via service_role (server-side). No INSERT policy for authenticated users.

### 2.19 `media_attachments`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `media_attachments_select_policy` | SELECT | `(company_id = current_user_company_id() OR EXISTS (...user_company_access...)) AND deleted_at IS NULL` |
| `media_attachments_insert_multi_company` | INSERT | WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |
| `media_attachments_update_multi_company` | UPDATE | USING + WITH CHECK: `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |

### 2.20 `audit_logs`

| Policy | Operation | Expression |
|--------|-----------|------------|
| `audit_logs_select_policy` | SELECT | `company_id = current_user_company_id() OR EXISTS (...user_company_access...)` |

> No INSERT/UPDATE/DELETE policies -- writes via SECURITY DEFINER trigger. No `deleted_at` filter (immutable table).

### 2.21 Storage RLS (on `storage.objects`)

| Policy | Operation | Bucket | Expression |
|--------|-----------|--------|------------|
| `auth_users_upload_request_photos` | INSERT | `request-photos` | `bucket_id = 'request-photos'` |
| `auth_users_read_request_photos` | SELECT | `request-photos` | `bucket_id = 'request-photos'` |
| `auth_users_upload_job_photos` | INSERT | `job-photos` | `bucket_id = 'job-photos'` |
| `auth_users_read_job_photos` | SELECT | `job-photos` | `bucket_id = 'job-photos'` |
| `auth_users_upload_asset_photos` | INSERT | `asset-photos` | `bucket_id = 'asset-photos'` |
| `auth_users_read_asset_photos` | SELECT | `asset-photos` | `bucket_id = 'asset-photos'` |
| `auth_users_upload_asset_invoices` | INSERT | `asset-invoices` | `bucket_id = 'asset-invoices'` |
| `auth_users_read_asset_invoices` | SELECT | `asset-invoices` | `bucket_id = 'asset-invoices'` |

---

## 3. Indexes

### Unique Indexes (partial)

| Index | Table | Columns | WHERE |
|-------|-------|---------|-------|
| `divisions_company_name_unique_active` | divisions | (company_id, name) | `deleted_at IS NULL` |
| `locations_company_name_unique_active` | locations | (company_id, name) | `deleted_at IS NULL` |
| `categories_company_lower_name_type_unique_active` | categories | (company_id, lower(name), type) | `deleted_at IS NULL` *(replaced case-sensitive version in 00022)* |
| `idx_one_pending_movement` | inventory_movements | (item_id) | `status = 'pending' AND deleted_at IS NULL` *(one pending transfer per asset)* |
| `idx_jobs_schedule_open_unique` | jobs | (maintenance_schedule_id) | `deleted_at IS NULL AND status NOT IN ('completed', 'cancelled') AND maintenance_schedule_id IS NOT NULL` *(PM job deduplication)* |

### Regular Indexes

| Index | Table | Columns | WHERE |
|-------|-------|---------|-------|
| `idx_companies_is_active` | companies | (is_active) | `deleted_at IS NULL` |
| `idx_divisions_company` | divisions | (company_id) | `deleted_at IS NULL` |
| `idx_locations_company` | locations | (company_id) | `deleted_at IS NULL` |
| `idx_categories_company_type` | categories | (company_id, type) | `deleted_at IS NULL` |
| `idx_user_profiles_company` | user_profiles | (company_id) | `deleted_at IS NULL` |
| `idx_user_profiles_company_role` | user_profiles | (company_id, role) | `deleted_at IS NULL` |
| `idx_user_profiles_company_division` | user_profiles | (company_id, division_id) | `deleted_at IS NULL` |
| `idx_user_profiles_location_id` | user_profiles | (location_id) | `deleted_at IS NULL` |
| `idx_requests_company_status` | requests | (company_id, status, created_at DESC) | `deleted_at IS NULL` |
| `idx_requests_company_priority` | requests | (company_id, priority) | `deleted_at IS NULL` |
| `idx_requests_requester` | requests | (requester_id) | `deleted_at IS NULL` |
| `idx_requests_assigned` | requests | (assigned_to) | `deleted_at IS NULL` |
| `idx_requests_division` | requests | (company_id, division_id) | `deleted_at IS NULL` |
| `idx_jobs_company_status` | jobs | (company_id, status, created_at DESC) | `deleted_at IS NULL` |
| `idx_jobs_assigned` | jobs | (assigned_to) | `deleted_at IS NULL` |
| `idx_jobs_request` | jobs | (request_id) | `deleted_at IS NULL` |
| `idx_jobs_schedule` | jobs | (maintenance_schedule_id) | `deleted_at IS NULL` |
| `idx_jobs_company_category` | jobs | (company_id, category_id) | `deleted_at IS NULL` |
| `idx_jobs_pm_type` | jobs | (job_type, status) | `deleted_at IS NULL AND job_type = 'preventive_maintenance'` |
| `idx_job_comments_job` | job_comments | (job_id) | `deleted_at IS NULL` |
| `idx_job_requests_job` | job_requests | (job_id) | -- |
| `idx_job_requests_request` | job_requests | (request_id) | -- |
| `idx_job_requests_company` | job_requests | (company_id) | -- |
| `idx_job_status_changes_job_id` | job_status_changes | (job_id) | -- |
| `idx_job_status_changes_company` | job_status_changes | (company_id) | -- |
| `idx_inventory_company_status` | inventory_items | (company_id, status) | `deleted_at IS NULL` |
| `idx_inventory_company_location` | inventory_items | (company_id, location_id) | `deleted_at IS NULL` |
| `idx_inventory_company_category` | inventory_items | (company_id, category_id) | `deleted_at IS NULL` |
| `idx_movements_item` | inventory_movements | (item_id) | `deleted_at IS NULL` |
| `idx_movements_company` | inventory_movements | (company_id, status) | `deleted_at IS NULL` |
| `idx_schedules_company` | maintenance_schedules | (company_id) | `deleted_at IS NULL` |
| `idx_schedules_item` | maintenance_schedules | (item_id) | `deleted_at IS NULL` |
| `idx_schedules_due` | maintenance_schedules | (next_due_at) | `deleted_at IS NULL AND is_paused = false` |
| `idx_company_settings_company` | company_settings | (company_id) | -- |
| `idx_notifications_user_unread` | notifications | (user_id, is_read, created_at DESC) | `deleted_at IS NULL` |
| `idx_notifications_company` | notifications | (company_id) | `deleted_at IS NULL` |
| `idx_audit_logs_table_record` | audit_logs | (table_name, record_id) | -- |
| `idx_audit_logs_company` | audit_logs | (company_id, performed_at DESC) | -- |
| `idx_audit_logs_user` | audit_logs | (user_id, performed_at DESC) | -- |
| `idx_media_entity` | media_attachments | (entity_type, entity_id) | `deleted_at IS NULL` |
| `idx_media_company` | media_attachments | (company_id) | `deleted_at IS NULL` |

---

## 4. Functions

### 4.1 RLS Helper Functions

| Function | Returns | Language | Notes |
|----------|---------|----------|-------|
| `current_user_company_id()` | uuid | SQL (STABLE, SECURITY DEFINER) | Extracts `company_id` from JWT `app_metadata`. Falls back to `00000000-0000-4000-a000-000000000000`. |
| `current_user_division_id()` | uuid | SQL (STABLE, SECURITY DEFINER) | Extracts `division_id` from JWT `app_metadata`. Returns NULL if absent. |
| `current_user_role()` | text | SQL (STABLE, SECURITY DEFINER) | Extracts `role` from JWT `app_metadata`. Falls back to `'general_user'`. |

### 4.2 Display ID Generators

All three use the same pattern: look up 2-char company code, increment `id_counters` row, return `{prefix}{company_code}-{YY}-{base36_suffix}`. SECURITY DEFINER, `search_path = public`.

| Function | Format | Example |
|----------|--------|---------|
| `generate_request_display_id(p_company_id uuid)` | `R{CC}-{YY}-{XXX}` | `RJK-26-001` |
| `generate_job_display_id(p_company_id uuid)` | `J{CC}-{YY}-{XXX}` | `JJK-26-002` |
| `generate_asset_display_id(p_company_id uuid)` | `I{CC}-{YY}-{XXX}` | `IJK-26-003` |

Counter suffix uses **base-36** (0-9, A-Z) via `to_base36()`, supporting up to 46,656 IDs per year per company per entity type.

### 4.3 Legacy Display ID Generator

| Function | Returns | Notes |
|----------|---------|-------|
| `generate_display_id(p_company_id uuid, p_entity_type text, p_prefix text)` | text | Original generic function. Format: `{prefix}-{YYYY}-{0001}`. Still exists but superseded by entity-specific functions for requests/jobs/assets. Still called by `generate_pm_jobs()` in 00024/00025 versions. |

### 4.4 Utility Functions

| Function | Returns | Notes |
|----------|---------|-------|
| `to_base36(p_value bigint, p_width int DEFAULT 3)` | text | IMMUTABLE. Converts integer to zero-padded base-36 string (0-9, A-Z charset). |
| `set_updated_at()` | trigger | Sets `NEW.updated_at = now()` on UPDATE. Attached to all tables with `updated_at`. |

### 4.5 Audit Functions

| Function | Returns | Notes |
|----------|---------|-------|
| `audit_trigger()` | trigger | SECURITY DEFINER. Generic audit logger -- captures INSERT/UPDATE/DELETE into `audit_logs`. Reads `company_id` from the row. |
| `audit_trigger_companies()` | trigger | SECURITY DEFINER. Special variant for `companies` table where `company_id` = `id` (the row itself is the company). |

### 4.6 Scheduled / Cron Functions

| Function | Returns | Notes |
|----------|---------|-------|
| `auto_accept_completed_requests()` | void | SECURITY DEFINER. Auto-accepts requests in `pending_acceptance` status where `completed_at` is > 7 days ago. Intended for daily cron at 01:00 UTC. |
| `generate_pm_jobs()` | void | SECURITY DEFINER. Creates PM jobs for due maintenance schedules. Handles: deduplication, fixed/floating interval types, checklist snapshot, `auto_create_days_before` advance creation. Intended for daily cron at 00:05 UTC. Uses `LEFT JOIN inventory_items` (item_id is nullable). |

---

## 5. Triggers

### 5.1 `set_updated_at` Triggers

Attached to all tables that have an `updated_at` column. Fires `BEFORE UPDATE` on each row.

| Trigger | Table |
|---------|-------|
| `set_updated_at_companies` | companies |
| `set_updated_at_divisions` | divisions |
| `set_updated_at_locations` | locations |
| `set_updated_at_categories` | categories |
| `set_updated_at_user_profiles` | user_profiles |
| `set_updated_at_id_counters` | id_counters |
| `set_updated_at_requests` | requests |
| `set_updated_at_jobs` | jobs |
| `set_updated_at_job_comments` | job_comments |
| `set_updated_at_inventory_items` | inventory_items |
| `set_updated_at_inventory_movements` | inventory_movements |
| `set_updated_at_maintenance_templates` | maintenance_templates |
| `set_updated_at_maintenance_schedules` | maintenance_schedules |
| `set_company_settings_updated_at` | company_settings |

### 5.2 Audit Triggers

Fires `AFTER INSERT OR UPDATE OR DELETE` on each row.

| Trigger | Table | Function |
|---------|-------|----------|
| `companies_audit` | companies | `audit_trigger_companies()` |
| `divisions_audit` | divisions | `audit_trigger()` |
| `locations_audit` | locations | `audit_trigger()` |
| `categories_audit` | categories | `audit_trigger()` |
| `user_profiles_audit` | user_profiles | `audit_trigger()` |
| `requests_audit` | requests | `audit_trigger()` |
| `jobs_audit` | jobs | `audit_trigger()` |
| `job_comments_audit` | job_comments | `audit_trigger()` |
| `inventory_items_audit` | inventory_items | `audit_trigger()` |
| `inventory_movements_audit` | inventory_movements | `audit_trigger()` |
| `maintenance_templates_audit` | maintenance_templates | `audit_trigger()` |
| `maintenance_schedules_audit` | maintenance_schedules | `audit_trigger()` |
| `notifications_audit` | notifications | `audit_trigger()` |
| `media_attachments_audit` | media_attachments | `audit_trigger()` |

> Tables WITHOUT audit triggers: `audit_logs` (would cause infinite recursion), `id_counters` (utility table), `job_requests`, `job_status_changes`, `company_settings`, `user_company_access`.

---

## 6. Storage Buckets

| Bucket ID | Public | Size Limit | Allowed MIME Types |
|-----------|--------|------------|-------------------|
| `request-photos` | false | 5 MB | image/jpeg, image/png, image/webp |
| `job-photos` | false | 5 MB | image/jpeg, image/png, image/webp |
| `asset-photos` | false | 5 MB | image/jpeg, image/png, image/webp |
| `asset-invoices` | false | 10 MB | image/jpeg, image/png, image/webp, application/pdf |

---

## 7. Enum Reference (CHECK Constraints)

| Table.Column | Allowed Values |
|--------------|----------------|
| categories.type | `'request'`, `'asset'` |
| user_profiles.role | `'general_user'`, `'ga_staff'`, `'ga_lead'`, `'finance_approver'`, `'admin'` |
| requests.status | `'submitted'`, `'triaged'`, `'in_progress'`, `'pending_approval'`, `'approved'`, `'rejected'`, `'completed'`, `'pending_acceptance'`, `'accepted'`, `'closed'`, `'cancelled'` |
| requests.priority | `'low'`, `'medium'`, `'high'`, `'urgent'` |
| jobs.status | `'created'`, `'assigned'`, `'in_progress'`, `'pending_approval'`, `'pending_completion_approval'`, `'completed'`, `'cancelled'` |
| jobs.priority | `'low'`, `'medium'`, `'high'`, `'urgent'` |
| jobs.job_type | `'request_linked'`, `'standalone'`, `'preventive_maintenance'` |
| inventory_items.status | `'active'`, `'under_repair'`, `'broken'`, `'sold_disposed'` |
| inventory_items.condition | `'excellent'`, `'good'`, `'fair'`, `'poor'` |
| inventory_movements.status | `'pending'`, `'accepted'`, `'rejected'`, `'cancelled'` |
| maintenance_schedules.interval_type | `'fixed'`, `'floating'` |
| id_counters.reset_period | `'never'`, `'yearly'`, `'monthly'` |
| audit_logs.operation | `'INSERT'`, `'UPDATE'`, `'DELETE'`, `'TRANSITION'` |

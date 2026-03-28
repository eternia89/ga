# Attendance System — PRD Appendix
## Clarified Decisions & Detailed Specifications

---

## 1. GA App Integration

### Schema Extensions

**`user_profiles` — new columns:**
| Column | Type | Nullable | Notes |
|---|---|---|---|
| `employee_id` | text | YES | Unique per company (WHERE deleted_at IS NULL) |
| `level_id` | uuid | **NO** | FK → `levels(id)` |
| `employment_type` | text | YES | full_time / daily_worker / contract |
| `join_date` | date | YES | |
| `last_working_date` | date | YES | |
| `attendance_role` | text | YES | employee / supervisor / hr_staff / company_admin / account_owner |
| `policy_override_id` | uuid | YES | FK → `attendance_policies(id)` |

**`user_profiles` — existing changes:**
- `division_id`: make **NOT NULL**
- `location_id`: make **NOT NULL** (location can be type `remote`)

**`user_company_access`**: add `can_write boolean DEFAULT false`.

**`locations` — new columns:**
| Column | Type | Default | Notes |
|---|---|---|---|
| `type` | text | 'physical' | 'physical' or 'remote' |
| `gps_latitude` | decimal | NULL | Required for physical, NULL for remote |
| `gps_longitude` | decimal | NULL | Required for physical, NULL for remote |
| `geofence_radius` | integer | 200 | Meters. Ignored for remote. |

### New Tables

**`levels`** — global: id, name, sort_order, deleted_at, timestamps.

**`attendance_groups`** — physical: id, company_id, division_id, level_id, deleted_at, timestamps. Unique: `(company_id, division_id, level_id) WHERE deleted_at IS NULL`.

**`qr_devices`** — per-location credentials:
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `location_id` | uuid | FK → `locations(id)` |
| `device_name` | text | e.g., "kedoya-gate-1" |
| `username` | text | Login credential |
| `password_hash` | text | Hashed |
| `seed` | text | For QR token generation |
| `is_active` | boolean | Admin can disable |
| `last_login_at` | timestamptz | Track daily re-login |
| `deleted_at` / `created_at` / `updated_at` | timestamptz | |

### Dual Roles
`role` (GA) + `attendance_role` (attendance). Independent. `account_owner` can also hold `company_admin`.

### `raw_app_meta_data` Sync
```json
{ "role": "...", "company_id": "...", "division_id": "...", "level_id": "...", "attendance_role": "..." }
```

### JWT Mismatch → Auto-Logout
On every attendance action, compare JWT vs `user_profiles`. Mismatch → auto-logout + redirect to login page + message: "Your profile has been updated. Please log in again to continue."

### RLS Helpers
`current_user_level_id()`, `current_user_attendance_role()`.

### Safe-Action Clients
`attendanceAuthClient`, `attendanceSupervisorClient`, `attendanceHrClient`, `attendanceAdminClient`.

### AI Code Quality
Phase 1 deliverables:
- `CLAUDE.md` — invariants, dual-write rules, checklist for every task
- `ARCHITECTURE.md` — data flows, modules, tables, auth flows
- Both updated after every phase. Claude Code reads CLAUDE.md automatically.

---

## 2. QR Gate Device

### Per-Location Credentials
- Admin generates username + password per location in location settings
- Stored in `qr_devices` table, not `user_profiles`
- Generic login page: enter credentials → validate → redirect to QR display
- QR display shows: rotating QR code + location name + logout link
- Admin can reset credentials anytime
- Daily re-login by security staff

### Token Model
Seed-based, 15s rotation, 30s grace. QR encodes `{device_id}|{token}|{generated_timestamp}`. Single-use per employee. 2-min offline queue.

### Camera Choice
Employee chooses front or back camera via flip toggle during QR scan step. No forced camera switching.

---

## 3. Approval Engine

### Three Separate Checklists
Each attendance group has three independent approval configurations:

| Type | Checklist | Deadline |
|---|---|---|
| Leave | ☐ Supervisor ☐ Manager ☐ HR | None (HR manages process) |
| Overtime | ☐ Supervisor ☐ Manager ☐ HR | `ot_correction_deadline_days` |
| Correction | ☐ Supervisor ☐ Manager ☐ HR | `ot_correction_deadline_days` |

### Rules
- All checked roles must approve (any order)
- 0 roles = auto-approved (warned at setup)
- Self-approval: own step auto-approved, continues
- Scope: same division as employee
- Fallback: inactive → role → auto-skip

### OT Request = No Verification
OT request is just a form submission. No geofencing, no QR, no selfie. Verification happens at check-out time.

---

## 4. Repeatable Pattern — 4-Week Grid

28-day template. Each day gets a shift field (or empty = day off). One shift per day. Repeats monthly.

### Grid UI
| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Week 1 | Normal | Normal | Normal | Normal | Normal | — | — |
| Week 2 | Normal | Normal | Normal | Normal | Normal | — | — |
| Week 3 | Night | Night | Night | Night | — | — | Night |
| Week 4 | Night | Night | Night | Night | — | — | Night |

Supports: weekly (all 4 weeks identical), biweekly (weeks 1-2 differ from 3-4), complex rotations.

### Generation
2 months ahead from today. Weekly cron extends. Today forward only.

---

## 5. Custom Roster — Employee × Date Grid

### Grid UI
Rows = employees (from attendance group). Columns = dates.

| | Mar 1 | Mar 2 | Mar 3 | Mar 4 | Mar 5 |
|---|---|---|---|---|---|
| Adi | Morning | Morning | Night | Night | — |
| Budi | Night | Night | Morning | Morning | — |
| Rina | Morning | — | Morning | Morning | Morning |

HR drops shift templates into cells. Empty = day off.

### Cross-Midnight Visual
Shifts spanning midnight show as blocks across two date columns (like Google Calendar events). Graveyard 22:00–06:00 on Mar 3 starts in the Mar 3 column and extends into Mar 4.

### Holiday Greying
If a holiday touches a shift on either start or end date, the entire shift block is greyed. A Graveyard starting Jan 4 22:00 ending Jan 5 06:00 is greyed if Jan 5 is a holiday. A Graveyard starting Jan 5 22:00 ending Jan 6 06:00 is also greyed because it starts on the holiday.

---

## 6. Leave — Client-Side Validation

### Date Picker Behavior
1. Employee picks start date
2. End date picker dynamically disables dates beyond remaining balance (accounting for rest day exclusions within the range)
3. Rest days within range are colored gray — visually blocked but auto-excluded from count
4. Observed holidays within range are colored purple — auto-excluded from count
5. Before submit, recap: "March 10–17 (8 calendar days). Rest days skipped: Mar 15, 16. Leave days used: 6"
6. Server re-validates everything on submission

### Rest Day and Holiday Exclusion
Leave deduction counts working days only. If a date range passes through rest days or observed holidays, those days are automatically excluded from the leave balance deduction. The recap clearly shows which days are used and which are skipped.

---

## 7. Notifications

### Channels
| Channel | Infrastructure | Used For |
|---|---|---|
| Browser push | GA app (existing) | Time-sensitive: reminders, approval needed |
| Email | New (independent) | Records: approved, rejected, confirmations |

### Reminder Schedule
- 15 min before shift start: push — "Your shift starts in 15 minutes"
- 15 min after shift end: push — "Don't forget to check out"
- Fixed timing. Not configurable.

### Events
| Event | Push | Email |
|---|---|---|
| Check-in reminder | ✓ | — |
| Check-out reminder | ✓ | — |
| New request pending | ✓ | ✓ |
| Request approved (each step) | ✓ | ✓ |
| Request fully completed | — | ✓ |
| Request rejected | ✓ | ✓ |
| Late arrival (to supervisor) | ✓ | — |
| Missing check-out (to supervisor) | ✓ | — |

---

## 8. Export

### Free-Range Date Filter
No payroll cutoff setting. HR picks any start date and end date. No configuration in admin. Period is whatever HR selects.

### Employee Profile Links
Employee ID or name cells contain clickable hyperlinks to the employee's profile page in the app: `https://app.example.com/employees/{id}`. HR clicks to cross-check without navigating the app separately.

### Sheet 1: Daily Records (34 columns)
| # | Column | Type |
|---|---|---|
| 1 | `employee_id` | String (hyperlinked) |
| 2 | `employee_name` | String |
| 3 | `division` | String (current) |
| 4 | `level` | String (current) |
| 5 | `location` | String |
| 6 | `employment_type` | String |
| 7 | `join_date` | Date |
| 8 | `last_working_date` | Date |
| 9 | `total_working_months` | Integer |
| 10 | `date` | Date (shift end) |
| 11 | `shift_id` | String |
| 12 | `shift_name` | String |
| 13 | `scheduled_start` | Datetime |
| 14 | `scheduled_end` | Datetime |
| 15 | `actual_check_in` | Datetime |
| 16 | `actual_check_out` | Datetime |
| 17 | `check_in_location` | String |
| 18 | `check_out_location` | String |
| 19 | `status` | Enum |
| 20 | `is_public_holiday` | Boolean |
| 21 | `is_company_holiday` | Boolean |
| 22 | `late_minutes` | Integer |
| 23 | `early_out_minutes` | Integer |
| 24 | `ot_requested` | Boolean |
| 25 | `ot_approved_hours` | Decimal |
| 26 | `ot_actual_hours` | Decimal |
| 27 | `leave_type` | String |
| 28 | `leave_is_paid` | Boolean |
| 29 | `correction_applied` | Boolean |
| 30 | `correction_id` | String |
| 31 | `manual_edit` | Boolean |
| 32 | `manual_edit_by` | String |
| 33 | `manual_edit_reason` | String |
| 34 | `notes` | String |

### Sheet 2: Period Summary (26 columns)
Same as previous version. Leave counts reflect working days only (rest days/holidays excluded).

---

## 9. Permalinks

Every view encodes state in URL:
- `/dashboard?company=X&division=Y&shift=Z`
- `/roster?group=X&month=2026-03`
- `/attendance/history?employee=X&month=2026-03`
- `/export?from=2026-03-01&to=2026-03-31`

Bookmarkable, shareable, linkable from Excel export.

---

## 10. Permission Pre-Prompting

Employee homepage shows a banner if required permissions (camera, location) aren't granted:

> "Your attendance policy requires camera and location access. Enable them now to avoid delays at check-in."
> [Enable Permissions]

Banner disappears once permissions granted. Prevents first-time check-in delays that hold up the line.

---

## 11. Selfie Retake

Before submission: "Retake" button available alongside "Continue." Employee can retake as many times as they want.
After submission: final. No going back. Stored as audit proof.

---

## 12. Company Dropdown (Multi-Company HR)

- Single-company access: dropdown **disabled** (grayed), shows company name
- Multi-company access: dropdown **enabled**, selecting a different company auto-refreshes all dashboard data

---

## Summary of All Decisions (64)

| # | Topic | Decision |
|---|---|---|
| 1 | QR flow | Tablet displays, phone scans |
| 2 | Camera switching | Flip toggle — employee chooses front or back |
| 3 | Offline queue | Screen-active only |
| 4 | JWT mismatch | Auto-logout + redirect + message |
| 5 | Division + level | NOT NULL |
| 6 | Location | NOT NULL. Type: physical or remote. |
| 7 | Geofencing UX | Maps + retry |
| 8 | Geofencing scope | Both check-in AND check-out |
| 9 | Zero approval | Admin warned |
| 10 | Leave + roster | Any date (MVP) |
| 11 | Leave on rest day | Blocked (grayed in picker) |
| 12 | Leave on holiday | Warn, don't deduct |
| 13 | Leave excludes rest days | Auto-excluded from count, recap shown |
| 14 | Leave deadline | None. HR manages process. |
| 15 | Division visibility | Real-time, shift hours |
| 16 | Roster horizon | 2 months, today forward |
| 17 | Partial leave | Deferred |
| 18 | OT date | User=start, recap=end |
| 19 | Correction form | Structured, pre-filled |
| 20 | Dashboard scope | Division = org unit |
| 21 | Roster trigger | On creation + holiday |
| 22 | Platform split | Employee=mobile, admin=desktop |
| 23 | OT export | actual_check_out + recorded_ot_hours |
| 24 | QR device session | Daily re-login |
| 25 | Approval model | All checked roles must approve |
| 26 | Approval granularity | 3 separate checklists (leave/OT/correction) |
| 27 | Self-approval | Own step auto-approved, continues |
| 28 | One in/out per shift | No re-entry |
| 29 | No group policy | Company defaults pre-filled |
| 30 | Supervisor scope | One division (MVP) |
| 31 | Gate failure | HR corrects retroactively |
| 32 | Approver scope | Same division |
| 33 | Absent marking | End of shift job |
| 34 | Export data | Current state |
| 35 | Pattern shifts/day | One |
| 36 | Account owner | Can be company_admin |
| 37 | Setup wizard | Guided, explicit defaults, reuses existing pages |
| 38 | Deactivation: requests | HR reviews |
| 39 | Deactivation: roster | Auto-removed |
| 40 | Deactivation: approver | Auto-skipped |
| 41 | Year boundary | Jan 1 reset, cross-year split |
| 42 | Carry-over | Deferred Phase 2 |
| 43 | Roster policy timing | Current policy (retroactive) |
| 44 | QR device login | Per-location credentials |
| 45 | Group policy display | Pre-filled with company defaults |
| 46 | AI code quality | CLAUDE.md + ARCHITECTURE.md |
| 47 | Selfie retake | Allowed before submit, final after |
| 48 | QR camera | Flip toggle, employee chooses |
| 49 | Permission pre-prompt | Homepage banner |
| 50 | Client-side validation | Validate client-first, server confirms |
| 51 | Company dropdown | Disabled single, enabled + auto-refresh multi |
| 52 | Status colors | Shared design tokens |
| 53 | Notifications | Browser push + email |
| 54 | Reminders | 15 min before start + 15 min after end |
| 55 | Export filter | Free range, no cutoff setting |
| 56 | Export links | Hyperlink to employee profile |
| 57 | OT = no verification | Just a form. Check-out validates. |
| 58 | Permalinks | Every view has bookmarkable URL |
| 59 | Repeatable pattern | 4-week grid, repeats monthly |
| 60 | Custom roster grid | Rows=employees, cols=dates |
| 61 | Holiday greying | Cross-midnight aware, spans 2 columns |
| 62 | Existing divisions page | Reused in wizard |
| 63 | Phase 1 schema import | Upload migrations at conversation start |
| 64 | Cross-midnight | Shift end date. Holiday greys if touches either end. |
| — | GA integration | Extend tables |
| — | Dual roles | GA + attendance |
| — | Levels | Global |
| — | Attendance group | Physical table |
| — | Multi-company write | can_write |
| — | Policy inheritance | Company → Group → Employee |
| — | Verification layers | 3 toggles |
| — | Shift templates | Dedicated page |
| — | Roster models | Repeatable OR custom |
| — | No-overlap | Back-to-back OK |
| — | Roster editing | Before: HR+Sup. After: HR+reason. |
| — | Holidays | Public + company, two toggles |
| — | Leave types | Statutory + custom |
| — | Data retention | 2 years |
| — | Tech stack | Next.js, Tailwind, Supabase |

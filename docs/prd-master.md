# Shift & Attendance System — Master PRD

## Product Summary
An online attendance and shift management module built within an existing GA application. Employees check in and check out via mobile web according to their assigned shifts. Designed for organizations with 24/7 operations, multiple locations, and configurable policies per attendance group. Produces a payroll recap Excel export (attendance data only — no payroll calculation).

**Not a full HRIS.** Handles attendance, shifts, leave, and overtime tracking. Payroll, benefits, tax, and BPJS calculations are out of scope.

---

## Design Philosophy

### Progressive Enhancement
The base experience is simple — tap and check in. Verification layers appear transparently based on policy. The employee never configures anything. If their rules change, the system auto-logs them out and redirects to login with a message explaining why.

### Client-First Validation
Validate on the client before hitting the server. Date pickers disable invalid dates. Balance checks run in real-time. The server always re-validates, but the employee should never submit something that will be rejected.

### Platform Split
- **Employee pages**: mobile-first
- **Admin/HR pages**: desktop only

### Permalinks
Every view has a bookmarkable URL encoding the current state (filters, date range, selected company/division). Enables direct linking from exports and bookmarking by power users.

### Status Colors (shared design tokens)
| Status | Color | Used Everywhere |
|---|---|---|
| Present (on time) | Green | Calendar, table, dashboard, roster, export legend |
| Late | Amber | Calendar, table, dashboard |
| Absent | Red | Calendar, table, dashboard |
| Leave | Blue | Calendar, table, dashboard, roster |
| Rest day | Gray | Calendar, date picker, roster |
| Holiday | Purple | Calendar, date picker, roster |
| Corrected | Badge overlay | Calendar, table |

Defined once as constants. Used consistently across the entire app.

---

## Key Concept: Attendance Group

A physical database entity: **Division × Level**. Primary unit for all policy configuration.

- **Division**: company-scoped organizational unit (Warehouse, Finance)
- **Level**: global (Staff, Supervisor, Manager — shared across companies)
- Both **mandatory** (`NOT NULL` in schema)
- When an admin opens a group's policy page, **every field is pre-filled with company defaults** (shown as inherited/grayed). The admin only changes what they want to override. An attendance group never has "no policy" — it always has at least the company defaults.

---

## Key Concept: Policy Inheritance (3-Level Cascade)

```
Company Policy (base defaults — always exists)
  └── Attendance Group Policy (pre-filled with company defaults, admin overrides selectively)
        └── Per-Employee Policy (individual overrides)
```

Single-screen UI with inherited/overridden indicators. Desktop only.

---

## Verification Layers

Three independent toggles at any policy level. Any combination.

| Layer | When ON | When OFF |
|---|---|---|
| **Geofencing** | Hard block if outside location radius. Both check-in AND check-out. Maps link + retry. | GPS still captured for audit. |
| **Selfie** | Must take selfie. Retake allowed before submit, final once submitted. Uses GA app compression. | No selfie step. |
| **Dynamic QR** | Must scan gate tablet QR. Employee chooses front or back camera (flip toggle). | No QR step. |

**Check-in order**: Geofencing check → Selfie → QR scan → Submit
**Check-out**: Same verification steps.

### Device Permissions
- Only requested when the policy requires them
- **Homepage banner** shown if required permissions not yet granted: "Your policy requires camera/location access. Enable now to avoid delays at check-in." [Enable Permissions]
- First-time setup before they're standing at the gate with a line behind them
- During check-in, if permission missing: fallback button + how-to modal. Flow blocked.

### JWT Staleness
On every attendance action, server compares JWT vs `user_profiles`. Mismatch → **auto-logout + redirect to login page** with message: "Your profile has been updated. Please log in again to continue." No manual logout button — one step removed.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + Tailwind CSS (within existing GA app) |
| Auth | Supabase Auth (GA app handles login) |
| Database | Supabase (PostgreSQL) — extends existing GA app |
| Backend Logic | Supabase Edge Functions |
| File Storage | Supabase Storage (selfie images) |
| QR Gate Tablet | Authenticated dumb display. Per-location credentials. Seed-based token. Daily re-login. |
| Notifications | Browser push (GA app infrastructure) + email |
| Export | Server-side Excel generation (ExcelJS) |

---

## 1. Multi-Tenant & Multi-Company Structure

### Hierarchy
```
Client Account (Account Owner)
  └── Company (timezone: WIB or WITA)
        └── Location (type: physical or remote)
              └── QR Gate Device (optional, per-location credentials)
```

### Location Types
| Type | GPS | Geofencing | QR Devices |
|---|---|---|---|
| `physical` | Required (lat/lng/radius) | Works when enabled by policy | Can register |
| `remote` | None | Automatically skipped | None |

`location_id` is NOT NULL on `user_profiles`. Every employee has a location. Remote employees are assigned a "Remote" type location.

### Roles (Dual Role System)
| Attendance Role | Access |
|---|---|
| `employee` | Check in/out, view own data, submit requests, view division colleagues |
| `supervisor` | Approve requests, view division dashboard, edit roster before shift starts |
| `hr_staff` | Manage roster (sole editor after shift starts), exports, corrections, leave |
| `company_admin` | Configure policies, master data, holidays, locations, setup wizard |
| `account_owner` | Manage multiple companies. Can also hold company_admin. |

### First-Time Company Setup (Guided Wizard)
Enforced dependency order:
1. Company timezone + all policy defaults (explicitly set — no auto-populated values)
2. Levels (global, may already exist)
3. Divisions (links to existing GA admin page, not rebuilt)
4. Locations (physical with GPS or remote)
5. Shift templates
6. Attendance group policies (pre-filled with company defaults)
7. Approval configuration (3 separate checklists — warns if any are empty)
8. QR gate device credentials (if needed)
9. Employees (assigned division, level, location, attendance_role)

### Employee Deactivation Cascade
- Pending requests: remain for HR to review/close manually
- Future roster: auto-removed
- Approver designation: stays but auto-skipped, falls back to role
- Historical records: preserved (soft delete)

### Auth
- GA app handles login. Attendance = "after login" state.
- Division, level, location are NOT NULL.
- JWT mismatch → auto-logout + redirect with message.
- Cross-company write via `can_write` on `user_company_access`.

### AI Code Quality (CLAUDE.md)
Phase 1 deliverable: `CLAUDE.md` and `ARCHITECTURE.md` at repo root. Claude Code reads these automatically. Includes invariants, dual-write rules, RLS patterns. Updated after every phase.

---

## 2. Locations & QR Gate Devices

### QR Gate Device Credentials
- Admin generates per-location credentials in the location settings (username + password)
- Generic login page on tablet → enter credentials → validates → redirects to full-screen QR display
- QR display shows: rotating QR code + location name + logout link
- Admin can reset credentials anytime
- Not a user account — it's device auth
- Daily re-login by security staff

### Geofencing UX
Block screen (both check-in AND check-out): detected location + Google Maps link + retry button.

---

## 3. Attendance Capture (Mobile Web)

### Employee Flow
1. Tap "Check In" / "Check Out"
2. **Geofencing ON** → GPS check. Remote locations skip this.
3. **Selfie ON** → camera opens. Retake button available. Final on submit.
4. **Dynamic QR ON** → camera opens (employee chooses front or back via flip toggle) → scan tablet QR.
5. Submit.

### Rules
- One check-in + one check-out per shift. No re-entry.
- Missed check-out → correction workflow.
- No check-in + no leave → absent at end of shift (background job).
- GPS always captured for audit.
- Camera flip toggle: employee picks front or back camera for QR scan. No forced switching.

### Reminders
- **15 minutes before shift start**: browser push notification — "Your shift starts in 15 minutes"
- **15 minutes after shift end**: browser push — "Don't forget to check out"
- Fixed timing, not configurable.

---

## 4. Shift Templates & Roster Planning

### Shift Templates (dedicated page, desktop)
Centrally defined: name, start, end, cross-midnight flag, break (placeholder MVP).

### Two Roster Models (per attendance group)

**A. Repeatable Pattern — 4-Week Grid**
A 28-day template where each day has a field to assign a shift template (or leave empty for day off). This 4-week block repeats indefinitely.

Supports: simple weekly (all 4 weeks identical), biweekly (weeks 1-2 differ from 3-4), complex rotations (4-on-2-off that don't align to weeks).

One shift per day per pattern. Auto-generates 2 months ahead from today. Weekly cron extends.

The grid UI: rows = days of the week, columns = week 1/2/3/4. HR drops shift templates into cells.

**B. Custom Roster — Employee × Date Grid**
Rows = employees (auto-populated from attendance group). Columns = dates. HR drops shift templates into cells.

Both grids look similar — the custom roster just adds the employee dimension.

### Holiday Greying (Cross-Midnight Aware)
If a holiday is January 5, any shift that **touches** January 5 is greyed:
- Jan 4 22:00 → Jan 5 06:00 (end touches holiday) → greyed
- Jan 5 22:00 → Jan 6 06:00 (start touches holiday) → greyed
- Cross-midnight shifts visually span two date columns (like a Google Calendar event)

### Roster Regeneration
- Holiday changes: retroactive update. Custom roster: delete only (never add).
- Pattern changes: regenerate future unstarted entries.
- Manual overrides: flagged, survive regeneration.
- Roster uses current policy (retroactive).

### Editing
Before shift starts: HR + Supervisor. After: HR only + reason.

---

## 5. Policy & Rules Engine

### Attendance Policy
Geofencing ON/OFF, Selfie ON/OFF, Dynamic QR ON/OFF, punch window, lateness/early-out tolerance, missing punch handling, OT/correction deadline, holiday observance (public/company toggles).

Partial leave: deferred. MVP = full-day only.

### Leave Types
Indonesian statutory defaults + admin custom types. Warn if annual < 12. Leave on rest day: blocked (grayed in date picker). Leave on holiday: warn, don't deduct.

**Leave deduction counts working days only.** Rest days and observed holidays within a leave date range are auto-excluded. Recap shows: "March 10–17 (8 calendar days). Rest days skipped: Mar 15, 16. Leave days used: 6."

### Approval Configuration — Three Separate Checklists
| Request Type | Config |
|---|---|
| **Leave** | ☐ Supervisor ☐ Manager ☐ HR |
| **Overtime** | ☐ Supervisor ☐ Manager ☐ HR |
| **Correction** | ☐ Supervisor ☐ Manager ☐ HR |

Each independently configured. All checked roles must approve (any order). 0 = auto-approved (warned). Self-approval: own step auto-approved, continues. Approver scope: same division. Fallback: role → auto-skip.

### Leave Submission Deadline
None. Employees can submit leave for past dates anytime. HR manages the process — they check for gaps before running the export and nudge employees to submit missing leave requests.

### Year Boundary (Jan 1)
Balance auto-resets. Cross-year leave split by day. Carry-over deferred (Phase 2: FIFO, March 31 expiry).

---

## 6. Leave Management

Submit for any date (past or future). Full-day only. Blocked on rest days (grayed). Holiday = warn, don't deduct. Rest days within range auto-excluded from count.

**Client-side validation**: start date selected → end date picker disables dates beyond remaining balance (accounting for rest day exclusions). Recap shown before submit.

---

## 7. Overtime Management

Employee-initiated. **OT request is just a form — no geofencing or QR required.** Verification happens at check-out. User sees shift start date; recap uses shift end date. All OT approvers must approve. Reconciled at check-out (±15 min). Hard blocked after deadline. Both `actual_check_out` and `recorded_ot_hours` preserved.

---

## 8. Correction Workflow

Structured form: shift + date (read-only), pre-filled check-in/out times (editable), reason. Same approval (all correction approvers must approve). Same deadline. Original preserved. "Corrected" indicator in employee history. Also used for gate device failures.

---

## 9. Holidays

Public + company-defined. Both editable. Two observance toggles per group. Observed holidays disable roster days. Cross-midnight shifts touching a holiday are greyed.

---

## 10. Division Visibility

Real-time: who's physically working now. Name + shift hours + status. Cross-midnight aware.

---

## 11. Supervisor & HR Dashboard

Supervisor = own division (one, MVP). HR = company-wide. Multi-company HR: dropdown **disabled when single-company**, enabled + auto-refresh when multi. Clickable counts → modals. Exceptions → approval forms. Weekly trend. Auto-refresh. Permalinks.

---

## 12. Employee Self-Service (Mobile)

Home: shift, check-in/out, status, division visibility, **permission banner if needed**. History: calendar (desktop) / table (mobile). Leave: balance + client-validated request + rest-day recap + history. Requests: correction + OT + history. Permalinks.

---

## 13. Payroll Recap Export

**Free-range date filter** — no cutoff setting needed. HR picks any start and end date. No configuration in admin settings.

Two-sheet Excel. 34-col daily + 26-col summary. Current division/level. **Employee name/ID cells are clickable hyperlinks** to their profile page in the app for easy cross-checking.

---

## 14. Notifications

| Channel | Used For |
|---|---|
| **Browser push** (GA app infra) | Check-in/out reminders (15 min), approval needed, time-sensitive alerts |
| **Email** | Request approved/rejected, records trail |

Both channels for: new request pending (push to approver + email).

---

## 15. Audit & Compliance

Immutable audit log. Policy versioning. Not auto-purged.

---

## 16. Data Retention

2 years default. Purge: records, selfies, QR logs. Keep: master data, audit logs.

---

## 17. Employee Master Data

Extends `user_profiles`. Division, level, location all NOT NULL. Location can be type `remote`. Full schema in appendix.

---

## Out of Scope (v1)
Full payroll computation, OT pay rates, OT weekly caps, break tracking, biometrics/face matching, shift swap by employees, leave carry-over (March 31 expiry), partial leave, native mobile app, custom logic scripting, workforce planning, supervisor multiple divisions, point-in-time export snapshots, payroll cutoff setting, in-app messaging.

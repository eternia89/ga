# Shift & Attendance System — How It Works
### A guide for humans (and machines that need to think like humans)

> This is deliberately the longest document in the project. It tells you not just *what* the system does, but *why*, *how it feels*, and *what can go wrong*.
> For column schemas, RLS patterns, and technical specs, see `prd-master.md` and `prd-appendix.md`.
> Each section maps to a build phase.

---

## The Big Idea

This is an online attendance app. People open it, check in when they arrive at work, and check out when they leave. That's the core.

Everything else — shift scheduling, leave requests, overtime approval, QR scanning, selfie capture, geofencing — are layers on top of that core. They only appear when the company's rules say they should. An office worker and a warehouse operator use the same app, see the same screen, tap the same button. But the warehouse operator might get asked to take a selfie and scan a QR code at the security gate, while the office worker just taps and they're done.

The employee never needs to configure anything. They never choose a "mode." The app adapts to them. If their rules change (they transfer to a different division), the app automatically logs them out and redirects to the login page with a message: "Your profile has been updated. Please log in again to continue." They log in, and the next check-in has different steps. No training session.

Two important design rules shape everything:
- **Employee pages are mobile-first.** Check-in, leave requests, corrections, overtime — all designed for a phone screen.
- **Admin pages are desktop only.** Policy configuration, roster management, exports — complex screens on a full monitor.

One more rule that runs deeper: **validate on the client first, confirm on the server.** When an employee picks leave dates, the date picker should disable dates they can't select (beyond their balance, on rest days). They should never submit something that will be rejected. The server still validates everything — but the employee should know before they tap Submit whether it will work.

And one more: **every page has a permalink.** Every dashboard view, every filtered roster, every employee history — has a unique URL that encodes the current state. Supervisors can bookmark their morning view. HR can share a link to a specific roster. The Excel export can hyperlink to employee profiles. Nothing is a dead end.

---

## Who Uses This App

There are five types of people. Each sees a different version of the same app.

### The Employee
They care about one thing: **clocking in and out with minimum friction.**

They open the app in the morning on their phone. They see today's shift — "Normal shift, 09:00–18:00, Jakarta Office." They tap "Check In." Depending on their company's rules, they might be asked to take a selfie, or scan a QR code at the security gate, or just confirm. Done.

At the end of the day, same thing. "Check Out." Same verification steps as check-in — if their policy requires a selfie to clock in, it also requires one to clock out. If geofencing is on, they need to be at the location for both.

**One check-in and one check-out per shift. That's it.** If they check out and realize they need to go back inside, they can't check in again. They'd submit a correction request later. This keeps the data clean.

The first time they use the app, they might see a banner on their home screen:

> "Your attendance policy requires camera and location access. Enable them now to avoid delays at check-in."
> [Enable Permissions]

This pre-prompts them to set up device permissions before they're standing at the gate with a line behind them. The banner disappears once permissions are granted.

Throughout the month they might:
- Request a day off — the date picker is smart: rest days are grayed out (can't select), dates beyond their remaining balance are disabled, and observed holidays show a warning. Before submitting, a recap appears: "March 10–17 (8 calendar days). Rest days skipped: Mar 15, 16. **Leave days used: 6.**"
- Request overtime approval before staying late — this is just a form, no selfie or QR needed. The verification happens when they check out.
- Submit a correction if they forgot to check out yesterday — a simple form shows their shift, pre-fills the check-in/out times, and they just edit what's wrong
- Check how many leave days they have left (including any custom types their company added like "Hajj Leave")
- See their attendance history — on desktop it's a calendar with colored dots (green = on time, amber = late, red = absent, blue = leave, gray = rest day, purple = holiday). On mobile it's a scrollable table. Corrected records show a "corrected" badge.
- Glance at who else in their division is working **right now** — not "today" abstractly, but who is physically at work, with their actual shift hours displayed

15 minutes before their shift starts, they get a browser push notification: "Your shift starts in 15 minutes." 15 minutes after their shift ends: "Don't forget to check out." These are fixed — not configurable.

That's the employee's world. Small and effortless.

### The Supervisor / Manager
They care about **their division running smoothly today.**

They open the app and see a dashboard: 12 people expected on the morning shift, 10 have checked in, 1 is late, 1 hasn't shown up. Each number is tappable — they can see exactly who. Tap "Late: 1" and a modal shows: "Budi — 2 minutes late — Surabaya Warehouse."

Below that, a list of things needing their attention. Leave requests, overtime requests, correction requests. They tap, review, approve or reject. The dashboard auto-refreshes so numbers update as people check in.

They also help plan the roster. If their division uses a custom schedule, the supervisor can rearrange who works when — but only before the shift starts. Once it's started, only HR can touch it (with a logged reason).

The supervisor sees their own **division** only — their organizational unit like "Warehouse" or "Finance," not a physical location. One division per supervisor in the first version.

**Approval note**: if a supervisor submits their own leave request and their role is one of the required approvers, their own step is auto-completed. The request continues to the remaining approvers.

**Important**: each type of request has its own approval rules. Leave might need both Supervisor and HR approval. Corrections might only need Supervisor. Overtime might need just the Manager. These are independently configured per attendance group — the supervisor doesn't need to know the config, they just see the requests that land in their queue.

### HR Staff
HR is the operational backbone. They care about **accuracy, compliance, and getting payroll done.**

Same dashboard as the supervisor, but company-wide. They can filter by division, location, or shift. If they manage multiple companies (GA app granted cross-company access), they see a company dropdown at the top. **If they only have one company, the dropdown is disabled** — just shows their company name, can't click it. Multi-company HR sees an active dropdown that auto-refreshes all data when they switch.

HR's unique powers:
- **Edit the roster anytime** (with logged reason after shift start)
- **Process correction requests** — check audit logs, approve or reject with reason
- **Run the export** — pick any date range (there's no payroll cutoff setting — just a free start/end date picker), download the Excel
- **Manage leave balances** — override proration, adjust balances manually
- **Handle gate device failures** — mark attendance retroactively through the correction workflow
- **Review pending requests from deactivated employees** — when someone leaves, their pending requests stay for HR to close manually

HR works on desktop.

### Company Admin
The admin sets up the machine. Their main event is the **setup wizard** — a guided flow that enforces the right order:

1. Set company timezone and **explicitly set all policy defaults** — no auto-populated values. Every rule is a conscious choice.
2. Create levels (global, might already exist from another company)
3. Create divisions (links to the existing GA app divisions page — not rebuilt)
4. Create locations (physical with GPS, or remote without)
5. Create shift templates (Normal 9–6, Graveyard 22–6, etc.)
6. Configure attendance group policies (pre-filled with company defaults — admin only changes what they want to override)
7. Configure approval rules — **three separate checklists** for leave, OT, and corrections. The wizard warns if any are left empty: "All [leave/OT/correction] requests will be auto-approved."
8. Register QR gate devices (generate per-location credentials)
9. Create and assign employees

After setup, the admin rarely touches things. Occasional holiday additions, new leave types, policy tweaks.

### Account Owner
Manages multiple companies. Can also hold company admin role for specific ones. Mostly a setup role.

---

## The Attendance Group: How Rules Get Assigned

Every employee has a **division** (Warehouse, Finance — organizational units, NOT physical locations) and a **level** (Staff, Manager). The combination is the **attendance group**: "Warehouse Staff" or "Finance Manager."

Both are mandatory — enforced in the database. Plus a **location** (Jakarta Office, Remote) which is also mandatory. Division, level, and location are all required before an employee can use the system.

The attendance group determines everything: verification steps, leave quotas, approval flow, holiday observance. When the admin opens a group's policy page, every field is **pre-filled with the company defaults** (grayed, labeled "inherited"). The admin only changes what they want to override. A group never has "no policy" — it always has at least the company defaults. This is the cascade working as designed.

**Why not assign rules per person?** Doesn't scale. 15 groups instead of 500 individual configs. Exceptions? Per-employee overrides.

---

## How Policies Cascade

**Company** → defaults for everyone (explicitly set by admin — never auto-populated).
**Attendance Group** → pre-filled with company defaults, admin overrides selectively.
**Individual** → rare exceptions.

One screen per level on desktop. Grayed = inherited. Highlighted = overridden.

---

## Phase 1 — The Foundation

> *database, roles, admin screens, setup wizard, CLAUDE.md*

### The Setup Wizard

When a company admin first enters, they see a guided wizard. Not optional — the system won't allow check-ins until required steps are done. Every value must be explicitly set.

The wizard prevents the most common mistake: configuring things out of order. You can't assign employees to divisions that don't exist. You can't create attendance groups without levels. The wizard enforces the sequence.

For divisions, the wizard links to the existing GA app divisions page — no need to rebuild what already works.

### Location Types

Every employee has a location. Locations come in two types:

**Physical** — an office, warehouse, branch. Has GPS coordinates and a geofence radius. Geofencing works here when the policy enables it.

**Remote** — for employees who work from home or from anywhere. No GPS coordinates. Geofencing is automatically skipped (nothing to check against). But QR devices can't be registered at remote locations, so Dynamic QR is also naturally absent.

This means `location_id` stays NOT NULL on every employee. A remote worker isn't "locationless" — they're assigned to a location called "Remote" that happens to have no GPS.

### Profile Changes: Auto-Logout

When HR changes someone's division, level, or attendance role, the employee's next app interaction compares their session against the database. If there's a mismatch, the system **automatically logs them out** and redirects to the login page with:

> "Your profile has been updated. Please log in again to continue."

No manual logout button. No confusion. They log in with Google, fresh session, correct data.

### When Someone Leaves

Employee deactivated → pending requests stay for HR. Future roster auto-removed. If they were a designated approver, their assignment stays but is auto-skipped. Historical records preserved.

### AI Code Quality

Phase 1 delivers `CLAUDE.md` at the repo root — invariants, dual-write rules, RLS patterns. Also `ARCHITECTURE.md` describing the system structure. Claude Code reads `CLAUDE.md` automatically on every task. Both files are updated after every phase.

### Schema Import

At the start of the Phase 1 conversation, upload the current Supabase migration files. Claude needs to see the exact current state of the database before extending it.

---

## Phase 2 — The Rules

> *shifts, rosters, policies, holidays, approval, leave types*

### Shift Templates

A menu of options on a dedicated page: Normal (9–6), MonSat (9–4), Graveyard (22–6), Morning (6–2). Building blocks for rosters. Cross-midnight shifts (like Graveyard) are attributed to the date the shift ends.

### Rosters

**Repeatable pattern — a 4-week grid.** Instead of a simple "Monday = Normal," the admin fills out a 28-day grid. Each day has a field to assign a shift template (or leave empty for day off). This 4-week block repeats indefinitely — the system cycles through it.

The grid looks like this:

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Week 1 | Normal | Normal | Normal | Normal | Normal | — | — |
| Week 2 | Normal | Normal | Normal | Normal | Normal | — | — |
| Week 3 | Night | Night | Night | Night | — | — | Night |
| Week 4 | Night | Night | Night | Night | — | — | Night |

This supports: simple weekly (all 4 weeks identical), biweekly rotations (weeks 1-2 differ from 3-4), and complex patterns like 4-on-2-off. One shift per day per pattern.

The system generates 2 months of roster ahead, from today forward. A weekly job extends the horizon.

**Custom roster — an employee × date grid.** Since the custom roster is scoped to an attendance group, the employee list is already known. The UI is:

| | Mar 1 | Mar 2 | Mar 3 | Mar 4 | Mar 5 |
|---|---|---|---|---|---|
| Adi | Morning | Morning | Night | Night | — |
| Budi | Night | Night | Morning | Morning | — |
| Rina | Morning | — | Morning | Morning | Morning |

HR/Supervisor drops shift templates into cells. Empty = day off. Cross-midnight shifts (like Night 22:00–06:00 on Mar 3) visually span two date columns — like a Google Calendar event stretching from Mar 3 into Mar 4.

Both models look the same visually — the custom roster just adds employee rows.

**Holiday greying — cross-midnight aware.** If January 5 is a holiday, any shift that *touches* January 5 is greyed out:
- Jan 4 22:00 → Jan 5 06:00 — end touches holiday → greyed
- Jan 5 22:00 → Jan 6 06:00 — start touches holiday → greyed

The greyed blocks span two columns visually. Admin can manually enable them if the group needs to work that holiday.

Holiday changes trigger retroactive roster updates. Custom rosters: holiday changes only delete (never add). Manual overrides survive regeneration. Roster entries always use the current policy.

**No overlapping shifts.** Back-to-back is fine. Editing: HR + supervisor before shift starts; HR only after (with reason).

### Policies

One screen per attendance group. Pre-filled with company defaults (grayed). Admin overrides selectively (highlighted). Includes verification toggles, punch windows, tolerances, submission deadlines, holiday observance.

### Approval — Three Separate Checklists

Each attendance group has three independent approval configurations:

**Leave approval**: ☐ Supervisor ☐ Manager ☐ HR
**Overtime approval**: ☐ Supervisor ☐ Manager ☐ HR
**Correction approval**: ☐ Supervisor ☐ Manager ☐ HR

A company might want Supervisor + HR for leave, just Supervisor for corrections, and Manager for OT. Each is configured independently.

All checked roles must approve (any order). All notified simultaneously. Any rejection = rejected. 0 = auto-approved (warned). Self-approval = own step auto-skipped. Scope = same division. Fallback = role → auto-skip.

### Leave Types

Statutory defaults (annual 12, sick unlimited, maternity 3mo, etc.) + admin custom types (Hajj, Marriage, Study). Full-day only in MVP. Rest days blocked (grayed in picker). Holiday = warn, don't deduct. **Rest days within a leave date range are auto-excluded from the count.** Recap shows exactly which days are deducted.

No submission deadline for leave. Employees can submit for past dates anytime. HR manages the process — they nudge employees before running the export.

New employees get prorated leave. HR can override.

### Holidays

Public (government) + company-defined. Both editable. Two observance toggles per group. Observed holidays disable roster days.

### Year Boundary

January 1: balance auto-resets to full quota. No carry-over (MVP). Cross-year leave: each day from its year's balance. Carry-over (FIFO, March 31 expiry) is Phase 2.

---

## Phase 3 — Checking In

> *check-in/out, verification layers, QR tablet, geofencing, permissions*

### What the employee experiences

They open the app. Home screen:

> **Today's shift**: Normal (09:00–18:00) at Jakarta Office
> **Status**: Not checked in
> **[Check In]**

If they haven't granted required permissions yet, there's a banner above the button prompting them to enable camera/location. They set it up once — the banner disappears.

They tap "Check In." What happens next depends on their policy:

**Geofencing** (if on): GPS checked silently. Outside? Block screen:

> "You appear to be outside Jakarta Office."
> Your detected location: [View on Google Maps →]
> Expected: within 200m
> [Retry] [Cancel]

The Google Maps link lets them verify if GPS is drifting. Retry re-reads GPS. Geofencing applies to **both check-in AND check-out** — you need to be at the location for both. Employees assigned to a "Remote" location skip this entirely — there's nothing to check.

**Selfie** (if on): camera opens. They take a photo. **A "Retake" button sits next to "Continue."** They can retake as many times as they want — avoiding blame during an audit for a blurry photo. Once they tap Continue and eventually Submit, the selfie is final. No going back.

**QR scan** (if on): the camera opens again for QR scanning. But here's the key: **the employee can choose front or back camera** via a flip toggle button. If they just used the front camera for the selfie and don't want to switch, they can hold the phone screen-away and scan the tablet's QR with the same front camera. If they prefer the back camera, they tap the flip toggle. Their choice. No forced camera switching.

The employee points their phone at the gate tablet, which displays a rotating QR code. The phone scans it. Token captured.

**Submit.** "Checked in at 08:57."

Check-out: same flow. Same verification. Same selfie + QR if required.

### The QR Gate Tablet

A dumb display. No camera. Shows a rotating QR code and the location name.

The tablet is logged in using **per-location credentials** — a username and password that the admin generated in the location settings (e.g., username: `kedoya-gate-1`). These aren't user accounts — they're device credentials stored in a `qr_devices` table. The admin can reset them anytime.

The security guard enters these credentials each morning. If the tablet wasn't logged in (guard forgot), employees can't scan QR — the tablet shows a login screen instead. HR resolves retroactively through the correction workflow.

The QR rotates every 15 seconds using a seed-based algorithm. The server knows the same seed, so it can independently verify tokens without talking to the tablet. The tablet works even if it loses internet.

### Reminders

15 minutes before shift: push notification — "Your shift starts in 15 minutes."
15 minutes after shift end: "Don't forget to check out."
Fixed timing.

### What if they forget to check out?

End-of-shift background job checks: rostered + checked in + no check-out → "missing check-out." Rostered + no check-in + no leave → "absent." Both show on the supervisor's exception list next morning.

---

## Phase 4 — Requesting Things

> *leave, overtime, corrections, approval engine*

### Taking Leave

Employee opens Leave section. Sees balance cards for each type (including custom types like "Hajj Leave").

The date picker is smart:
- Rest days for this employee are **grayed out** — a different color (gray) that clearly signals "not a working day." They can't click these individually, but if their date range passes through a rest day, it's automatically excluded from the count.
- Dates beyond their remaining balance are disabled.
- Observed holidays show a warning if selected.

Before submit, a recap:

> **March 10–17** (8 calendar days)
> Rest days skipped: Mar 15 (Sat), Mar 16 (Sun)
> **Leave days used: 6** — Mar 10, 11, 12, 13, 14, 17

The employee confirms. Server re-validates. All required **leave** approvers (not OT or correction approvers — separate checklists) are notified by email and browser push.

**Cross-year leave**: December 30 – January 2 → Dec days from 2025 balance, Jan days from 2026 balance.

**No deadline for leave.** Employees can submit for past dates anytime. HR manages the process before running the export.

### Requesting Overtime

Before or during their shift. **Just a form — no selfie, no QR, no geofencing.** The OT request is about intent, not location. The verification happens at check-out time when the employee physically clocks out.

Employee sees the shift start date on the form. System attributes internally to shift end date. All required **OT** approvers are notified (might be different people than leave approvers).

At check-out: worked ≈ approved (±15 min) → record approved hours. Worked less → record actual. Worked more → cap at approved (raw check-out preserved). No request → no OT.

Blocked after deadline (configurable days).

### Submitting a Correction

Structured form. Shift + date shown (read-only). Check-in/out times pre-filled with current values. Employee edits what's wrong. Reason required.

All required **correction** approvers notified (might be different from leave and OT approvers). Same deadline as OT.

The employee sees a "corrected" indicator in their history after approval. Also used for gate device failures.

---

## Phase 5 — Seeing the Big Picture

> *dashboards, employee views, notifications*

### Supervisor Dashboard

Current shift for their division:

> **Morning Shift — Warehouse**
> Expected: 24 | Checked in: 20 | Late: 2 | Absent: 1 | On leave: 1

Every number tappable → modal with names, details. Exceptions list below — each request tappable → approval form. Weekly trend chart. Auto-refresh. Permalinked.

### HR Dashboard

Same but company-wide. Filters. Company dropdown:
- **Single-company HR**: dropdown disabled (grayed), shows company name
- **Multi-company HR**: dropdown enabled, selecting auto-refreshes everything

### Employee Self-Service

**Division visibility**: who in your division is working **right now**:
- 9 PM Monday: "Adi — Graveyard 22:00–06:00 — starts in 1 hour"
- 11 PM Monday: "Adi — working since 22:00"
- 3 AM Tuesday: still showing
- 7 AM Tuesday: Adi gone (shift ended)

**History**: desktop = calendar with color-coded dots. Mobile = scrollable table. **Colors are shared constants** — the same green/amber/red/blue/gray/purple everywhere in the app (calendar, table, dashboard, roster, export legend). Corrected records show a badge.

**Leave**: balance cards. Smart date picker with rest-day exclusion and recap.

**Requests**: correction + OT forms (blocked after deadline), history with approval status.

### Notifications

| Channel | Used For |
|---|---|
| **Browser push** | Reminders (15 min), approval needed, time-sensitive |
| **Email** | Approved, rejected, confirmation records |

Both for: new request pending.

---

## Phase 6 — Getting Data Out

> *export, audit, cleanup*

### The Export

HR opens the export page. **No payroll cutoff setting exists** — HR just picks any start date and end date. If their payroll runs 26th–25th, they pick Feb 26 – Mar 25. If it's calendar month, they pick Mar 1 – Mar 31. No configuration needed. Just a date range picker.

Two-sheet Excel:

**Sheet 1 — Daily records**: 34 columns. One row per employee per day per shift. **Employee ID cells are clickable hyperlinks** to the employee's profile page in the app. If HR spots something odd, they click and land directly on that employee's page. No back-and-forth searching.

**Sheet 2 — Period summary**: 26 columns. One row per employee. Leave counts reflect **working days only** (rest days and holidays already excluded by the leave logic).

Export shows current division/level (not point-in-time).

### Audit Trail

Permanent. Roster changes, post-shift edits (with reason), correction chains, policy changes (versioned, by level), approval actions, leave type changes. Never auto-deleted.

### Data Cleanup

Attendance records, selfies, QR logs: 2 years. Employee profiles + audit: never.

---

## How It All Connects

**7:00 AM** — The security guard at the Surabaya warehouse logs into the gate tablet. Username: `surabaya-gate-1`, password entered. The screen fills with a large rotating QR code and "Surabaya Warehouse" at the top. Tomorrow morning, same routine — the session expires daily.

**7:45 AM** — Adi opens the app for the first time ever. He sees a banner: "Your policy requires camera and location access. Enable now to avoid delays at check-in." He taps it, grants both permissions. Banner disappears. He'll never see it again.

**7:50 AM** — Adi's home screen shows his shift: Morning (06:00–14:00). He's already late — but his policy has a 10-minute punch window, so he can still check in. Below his shift info, the division visibility section shows who's already working: "Rina — Morning — working since 06:02. Budi — Morning — working since 05:58."

**7:55 AM** — Adi taps Check In. Geofencing passes silently (he's at the warehouse). Front camera opens — he takes a selfie. It's blurry. He taps Retake. Takes another. Better. Taps Continue. The camera stays open — he sees a flip toggle but leaves it on front camera. He holds the phone screen-away and points it at the gate tablet. The front camera scans the QR code. Token captured. Submit. "Checked in at 07:55."

**8:02 AM** — At the Jakarta office, Sari taps Check In. Her group only has geofencing. One tap. Done.

**8:15 AM** — Pak Rudi (supervisor) checks his dashboard: Expected 24, Checked in 22, Late 2, Absent 1, On leave 1. He taps "Absent: 1" — it's Dewi. He messages her on WhatsApp (no in-app messaging). She's sick.

**8:30 AM** — Dewi submits sick leave from home. No geofencing needed for the form. She picks today, selects "Sick", writes "Fever." Her supervisor (Pak Rudi) and the Warehouse HR officer both get a push notification and email. Pak Rudi approves. HR approves an hour later. Both required. Done.

**10:00 AM** — Rina submits leave for next Thursday and Friday. The date picker shows Saturday and Sunday grayed out (rest days). She picks Thu–Sun, but the recap shows: "Thu–Sun (4 calendar days). Rest days skipped: Sat, Sun. **Leave days used: 2.**" She confirms. Her supervisor and HR both get notified. Both approve over the course of the day.

**3:00 PM** — Budi submits an OT request from the warehouse floor. Just a form — no selfie, no QR needed for the request itself. "2 hours, late shipment." His manager (separate from the supervisor who handles leave) gets a push notification and approves.

**6:00 PM** — Sari checks out. Geofencing confirms she's at the office. One tap.

**8:05 PM** — Budi checks out. Geofencing passes. Selfie. QR scan (he uses the back camera this time — taps the flip toggle). Submit. System: 2hr OT approved, actual 2hr 5min. Recorded: 2hr capped. Raw 20:05 preserved for audit.

**11:00 PM** — Evening shift ends. Background job: Fitri was scheduled, didn't check in, no leave. Marked absent. Shows on tomorrow's exception list.

**2:00 AM Tuesday** — Night shift visible: "Adi — Graveyard 22:00–06:00 — working since 22:00."

**Wednesday** — Adi realizes he forgot to check out on Monday. He opens Requests → Correction. The form shows: "Morning shift, March 16. Check-in: 07:55. Check-out: —." He types "14:05" in the check-out field and writes "Forgot to check out." His correction approvers (just Supervisor, per the group's config) are notified. Pak Rudi approves. Adi's history now shows a "corrected" badge on March 16.

**End of March** — Wati (HR) opens the export page. Picks any dates: March 1–31. Downloads the Excel. Sheet 1 has employee_id cells she can click to jump to profiles. Sheet 2 has the summary. Rina's leave shows 2 days annual (the rest days were already excluded). She sends the file to payroll.

**January 1** — Leave balances auto-reset. Budi had 3 unused days — gone. (Carry-over to March 31 is a future feature.) The December → January transition for anyone with cross-year leave was handled automatically: Dec days from old balance, Jan days from new.

That's the whole system.

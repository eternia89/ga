# PRD Validation — Real-World Stress Test

> Reference document. Shows *why* decisions were made. All questions answered. All gaps closed.

---

## Edge Cases — Build Now (MVP)

| # | Edge Case | Behavior |
|---|---|---|
| 1 | Check-in before punch window | Rejected |
| 2 | Shift deleted after start | Orphaned → HR flag |
| 3 | Same QR token, two employees | Allowed (per-employee single-use) |
| 4 | Phone clock drift | Server authoritative |
| 5 | Self-approval | Own step auto-approved, continues |
| 6 | Leave on holiday | Warn, don't deduct |
| 7 | Double check-out | Second ignored |
| 8 | Shift template deleted | Soft delete, rosters preserved |
| 9 | Division transfer mid-shift | Complete old policy, auto-logout |
| 10 | Mid-period employee | Included, partial summary |
| 11 | Leave on rest day | Blocked (grayed) |
| 12 | No group policy | Pre-filled with company defaults |
| 13 | Gate tablet down | HR corrects retroactively |
| 14 | All approvers unavailable | Auto-skip |
| 15 | Cross-year leave | Split by year |
| 16 | Deactivated: pending requests | HR reviews |
| 17 | Deactivated: future roster | Auto-removed |
| 18 | Deactivated: approver | Auto-skipped |
| 19 | Year boundary | Jan 1 auto-reset |
| 20 | Employee at remote location | Geofencing skipped, QR N/A |
| 21 | Leave date range spans rest days | Auto-excluded from count, recap shown |
| 22 | Camera permission not granted | Homepage banner pre-prompts. Flow blocked at step. |
| 23 | Blurry selfie | Retake before submit. Final after submit. |
| 24 | Cross-midnight shift touches holiday | Greyed if touches either end |

## Edge Cases — Deferred

| # | Edge Case | Phase |
|---|---|---|
| 25 | Two locations in one day | Future |
| 26 | Leave spanning holiday (exclusion) | Future |
| 27 | OT on holiday (pay rate) | Future |
| 28 | Split shift | Future |
| 29 | Supervisor multiple divisions | Future |
| 30 | Partial leave | Phase 2+ |
| 31 | Point-in-time export | Future |
| 32 | Leave carry-over (FIFO, Mar 31) | Phase 2 |

---

## 30 Failure Modes

### Auth (1-5)
JWT never refreshes. Meta not synced. Deactivated with valid JWT. Wrong company selected. Attendance role not set.

### Check-in (6-15)
GPS spoofing. Selfie of photo. Camera flip fails. Gate tablet offline (mitigated: seed-based). QR replay (mitigated: 15s). Phone dies mid-flow. Browser kills tab. Check-in without entering. Two devices concurrent. Timezone mismatch.

### Roster (16-20)
Cron fails. Holiday removes critical shifts. Override wiped (spec: survive). Deleted template. Overlap rounding.

### Leave & OT (21-25)
Balance race condition. OT math error. Deadline edge case. All approvers away. Leave overlaps existing.

### Export & Data (26-30)
Export timeout. Purge during export. Audit growth. Selfie storage. Division change not in history (by design: current state).

---

## Clarification Questions — All Answered (15)

| # | Answer |
|---|---|
| Q1 | Self: own step auto, continues |
| Q2 | One in + one out |
| Q3 | Rest day: blocked |
| Q4 | No policy: company defaults |
| Q5 | Supervisor: one division (MVP) |
| Q6 | Gate down: HR corrects |
| Q7 | Roster: today forward |
| Q8 | Scope: same division |
| Q9 | All must approve |
| Q10 | Absent: end of shift job |
| Q11 | Export: current state |
| Q12 | Pattern: one shift/day |
| Q13 | Geofencing: both ways |
| Q14 | QR: tablet displays, phone scans |
| Q15 | Owner: can be admin |

---

## UX Confusion Points (for phase work)

| # | Point | Phase | Status |
|---|---|---|---|
| 1 | Selfie retake flow | 3 | Decided: retake before submit |
| 2 | Camera switching | 3 | Decided: flip toggle, employee choice |
| 3 | Permission pre-prompt | 3 | Decided: homepage banner |
| 4 | Exception surfacing to employee | 5 | Open |
| 5 | Correction indicator | 5 | Decided: badge in history |
| 6 | Dashboard refresh interval | 5 | Open |
| 7 | Supervisor lateness actions | 5 | View only (MVP) |
| 8 | Export progress indicator | 6 | Open |
| 9 | Setup wizard UX | 1 | Decided: guided, reuses existing pages |
| 10 | Cross-year leave UX | 4 | Decided: split by year, recap shown |
| 11 | QR device login flow | 3 | Decided: per-location credentials |
| 12 | Leave date picker rest-day visual | 4 | Decided: gray, auto-excluded |
| 13 | Cross-midnight roster visual | 2 | Decided: span 2 columns |
| 14 | Company dropdown behavior | 5 | Decided: disabled/enabled |
| 15 | 4-week pattern grid UX | 2 | Decided: 28-day grid |

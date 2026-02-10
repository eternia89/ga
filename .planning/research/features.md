# Features Research: GA/CMMS Operations Tools

Based on analysis of Limble CMMS, UpKeep, Fiix, eMaint, FMX, and Maintenance Connection.

## 1. Request Workflow States (Industry Standard)

```
Submitted → Triaged → In Progress → Completed → Accepted/Rejected → Closed
                                                   ↓ (if rejected)
                                                 Reopened → In Progress
```

Additional states used by enterprise tools: On Hold, Waiting for Parts, Waiting for Approval, Cancelled.

**Recommendation:** Use: Submitted, Triaged, Approved (if money), In Progress, Completed, Accepted, Rejected, Closed. Keep it linear with conditional approval branch.

## 2. Triage & Prioritization

- **Priority levels:** Low, Medium, High, Urgent (4-level is industry standard)
- **Category assignment:** During triage, not during submission (reduces user friction)
- **GA Lead workflow:** Batch triage view — see all unassigned requests, quick-assign from list
- **Auto-priority rules:** Some tools auto-assign priority based on category (e.g., fire safety = always urgent). Consider for later phase.

## 3. Inventory Management Patterns

- **Asset hierarchy:** Company → Location → Asset (not nested assets for GA scope)
- **Movement tracking:** Transfer workflow with sender → receiver acceptance
- **Status lifecycle:** Active → Under Repair → Broken → Sold/Disposed
- **Auto-generated IDs:** e.g., AST-2026-0001 (human-readable, sequential per company)

**Recommendation:** Implement permanent asset movement (transfers), not check-in/check-out for shared tools. Movement = transfer of ownership/location.

## 4. Preventive Maintenance Scheduling

### Scheduling Types
- **Calendar-based (time):** Every N days/weeks/months — best for this project
- **Meter-based (usage):** Every N hours/km — defer (not relevant for office assets)
- **Condition-based:** IoT sensor triggered — defer entirely

### Fixed vs Floating Intervals
- **Fixed:** Next due on original schedule regardless of when last completed
- **Floating:** Next due = last completion + interval (recommended default)

### Template Checklist Item Types
- Checkbox (task done)
- Pass/Fail
- Numeric with acceptable range
- Text note
- Photo evidence
- Single-select dropdown

### Auto-Generation Behavior
1. Daily cron checks all active schedules
2. Generates jobs for items due within lead time window
3. Skips if asset is Broken/Sold (auto-pause)
4. Prevents duplicates (no new job if previous one still open)
5. Overdue PMs generate immediately with "Overdue" flag

## 5. Dashboard Metrics

### Tier 1 (Essential — implement in v1)
- Open requests count by priority
- Request status distribution
- Average response/resolution time
- Overdue work orders
- Staff workload (open jobs per person)

### Tier 2 (Valuable — phase 2)
- PM compliance rate
- Requester satisfaction scores
- Requests by subsidiary/division
- Cost per work order
- Warranty expiry soon

### Tier 3 (Advanced — phase 3+)
- MTBF/MTTR
- Planned vs reactive maintenance ratio
- SLA compliance rate

## 6. Approval Workflows

Project uses conditional single-approver: CEO approval only when money is involved.

**Recommended UX:**
- Dedicated approval queue page for CEO
- Quick approve/reject from list view
- Reject requires reason comment
- Show estimated cost prominently
- Defer batch approval and delegation to later phases

## 7. Common Pain Points & Mitigations

| Pain Point | Mitigation |
|-----------|------------|
| "Where is my request?" | Clear status tracking page for requesters |
| Too many form fields | Minimal submission (title, description, photo). Triage fills the rest |
| No feedback loop | Notifications on every status change |
| Too many clicks to update status | One-tap status change for GA Staff |
| Notification overload | Categorize by urgency, separate "action required" from "FYI" |
| Dashboard overload | Start with 3-4 KPIs, progressive disclosure |
| Low adoption | Make submission faster than WhatsApp (target: <60 seconds) |

## 8. Notification Patterns

### By Role
- **Requesters:** Status changes, completion (pending acceptance), auto-accept warning
- **GA Staff:** New assignments, approaching due dates, overdue alerts, rejection
- **GA Lead:** New requests (awaiting triage), aging alerts, daily digest
- **CEO:** Pending approvals, approval aging

### UX Pattern
- Bell icon with unread count badge
- Dropdown showing recent 10-20 items
- Full notification center page with filters
- Each item: icon + message + timestamp + read/unread indicator + click to navigate

## Feature Dependencies

```
Auth & RBAC → User Management → Division/Company CRUD
  → Request Submission → Triage → Job Execution → Completion → Acceptance → Feedback
  → Asset Registry → Movement Tracking
  → PM Templates → PM Scheduling → Auto Job Generation
  → CEO Approval (conditional branch from triage)
  → Notifications (cross-cutting)
  → Audit Trail (cross-cutting)
  → Dashboard (read-only aggregation of all above)
```

## Anti-Features (Do NOT Build)

- Real-time chat (comment threads suffice)
- Full drag-and-drop form builder (linear field list is enough)
- IoT/sensor integration
- AI-powered auto-assignment
- Native mobile app (responsive web is sufficient)
- Vendor/contractor portal
- Barcode/QR scanning
- Gantt charts
- Multi-language support
- Custom approval chains

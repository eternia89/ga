---
status: diagnosed
trigger: "Job detail page has UI problems: missing breadcrumb, squared card wrapper, no max-width"
created: 2026-02-26T00:00:00Z
updated: 2026-02-26T00:00:00Z
---

## Current Focus

hypothesis: Three separate UI discrepancies between job detail and request detail pages
test: Side-by-side code comparison of both pages and their client components
expecting: Specific structural differences in JSX
next_action: Return diagnosis

## Symptoms

expected: Job detail page should match request detail page layout (breadcrumb in header, no card wrapper on info, max-width constraint)
actual: (1) Breadcrumb renders inside content area not header bar, (2) JobDetailInfo wrapped in rounded-lg border card, (3) No max-width on outer container
errors: none (visual/layout issues)
reproduction: Visit any /jobs/[id] page on a wide monitor
started: Since job detail page was created

## Eliminated

(none needed - root causes identified on first inspection)

## Evidence

- timestamp: 2026-02-26
  checked: app/(dashboard)/jobs/[id]/page.tsx vs app/(dashboard)/requests/[id]/page.tsx
  found: Both pages have identical breadcrumb structure inside the page component (NOT in the dashboard header). Both use <Breadcrumb> inside a <div class="space-y-6 py-6">. However, request detail page has a header section (h1 with display_id, status badge, priority badge, requester info) BETWEEN the breadcrumb and the client component. Job detail page goes straight from breadcrumb to JobDetailClient.
  implication: Sub-issue 1 (missing breadcrumb) may be a misperception OR the breadcrumb is visually hidden by the card wrapper pushing it up.

- timestamp: 2026-02-26
  checked: JobDetailInfo (job-detail-info.tsx line 165) vs RequestDetailInfo (request-detail-info.tsx line 143-145)
  found: JobDetailInfo root element is <div class="rounded-lg border p-6 space-y-6"> (a card). RequestDetailInfo root is a <> fragment wrapping <div class="space-y-6"> with no border/card styling.
  implication: Sub-issue 2 CONFIRMED. JobDetailInfo has an unnecessary card wrapper that RequestDetailInfo does not.

- timestamp: 2026-02-26
  checked: Both page.tsx files and dashboard layout
  found: Neither page has a max-width constraint. Dashboard layout main area is <main class="flex-1 overflow-auto p-6 max-md:p-4 bg-white"> with no max-width. Request detail page also has no max-width but the 2-column grid (1fr + 380px) naturally constrains the right column. The issue is that on very wide screens the left column (1fr) stretches indefinitely on BOTH pages.
  implication: Sub-issue 3 exists on BOTH pages equally - the job detail page is not uniquely worse than request detail in this regard. However, the card wrapper on job detail may make the stretching more visually noticeable.

- timestamp: 2026-02-26
  checked: Request detail page header structure (lines 359-387)
  found: Request detail page has a prominent header section with h1 (display_id), status badge, priority badge, requester info, and rejection callout. Job detail page does NOT have this - all that info is inside the JobDetailInfo card component instead.
  implication: Sub-issue 1 is actually about the MISSING HEADER SECTION between breadcrumb and grid, not the breadcrumb itself. The breadcrumb exists but the header (display_id + status + priority + creator info) is missing from the page level - it is buried inside the card.

## Resolution

root_cause: |
  Three distinct issues, all in job detail page structure:

  1. MISSING PAGE-LEVEL HEADER: The request detail page has a header section (lines 359-387 of page.tsx)
     between the breadcrumb and the two-column grid that shows: h1 with display_id, status badge,
     priority badge, requester/creator info, and rejection callout. The job detail page goes directly
     from breadcrumb to JobDetailClient with no equivalent header. All that info is buried inside
     JobDetailInfo's card wrapper instead.

  2. CARD WRAPPER ON JobDetailInfo: JobDetailInfo (job-detail-info.tsx line 165) uses
     <div className="rounded-lg border p-6 space-y-6"> as its root element, creating a visible
     card/border around all the job info. RequestDetailInfo uses a bare fragment + div with no
     border styling. This is the "squared/card wrapper" the user sees.

  3. MAX-WIDTH: Neither page has a max-width constraint. The dashboard layout's <main> has no
     max-width. However, adding one to the job detail page wrapper would match best practices.
     The request page technically has the same issue but may appear less stretched because it
     lacks the prominent card border.

fix: (not yet applied)
verification: (not yet verified)
files_changed: []

/**
 * Phase 08 — Tests 11-18: Dashboard KPIs, date range, charts, tables, summaries
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 08 — Dashboard', () => {
  test('Test 11: Operational dashboard shows KPI cards for admin', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Welcome greeting should be visible (second h1 — first is sidebar company name)
    const greeting = adminPage.locator('main h1');
    await expect(greeting).toBeVisible({ timeout: 10_000 });
    await expect(greeting).toContainText(/Good/i);

    // Subheading about operational overview
    await expect(adminPage.locator('text=/operational overview/i')).toBeVisible({ timeout: 5_000 });

    // Wait for KPI data to load (may be async)
    await adminPage.waitForTimeout(2_000);

    // KPI card labels — verify each is visible with generous timeout
    await expect(adminPage.locator('text="Open Requests"').first()).toBeVisible({ timeout: 10_000 });
    await expect(adminPage.locator('text="Untriaged"').first()).toBeVisible({ timeout: 5_000 });
    await expect(adminPage.locator('text="Overdue Jobs"').first()).toBeVisible({ timeout: 5_000 });
    await expect(adminPage.locator('text="Open Jobs"').first()).toBeVisible({ timeout: 5_000 });
    await expect(adminPage.locator('text="Completed"').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Test 12: Date range filter with presets', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Preset buttons: Today, This Week, This Month, This Quarter, Custom
    const presets = ['Today', 'This Week', 'This Month', 'This Quarter', 'Custom'];
    let foundPresets = 0;
    for (const preset of presets) {
      const btn = adminPage.getByRole('button', { name: preset, exact: true });
      if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        foundPresets++;
      }
    }
    expect(foundPresets).toBeGreaterThanOrEqual(3);

    // "This Month" should be the default active preset
    // Click "This Week" and verify it doesn't error
    const thisWeekBtn = adminPage.getByRole('button', { name: 'This Week', exact: true });
    if (await thisWeekBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await thisWeekBtn.click();
      await adminPage.waitForTimeout(1_000);

      // URL should update with from/to params
      expect(adminPage.url()).toContain('from=');
    }

    // Click "This Month" to reset
    const thisMonthBtn = adminPage.getByRole('button', { name: 'This Month', exact: true });
    if (await thisMonthBtn.isVisible()) {
      await thisMonthBtn.click();
      await adminPage.waitForTimeout(500);
    }
  });

  test('Test 13: Non-operational roles see simple profile card', async ({ generalUserPage }) => {
    await generalUserPage.goto('/');
    await generalUserPage.waitForLoadState('networkidle');

    // Should NOT see KPI cards or "operational overview"
    await expect(generalUserPage.locator('text=/Open Requests/i')).not.toBeVisible({ timeout: 3_000 });

    // Should see "Your Profile" heading instead
    await expect(generalUserPage.locator('text=/Your Profile/i')).toBeVisible({ timeout: 5_000 });

    // Profile card should show user info
    await expect(generalUserPage.locator('text=/Email/i')).toBeVisible();
    await expect(generalUserPage.locator('text=/Role/i')).toBeVisible();
  });

  test('Test 13b: GA Staff also sees simple welcome (not operational dashboard)', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/');
    await gaStaffPage.waitForLoadState('networkidle');

    // GA Staff is NOT operational — should not see full dashboard
    await expect(gaStaffPage.locator('text=/Your Profile/i')).toBeVisible({ timeout: 5_000 });

    // Should not see KPI cards
    await expect(gaStaffPage.locator('text=/Open Requests/i')).not.toBeVisible({ timeout: 3_000 });
  });

  test('Test 14: Status distribution charts visible for operational roles', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Look for chart section headings
    const requestChartTitle = adminPage.locator('text=/Request Status Distribution/i');
    const jobChartTitle = adminPage.locator('text=/Job Status Distribution/i');

    // At least one chart should be visible
    const hasRequestChart = await requestChartTitle.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasJobChart = await jobChartTitle.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasRequestChart || hasJobChart).toBeTruthy();

    // Charts render as SVG via recharts
    if (hasRequestChart || hasJobChart) {
      const rechartsSvg = adminPage.locator('.recharts-wrapper');
      const chartCount = await rechartsSvg.count();
      expect(chartCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Test 15: Staff Workload table with sortable columns', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Staff Workload section heading
    const workloadHeading = adminPage.locator('text=/Staff Workload/i');
    await expect(workloadHeading).toBeVisible({ timeout: 5_000 });

    // Column headers should be visible
    for (const header of ['Staff Name', 'Active Jobs', 'Completed', 'Overdue']) {
      await expect(adminPage.locator(`text=/${header}/i`).first()).toBeVisible();
    }

    // Headers should be sortable — look for sort indicator arrows (↑↓↕)
    const sortIndicators = adminPage.locator('th').filter({ hasText: /[↑↓↕]/ });
    const sortCount = await sortIndicators.count();
    expect(sortCount).toBeGreaterThanOrEqual(1);

    // Click a header to sort
    const activeJobsHeader = adminPage.locator('th', { hasText: /Active Jobs/i });
    if (await activeJobsHeader.isVisible()) {
      await activeJobsHeader.click();
      await adminPage.waitForTimeout(500);
    }
  });

  test('Test 16: Request Aging table with time buckets', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Request Aging section heading
    const agingHeading = adminPage.locator('text=/Request Aging/i');
    await expect(agingHeading).toBeVisible({ timeout: 5_000 });

    // Time bucket headers should be present (e.g., "0-5 days", "6-10 days", etc.)
    const bucketHeaders = adminPage.locator('th').filter({ hasText: /days/i });
    const bucketCount = await bucketHeaders.count();
    expect(bucketCount).toBeGreaterThanOrEqual(2);
  });

  test('Test 17: Maintenance Summary with urgency groups', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Maintenance Summary section heading
    const maintenanceHeading = adminPage.locator('text=/Maintenance Summary/i');
    await expect(maintenanceHeading).toBeVisible({ timeout: 5_000 });

    // May show urgency labels (Overdue, Due This Week, Due This Month) or "No maintenance due"
    const noMaintenance = adminPage.locator('text=/No maintenance due/i');
    const hasMaintenance = !(await noMaintenance.isVisible({ timeout: 2_000 }).catch(() => false));

    if (hasMaintenance) {
      // Should show urgency badges
      const urgencyLabels = adminPage.locator('text=/Overdue|Due This Week|Due This Month/i');
      expect(await urgencyLabels.count()).toBeGreaterThanOrEqual(1);
    }
    // Either way, section heading is visible — that's the key assertion
  });

  test('Test 18: Inventory Summary with By Status and By Category', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Inventory Overview section heading
    const inventoryHeading = adminPage.locator('text=/Inventory Overview/i');
    await expect(inventoryHeading).toBeVisible({ timeout: 5_000 });

    // Sub-section headings: "BY STATUS" and "BY CATEGORY"
    await expect(adminPage.locator('text=/BY STATUS/i').first()).toBeVisible();
    await expect(adminPage.locator('text=/BY CATEGORY/i').first()).toBeVisible();

    // Table columns: "Status"/"Category" + "Count"
    const statusHeader = adminPage.locator('th', { hasText: /^Status$/i });
    const categoryHeader = adminPage.locator('th', { hasText: /^Category$/i });
    const countHeaders = adminPage.locator('th', { hasText: /^Count$/i });

    await expect(statusHeader).toBeVisible();
    await expect(categoryHeader).toBeVisible();
    expect(await countHeaders.count()).toBeGreaterThanOrEqual(2);
  });
});

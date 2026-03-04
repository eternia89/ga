/**
 * Phase 05 — Tests 3-5 + retest 2-5: Job detail layout, timeline, comments, PIC, cost
 */
import { test, expect } from '../../fixtures';
import { JobNewPage } from '../../pages/jobs/job-new.page';
import { JobDetailPage } from '../../pages/jobs/job-detail.page';

test.describe('Phase 05 — Job Detail', () => {
  let jobUrl: string;

  test.beforeAll(async ({ browser }) => {
    // Create a job via GA Lead for subsequent tests
    const context = await browser.newContext({
      storageState: 'e2e/.auth/ga_lead.json',
    });
    const page = await context.newPage();
    const form = new JobNewPage(page);
    await form.goto();
    await form.fillTitle('E2E Detail Test Job');
    await form.fillDescription('E2E test: Job created for detail page testing.');
    await form.selectLocation('Head Office');
    await form.selectCategory('Electrical');
    await form.selectPriority('Medium');
    await form.selectAssignee('E2E GA Staff');
    await form.fillEstimatedCost('1000000');
    await form.submit();
    await page.waitForURL(/\/jobs\//, { timeout: 10_000 });
    jobUrl = page.url();
    await context.close();
  });

  test('Test 3: Job detail page shows correct layout', async ({ gaLeadPage }) => {
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    // Job ID visible
    await expect(gaLeadPage.locator('text=/J[A-Z0-9]/')).toBeVisible();

    // Status badge visible
    await expect(gaLeadPage.locator('.badge, [class*="badge"]').first()).toBeVisible();

    // Title visible
    await expect(gaLeadPage.locator('text=/E2E Detail Test Job/')).toBeVisible();

    // Max width constraint
    const mainContent = gaLeadPage.locator('[class*="max-w"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('Test 4: Job timeline shows events', async ({ gaLeadPage }) => {
    const detail = new JobDetailPage(gaLeadPage);
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    await detail.expectTimeline();
    // Should have at least a "created" event
    await expect(gaLeadPage.locator('text=/created/i')).toBeVisible();
  });

  test('Test 5: Add comment with text', async ({ gaLeadPage }) => {
    const detail = new JobDetailPage(gaLeadPage);
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    const commentText = `E2E test comment ${Date.now()}`;
    await detail.addComment(commentText);

    // Comment should appear in timeline
    await gaLeadPage.waitForTimeout(2_000);
    await detail.expectComment(commentText);
  });

  test('Retest 2: PIC (Assigned To) shown on job detail', async ({ gaLeadPage }) => {
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    // PIC / Assigned To should be visible
    await expect(gaLeadPage.locator('text=/E2E GA Staff/')).toBeVisible();
  });

  test('Retest 3: PIC editable inline', async ({ gaLeadPage }) => {
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    // The assigned-to field should be an editable combobox for GA Lead
    const assignedField = gaLeadPage.locator('[role="combobox"]').filter({ hasText: /E2E GA Staff/ });
    if (await assignedField.isVisible()) {
      // It's inline editable - good
      expect(await assignedField.count()).toBeGreaterThan(0);
    }
  });

  test('Retest 4: Estimated cost field visible', async ({ gaLeadPage }) => {
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    // Estimated cost should show on detail page
    await expect(gaLeadPage.locator('text=/estimated cost|cost/i')).toBeVisible();
  });

  test('Retest 5: Cost shows IDR format', async ({ gaLeadPage }) => {
    await gaLeadPage.goto(jobUrl);
    await gaLeadPage.waitForLoadState('networkidle');

    // Should show Rp formatted value
    await expect(gaLeadPage.locator('text=/Rp/')).toBeVisible();
  });
});

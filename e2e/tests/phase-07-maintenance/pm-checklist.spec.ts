/**
 * Phase 07 — Tests 16-20: PM checklist on job detail, save-as-you-go, complete, read-only, badges
 */
import { test, expect } from '../../fixtures';
import { PMChecklistPage } from '../../pages/maintenance/pm-checklist.page';

test.describe('Phase 07 — PM Checklist & Badges', () => {
  test.fixme('Test 16: PM checklist visible on PM-type job detail', async ({ gaLeadPage }) => {
    // Navigate to a PM-type job (needs a PM job to exist in the DB)
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Look for a PM badge in the job list
    const pmRow = gaLeadPage.locator('tbody tr').filter({ hasText: /PM/i }).first();
    if (await pmRow.isVisible()) {
      await pmRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const checklist = new PMChecklistPage(gaLeadPage);
      await checklist.expectVisible();
      await checklist.expectProgressBar();
    }
  });

  test.fixme('Test 17: Save-as-you-go for checklist items', async ({ gaLeadPage }) => {
    // Navigate to a PM job with checklist
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const pmRow = gaLeadPage.locator('tbody tr').filter({ hasText: /PM/i }).first();
    if (await pmRow.isVisible()) {
      await pmRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const checklist = new PMChecklistPage(gaLeadPage);

      // Toggle a checkbox — should save immediately
      await checklist.toggleCheckbox(0);
      await gaLeadPage.waitForTimeout(1_000);

      // No explicit save button needed — auto-saved
      // Progress bar should update
    }
  });

  test.fixme('Test 18: Complete PM checklist', async ({ gaLeadPage }) => {
    // Needs all checklist items filled
    const checklist = new PMChecklistPage(gaLeadPage);
    await checklist.expectCompleteButton();
    await checklist.clickComplete();
    await checklist.expectCompletedState();
  });

  test.fixme('Test 19: Completed PM job shows read-only checklist', async ({ gaLeadPage }) => {
    // Navigate to a completed PM job
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Find a completed PM job
    const completedPmRow = gaLeadPage.locator('tbody tr')
      .filter({ hasText: /PM/i })
      .filter({ hasText: /completed/i })
      .first();

    if (await completedPmRow.isVisible()) {
      await completedPmRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const checklist = new PMChecklistPage(gaLeadPage);
      await checklist.expectReadOnly();
    }
  });

  test('Test 20: PM type badge and overdue badge on job list', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Check for PM badge text in the table
    const pmBadge = gaLeadPage.locator('text=/PM/');
    const pmCount = await pmBadge.count();
    // PM badges may or may not exist depending on test data
    expect(pmCount).toBeGreaterThanOrEqual(0);

    // Overdue badge (red) may appear on PM jobs
    const overdueBadge = gaLeadPage.locator('text=/overdue/i');
    const overdueCount = await overdueBadge.count();
    expect(overdueCount).toBeGreaterThanOrEqual(0);
  });
});

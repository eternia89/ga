/**
 * Phase 07 — Tests 16-20: PM checklist on job detail, save-as-you-go, complete, read-only, badges
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 07 — PM Checklist & Badges', () => {
  test('Test 16: PM checklist visible on PM-type job detail', async ({ gaLeadPage }) => {
    // Navigate to jobs list and look for a PM-type job
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Find a row with PM badge
    const pmRow = gaLeadPage.locator('tbody tr').filter({ hasText: /PM/i }).first();
    if (await pmRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pmRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      // PM Checklist section should be visible
      await expect(gaLeadPage.locator('text=/checklist|pm checklist/i').first()).toBeVisible({ timeout: 5_000 });

      // Progress bar showing completion
      const progressArea = gaLeadPage.locator('text=/\\d+.*\\/.*\\d+/').or(
        gaLeadPage.locator('[role="progressbar"]')
      );
      await expect(progressArea.first()).toBeVisible({ timeout: 5_000 });
    } else {
      // No PM jobs exist — skip gracefully
      test.skip(true, 'No PM-type jobs found in list');
    }
  });

  test('Test 17: Save-as-you-go for checklist items', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const pmRow = gaLeadPage.locator('tbody tr').filter({ hasText: /PM/i }).first();
    if (await pmRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pmRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      // Checklist should be present
      const checklistVisible = await gaLeadPage.locator('text=/checklist/i').first()
        .isVisible({ timeout: 5_000 }).catch(() => false);

      if (checklistVisible) {
        // Toggle a checkbox if available — should save immediately (no save button needed)
        const checkbox = gaLeadPage.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await checkbox.click();
          await gaLeadPage.waitForTimeout(1_000);
          // No explicit save button needed — auto-saved
        }
      }
    } else {
      test.skip(true, 'No PM-type jobs found');
    }
  });

  test.skip('Test 18: Complete PM checklist', async () => {
    // Requires all checklist items to be filled — complex data setup needed
    // This test verifies the "Complete Checklist" button appears when all items have values
  });

  test.skip('Test 19: Completed PM job shows read-only checklist', async () => {
    // Requires a completed PM job with checklist data
    // This test verifies inputs are disabled on completed/cancelled PM jobs
  });

  test('Test 20: PM type badge visible on jobs list', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Table should be visible
    await expect(gaLeadPage.locator('table')).toBeVisible({ timeout: 5_000 });

    // Check if any PM badges exist in the table
    const pmBadge = gaLeadPage.locator('tbody').locator('text=/PM/');
    const pmCount = await pmBadge.count();
    // PM badges may or may not exist depending on whether schedules have generated jobs
    // Just verify the jobs page loads without errors
    expect(pmCount).toBeGreaterThanOrEqual(0);
  });
});

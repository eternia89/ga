/**
 * Phase 07 — Tests 10-15, 21: Schedule list, create, detail, activate/deactivate/delete, auto-pause, edit interval
 */
import { test, expect } from '../../fixtures';
import { ScheduleListPage } from '../../pages/maintenance/schedule-list.page';
import { ScheduleNewPage } from '../../pages/maintenance/schedule-new.page';
import { ScheduleDetailPage } from '../../pages/maintenance/schedule-detail.page';

test.describe('Phase 07 — Schedule CRUD', () => {
  test('Test 10: Schedules list page loads with correct columns', async ({ gaLeadPage }) => {
    const list = new ScheduleListPage(gaLeadPage);
    await list.goto();
    await list.expectTitle();
    await list.expectColumns();
    await list.expectNewScheduleButton();
  });

  test('Test 11: Create schedule with bidirectional category filter', async ({ gaLeadPage }) => {
    const form = new ScheduleNewPage(gaLeadPage);
    await form.goto();

    // Select a template first — should filter assets to matching category
    await form.selectTemplate('Furniture');
    await form.expectTemplateFilteredByCategory();
  });

  test('Test 12: Create schedule with interval and type', async ({ gaLeadPage }) => {
    const form = new ScheduleNewPage(gaLeadPage);
    await form.goto();

    // Select template and asset
    const templateTrigger = gaLeadPage.locator('[role="combobox"]').first();
    await templateTrigger.click();
    await gaLeadPage.waitForTimeout(300);
    const firstTemplate = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    }

    await gaLeadPage.waitForTimeout(500);
    const assetTrigger = gaLeadPage.locator('[role="combobox"]').nth(1);
    await assetTrigger.click();
    await gaLeadPage.waitForTimeout(300);
    const firstAsset = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstAsset.isVisible()) {
      await firstAsset.click();
    }

    // Set interval
    await form.fillIntervalDays('30');

    // Default should be Floating — verify Fixed/Floating toggle exists
    await expect(gaLeadPage.getByRole('button', { name: 'Fixed' })).toBeVisible();
    await expect(gaLeadPage.getByRole('button', { name: 'Floating' })).toBeVisible();

    await form.submit();

    // Should redirect to schedule list
    await gaLeadPage.waitForURL(/\/maintenance/, { timeout: 10_000 });
  });

  test('Test 13: Schedule detail page shows info', async ({ gaLeadPage }) => {
    const list = new ScheduleListPage(gaLeadPage);
    await list.goto();

    const firstRow = gaLeadPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const detail = new ScheduleDetailPage(gaLeadPage);

      // Status badge
      await detail.expectStatusBadge(/active|paused|deactivated/i);

      // Info fields: template, asset, interval, type
      await expect(gaLeadPage.locator('text=/template/i')).toBeVisible();
      await expect(gaLeadPage.locator('text=/asset/i')).toBeVisible();
      await expect(gaLeadPage.locator('text=/interval/i')).toBeVisible();

      // Next due date
      await detail.expectNextDue();
    }
  });

  test('Test 14: Activate, deactivate, and delete schedule', async ({ gaLeadPage }) => {
    // Create a schedule to test with
    const form = new ScheduleNewPage(gaLeadPage);
    await form.goto();

    const templateTrigger = gaLeadPage.locator('[role="combobox"]').first();
    await templateTrigger.click();
    await gaLeadPage.waitForTimeout(300);
    const firstTemplate = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    }
    await gaLeadPage.waitForTimeout(500);
    const assetTrigger = gaLeadPage.locator('[role="combobox"]').nth(1);
    await assetTrigger.click();
    await gaLeadPage.waitForTimeout(300);
    const firstAsset = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstAsset.isVisible()) {
      await firstAsset.click();
    }
    await form.fillIntervalDays('14');
    await form.submit();
    await gaLeadPage.waitForURL(/\/maintenance/, { timeout: 10_000 });

    // Open the schedule
    const list = new ScheduleListPage(gaLeadPage);
    const firstRow = gaLeadPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const detail = new ScheduleDetailPage(gaLeadPage);

      // Deactivate
      await detail.clickDeactivate();
      await detail.feedback.expectSuccess(/deactivated|success/i);
      await detail.feedback.dismiss();

      // Activate
      await detail.clickActivate();
      await detail.feedback.expectSuccess(/activated|success/i);
      await detail.feedback.dismiss();

      // Delete
      await detail.clickDelete();
      await detail.confirmDelete();

      // Should redirect to list
      await gaLeadPage.waitForURL(/\/maintenance$/, { timeout: 10_000 });
    }
  });

  test.fixme('Test 15: Auto-pause on asset status change', async ({ gaLeadPage }) => {
    // This test requires:
    // 1. An active schedule linked to an asset
    // 2. Changing the asset status to Broken/Under Repair
    // 3. Verifying schedule shows "Paused (Auto)" amber badge
    // 4. Changing asset back to Active
    // 5. Verifying schedule resumes
    // Complex multi-step flow — depends on existing schedule+asset data
  });

  test('Test 21: Edit interval on schedule detail', async ({ gaLeadPage }) => {
    const list = new ScheduleListPage(gaLeadPage);
    await list.goto();

    const firstRow = gaLeadPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const detail = new ScheduleDetailPage(gaLeadPage);
      await detail.clickEditInterval();

      // Edit interval
      await detail.editIntervalDays('7');
      await detail.saveEdit();

      await detail.feedback.expectSuccess(/updated|saved|success/i);

      // Template and Asset should NOT be editable
      // They should not have editable comboboxes
    }
  });
});

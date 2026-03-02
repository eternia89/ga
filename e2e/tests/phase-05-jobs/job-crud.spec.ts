/**
 * Phase 05 — Tests 1, 12: Create job and cancel job
 */
import { test, expect } from '../../fixtures';
import { JobNewPage } from '../../pages/jobs/job-new.page';
import { JobDetailPage } from '../../pages/jobs/job-detail.page';

test.describe('Phase 05 — Job CRUD', () => {
  test('Test 1: Create a job', async ({ gaLeadPage }) => {
    const form = new JobNewPage(gaLeadPage);
    await form.goto();
    await form.expectTitle();

    await form.fillTitle('E2E Test Job — Air conditioning repair');
    await form.fillDescription('E2E test: Full air conditioning unit replacement in the main office building.');
    await form.selectLocation('Head Office');
    await form.selectCategory('Electrical');
    await form.selectPriority('High');
    await form.selectAssignee('E2E GA Staff');

    await form.submit();

    // Should redirect to job detail
    await gaLeadPage.waitForURL(/\/jobs\//, { timeout: 10_000 });
    await expect(gaLeadPage.locator('text=/JOB-/')).toBeVisible({ timeout: 5_000 });
  });

  test('Test 12: Cancel a job', async ({ gaLeadPage }) => {
    // Create a job first
    const form = new JobNewPage(gaLeadPage);
    await form.goto();
    await form.fillTitle('E2E Test Job — To be cancelled');
    await form.fillDescription('E2E test: This job will be cancelled to test the cancellation flow.');
    await form.selectLocation('Branch A');
    await form.selectCategory('Plumbing');
    await form.submit();
    await gaLeadPage.waitForURL(/\/jobs\//, { timeout: 10_000 });

    // Cancel the job
    const detail = new JobDetailPage(gaLeadPage);
    await detail.clickCancelJob();
    await detail.confirmAction();

    await detail.feedback.expectSuccess(/cancelled|success/i);
    await expect(gaLeadPage.locator('text=/cancelled/i')).toBeVisible();
  });
});

/**
 * Quick-14: Unified Job Modal — E2E Tests
 *
 * Tests the unified JobModal component that handles both create and view modes.
 * Create mode: 700px dialog with form only, closes on success.
 * View mode: 800px dialog with form left, timeline right, sticky action bar.
 */
import { test, expect } from '../../fixtures';
import { JobModalPage } from '../../pages/jobs/job-modal.page';
import { JobListPage } from '../../pages/jobs/job-list.page';

test.describe('Quick-14: Unified Job Modal', () => {
  test('Create job via modal dialog', async ({ gaLeadPage }) => {
    const list = new JobListPage(gaLeadPage);
    const modal = new JobModalPage(gaLeadPage);

    await list.goto();
    await modal.openCreateDialog();

    // Fill form inside modal
    await modal.fillTitle('E2E Modal Test — Quick-14 create');
    await modal.fillDescription('Testing job creation via the unified modal dialog.');
    await modal.selectLocation('Head Office');
    await modal.selectCategory('Electrical');

    await modal.submitCreate();

    // Modal should close after successful creation
    await modal.expectDialogClosed();
  });

  test('View job modal shows timeline panel', async ({ gaLeadPage }) => {
    const list = new JobListPage(gaLeadPage);
    const modal = new JobModalPage(gaLeadPage);

    await list.goto();
    await modal.openViewModal(0);

    // Should show job display ID in header
    await modal.expectJobDisplayId(/J\d{2}-\d{4}/);

    // Should show timeline panel on the right
    await modal.expectTimelinePanel();
  });

  test('View job modal shows sticky action bar', async ({ gaLeadPage }) => {
    const list = new JobListPage(gaLeadPage);
    const modal = new JobModalPage(gaLeadPage);

    await list.goto();
    await modal.openViewModal(0);

    // Should show sticky action bar at bottom
    await modal.expectStickyActionBar();
  });

  test('View job modal form is editable for GA Lead on non-terminal jobs', async ({ gaLeadPage }) => {
    const list = new JobListPage(gaLeadPage);
    const modal = new JobModalPage(gaLeadPage);

    await list.goto();

    // Filter to non-terminal jobs (e.g. Created or Assigned)
    await list.filterByStatus('Created');
    await modal.openViewModal(0);

    // Form should be editable (not read-only)
    await modal.expectFormEditable();
  });
});

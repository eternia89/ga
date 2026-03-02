import { Page, expect } from '@playwright/test';
import { DataTablePage } from '../shared/data-table.page';

export class ApprovalsPage {
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.table = new DataTablePage(page);
  }

  async goto() {
    await this.page.goto('/approvals');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'Approval' })).toBeVisible();
  }

  async togglePendingOnly() {
    await this.page.getByLabel(/pending only/i).click();
  }

  async expectApprovalInList(jobId: string | RegExp) {
    await this.table.expectRowContaining(jobId);
  }

  async expectEmpty() {
    await expect(
      this.page.locator('text=/no jobs|no approval/i')
    ).toBeVisible();
  }

  async clickApproval(jobId: string | RegExp) {
    await this.table.clickRow(jobId);
  }
}

import { Page, expect } from '@playwright/test';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class ScheduleDetailPage {
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto(id: string) {
    await this.page.goto(`/maintenance/schedules/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectStatusBadge(status: string | RegExp) {
    await expect(this.page.locator('.badge, [class*="badge"]').first()).toContainText(status);
  }

  async expectInfo(text: string | RegExp) {
    await expect(this.page.locator('text=' + text)).toBeVisible();
  }

  async expectNextDue(pattern?: RegExp) {
    await expect(this.page.locator('text=/next due/i')).toBeVisible();
    if (pattern) {
      await expect(this.page.locator('text=/\\d{2}-\\d{2}-\\d{4}/')).toBeVisible();
    }
  }

  async expectOverdueLabel() {
    await expect(this.page.locator('text=/overdue/i')).toBeVisible();
  }

  async expectLinkedPMJobs() {
    await expect(this.page.locator('text=/linked.*job|pm.*job/i')).toBeVisible();
  }

  async expectAutoPauseNotice() {
    await expect(this.page.locator('text=/auto.*pause|asset.*status/i')).toBeVisible();
  }

  async clickActivate() {
    await this.page.getByRole('button', { name: /activate/i }).click();
  }

  async clickDeactivate() {
    await this.page.getByRole('button', { name: /deactivate/i }).click();
  }

  async clickDelete() {
    await this.page.getByRole('button', { name: /delete/i }).click();
  }

  async confirmDelete() {
    // Inline confirmation panel
    await this.page.getByRole('button', { name: /confirm|yes|delete/i }).last().click();
  }

  async clickEditInterval() {
    await this.page.getByRole('button', { name: /edit/i }).click();
  }

  async editIntervalDays(days: string) {
    await this.page.getByLabel(/interval/i).clear();
    await this.page.getByLabel(/interval/i).fill(days);
  }

  async saveEdit() {
    await this.page.getByRole('button', { name: /save|update/i }).click();
  }
}

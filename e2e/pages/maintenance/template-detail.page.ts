import { Page, expect } from '@playwright/test';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class TemplateDetailPage {
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto(id: string) {
    await this.page.goto(`/maintenance/templates/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectStatusBadge(status: string | RegExp) {
    await expect(this.page.locator('.badge, [class*="badge"]').first()).toContainText(status);
  }

  async expectTemplateName(name: string | RegExp) {
    await expect(this.page.locator('text=' + name)).toBeVisible();
  }

  async expectChecklistItems() {
    // Should show at least one checklist item with a type badge
    await expect(this.page.locator('text=/checkbox|pass.fail|numeric|text|photo|dropdown/i').first()).toBeVisible();
  }

  async expectItemCount(pattern: string | RegExp) {
    await expect(this.page.locator('text=' + pattern)).toBeVisible();
  }

  async clickEdit() {
    await this.page.getByRole('button', { name: /edit/i }).click();
  }

  async saveEdit() {
    await this.page.getByRole('button', { name: /save|update/i }).click();
  }

  async clickDeactivate() {
    await this.page.getByRole('button', { name: /deactivate/i }).click();
  }

  async clickReactivate() {
    await this.page.getByRole('button', { name: /reactivate/i }).click();
  }

  async expectDeactivateError(pattern?: string | RegExp) {
    await this.feedback.expectError(pattern);
  }
}

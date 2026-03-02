import { Page, expect } from '@playwright/test';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class CompanySettingsPage {
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto() {
    await this.page.goto('/admin/company-settings');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: /company settings/i })).toBeVisible();
  }

  async fillBudgetThreshold(amount: string) {
    const input = this.page.getByLabel(/budget.*threshold/i);
    await input.clear();
    await input.fill(amount);
  }

  async save() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }

  async expectThresholdValue(pattern: string | RegExp) {
    await expect(this.page.getByLabel(/budget.*threshold/i)).toHaveValue(pattern);
  }
}

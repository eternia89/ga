import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class JobDetailPage {
  readonly combobox: ComboboxHelper;
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto(id: string) {
    await this.page.goto(`/jobs/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectJobId(pattern: string | RegExp) {
    await expect(this.page.locator('text=/JOB-/')).toContainText(pattern);
  }

  async expectStatus(status: string | RegExp) {
    await expect(this.page.locator('.badge, [class*="badge"]').first()).toContainText(status);
  }

  async expectTimeline() {
    await expect(this.page.locator('text=/Activity Timeline/i')).toBeVisible();
  }

  // Status transitions
  async clickStartWork() {
    await this.page.getByRole('button', { name: /start/i }).click();
  }

  async clickSubmitForApproval() {
    await this.page.getByRole('button', { name: /submit.*approval/i }).click();
  }

  async clickMarkComplete() {
    await this.page.getByRole('button', { name: /mark.*complete|complete/i }).click();
  }

  async clickCancelJob() {
    await this.page.getByRole('button', { name: /cancel/i }).click();
  }

  async confirmAction() {
    const dialog = this.page.locator('[role="dialog"], [role="alertdialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /confirm|yes|ok/i }).click();
  }

  // Comments
  async addComment(text: string) {
    await this.page.getByPlaceholder(/comment|message/i).fill(text);
    await this.page.getByRole('button', { name: /send|post|add comment/i }).click();
  }

  async expectComment(text: string | RegExp) {
    await expect(this.page.locator('text=' + text)).toBeVisible();
  }

  // Inline editing
  async editTitle(text: string) {
    const title = this.page.getByLabel(/title/i);
    await title.clear();
    await title.fill(text);
  }

  async editEstimatedCost(amount: string) {
    const costField = this.page.getByLabel(/estimated cost/i);
    await costField.clear();
    await costField.fill(amount);
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }

  // Linked requests
  async expectLinkedRequests() {
    await expect(this.page.locator('text=/Linked Request/i')).toBeVisible();
  }
}

import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class RequestDetailPage {
  readonly combobox: ComboboxHelper;
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto(id: string) {
    await this.page.goto(`/requests/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectRequestId(pattern: string | RegExp) {
    await expect(this.page.locator('text=/REQ-/')).toContainText(pattern);
  }

  async expectStatus(status: string | RegExp) {
    await expect(this.page.locator('.badge, [class*="badge"]').first()).toContainText(status);
  }

  async expectTimeline() {
    await expect(this.page.locator('text=/Activity Timeline/i')).toBeVisible();
  }

  async expectTimelineEvent(text: string | RegExp) {
    await expect(this.page.locator('text=' + text)).toBeVisible();
  }

  // Triage actions
  async clickTriage() {
    await this.page.getByRole('button', { name: /triage/i }).click();
  }

  async triageRequest(category: string, priority: string, assignee: string) {
    const dialog = this.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Select category
    const catTrigger = dialog.locator('[role="combobox"]').first();
    await this.combobox.selectOption(catTrigger, category, category);

    // Select priority
    await dialog.getByLabel(/priority/i).click();
    await this.page.getByRole('option', { name: priority }).click();

    // Select assignee (PIC)
    const assigneeTrigger = dialog.locator('[role="combobox"]').last();
    await this.combobox.selectOption(assigneeTrigger, assignee, assignee);

    await dialog.getByRole('button', { name: /confirm|save|triage/i }).click();
  }

  // Reject
  async clickReject() {
    await this.page.getByRole('button', { name: /reject/i }).click();
  }

  async rejectWithReason(reason: string) {
    const dialog = this.page.locator('[role="dialog"], [role="alertdialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/reason/i).fill(reason);
    await dialog.getByRole('button', { name: /reject|confirm/i }).click();
  }

  // Cancel
  async clickCancel() {
    await this.page.getByRole('button', { name: /cancel/i }).click();
  }

  async confirmCancel() {
    const dialog = this.page.locator('[role="dialog"], [role="alertdialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /confirm|yes|cancel request/i }).click();
  }

  // Inline editing
  async editDescription(text: string) {
    const desc = this.page.getByLabel(/description/i);
    await desc.clear();
    await desc.fill(text);
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }

  // Photos
  async expectPhotos() {
    await expect(this.page.locator('img').first()).toBeVisible();
  }

  async clickPhoto() {
    await this.page.locator('img').first().click();
  }

  async expectLightbox() {
    // Lightbox typically uses a dialog or overlay
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
  }
}

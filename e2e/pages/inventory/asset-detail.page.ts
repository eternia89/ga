import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class AssetDetailPage {
  readonly combobox: ComboboxHelper;
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto(id: string) {
    await this.page.goto(`/inventory/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectAssetId(pattern: string | RegExp) {
    await expect(this.page.locator('text=/AST-/')).toContainText(pattern);
  }

  async expectStatus(status: string | RegExp) {
    await expect(this.page.locator('.badge, [class*="badge"]').first()).toContainText(status);
  }

  async expectTimeline() {
    await expect(this.page.locator('text=/Activity Timeline/i')).toBeVisible();
  }

  // Status change
  async clickChangeStatus() {
    await this.page.getByRole('button', { name: /status|change/i }).click();
  }

  async changeStatus(newStatus: string) {
    const dialog = this.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').click();
    await this.page.getByRole('option', { name: newStatus }).click();
    await dialog.getByRole('button', { name: /confirm|save/i }).click();
  }

  // Transfer
  async clickTransfer() {
    await this.page.getByRole('button', { name: /transfer/i }).click();
  }

  async initiateTransfer(location: string, receiver: string) {
    const dialog = this.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    // Select destination location
    const locTrigger = dialog.locator('[role="combobox"]').first();
    await this.combobox.selectOption(locTrigger, location, location);
    // Select receiver
    const recTrigger = dialog.locator('[role="combobox"]').last();
    await this.combobox.selectOption(recTrigger, receiver, receiver);
    await dialog.getByRole('button', { name: /transfer|confirm|submit/i }).click();
  }

  async acceptTransfer() {
    await this.page.getByRole('button', { name: /accept/i }).click();
  }

  async rejectTransfer() {
    await this.page.getByRole('button', { name: /reject/i }).click();
  }

  async cancelTransfer() {
    await this.page.getByRole('button', { name: /cancel.*transfer/i }).click();
  }

  async expectPendingTransfer() {
    await expect(this.page.locator('text=/pending|in transit/i')).toBeVisible();
  }

  // Inline editing
  async editName(text: string) {
    const nameField = this.page.getByLabel(/^name/i);
    await nameField.clear();
    await nameField.fill(text);
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }
}

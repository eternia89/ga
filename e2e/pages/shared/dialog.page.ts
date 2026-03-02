import { Page, Locator, expect } from '@playwright/test';

export class DialogHelper {
  constructor(private page: Page) {}

  get dialog(): Locator {
    return this.page.locator('[role="dialog"]').first();
  }

  get alertDialog(): Locator {
    return this.page.locator('[role="alertdialog"]').first();
  }

  async expectOpen(titleText?: string | RegExp) {
    await expect(this.dialog).toBeVisible({ timeout: 5_000 });
    if (titleText) {
      await expect(this.dialog.getByRole('heading').first()).toContainText(titleText);
    }
  }

  async expectAlertOpen(titleText?: string | RegExp) {
    await expect(this.alertDialog).toBeVisible({ timeout: 5_000 });
    if (titleText) {
      await expect(this.alertDialog.getByRole('heading').first()).toContainText(titleText);
    }
  }

  async expectClosed() {
    await expect(this.dialog).not.toBeVisible();
  }

  async fillField(label: string, value: string) {
    await this.dialog.getByLabel(label).fill(value);
  }

  async clickButton(name: string | RegExp) {
    await this.dialog.getByRole('button', { name }).click();
  }

  async confirm() {
    // Common confirm button names
    const confirmBtn = this.dialog.getByRole('button', { name: /save|create|confirm|submit|ok/i }).first();
    await confirmBtn.click();
  }

  async cancel() {
    await this.dialog.getByRole('button', { name: /cancel/i }).click();
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }
}

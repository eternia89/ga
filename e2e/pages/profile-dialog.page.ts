import { Page, expect } from '@playwright/test';

export class ProfileDialogPage {
  private sheet = this.page.locator('[role="dialog"]');

  constructor(private page: Page) {}

  async expectOpen() {
    await expect(this.sheet).toBeVisible({ timeout: 5_000 });
  }

  async expectClosed() {
    await expect(this.sheet).not.toBeVisible();
  }

  async expectUserInfo(name: string | RegExp) {
    await expect(this.sheet).toContainText(name);
  }

  async fillPasswordChange(current: string, newPass: string, confirm: string) {
    await this.sheet.getByLabel('Current Password').fill(current);
    await this.sheet.getByLabel('New Password', { exact: true }).fill(newPass);
    await this.sheet.getByLabel('Confirm Password').fill(confirm);
  }

  async submitPasswordChange() {
    await this.sheet.getByRole('button', { name: /change password/i }).click();
  }

  async expectError(text: string | RegExp) {
    const error = this.sheet.locator('.bg-red-50, .text-red-700, .text-destructive').first();
    await expect(error).toContainText(text);
  }

  async expectSuccess(text: string | RegExp) {
    const success = this.sheet.locator('.bg-green-50, .text-green-700').first();
    await expect(success).toContainText(text);
  }

  async close() {
    // Click the X button or press Escape
    await this.page.keyboard.press('Escape');
  }
}

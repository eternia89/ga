import { Page, expect } from '@playwright/test';

export class DeleteConfirmDialogPage {
  private dialog = this.page.locator('[role="alertdialog"]');

  constructor(private page: Page) {}

  async expectOpen() {
    await expect(this.dialog).toBeVisible({ timeout: 5_000 });
  }

  async expectDependencyBlock(text?: string | RegExp) {
    const block = this.dialog.locator('.text-destructive').first();
    await expect(block).toBeVisible();
    if (text) {
      await expect(block).toContainText(text);
    }
  }

  async typeConfirmation(entityName: string) {
    await this.dialog.locator('#confirm-text').fill(entityName);
  }

  async confirm() {
    await this.dialog.getByRole('button', { name: 'Delete' }).click();
  }

  async cancel() {
    await this.dialog.getByRole('button', { name: 'Cancel' }).click();
  }

  async expectDeleteDisabled() {
    await expect(
      this.dialog.getByRole('button', { name: 'Delete' })
    ).toBeDisabled();
  }

  async expectDeleteEnabled() {
    await expect(
      this.dialog.getByRole('button', { name: 'Delete' })
    ).toBeEnabled();
  }
}

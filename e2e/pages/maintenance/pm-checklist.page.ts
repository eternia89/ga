import { Page, expect } from '@playwright/test';

export class PMChecklistPage {
  constructor(private page: Page) {}

  async expectVisible() {
    await expect(this.page.locator('text=/checklist|pm checklist/i')).toBeVisible();
  }

  async expectProgressBar() {
    // Progress bar showing X/Y items
    await expect(this.page.locator('text=/\\d+.*\\/.*\\d+/').or(
      this.page.locator('[role="progressbar"]')
    )).toBeVisible();
  }

  async toggleCheckbox(index: number = 0) {
    const checkboxes = this.page.locator('input[type="checkbox"]');
    await checkboxes.nth(index).click();
  }

  async clickPassFail(choice: 'Pass' | 'Fail', index: number = 0) {
    const buttons = this.page.getByRole('button', { name: choice });
    await buttons.nth(index).click();
  }

  async fillNumeric(value: string, index: number = 0) {
    const numericInputs = this.page.locator('input[type="number"]');
    await numericInputs.nth(index).fill(value);
    // Debounced save — wait for it
    await this.page.waitForTimeout(700);
  }

  async fillText(value: string, index: number = 0) {
    const textareas = this.page.locator('textarea');
    await textareas.nth(index).fill(value);
    // Debounced save
    await this.page.waitForTimeout(700);
  }

  async selectDropdown(option: string, index: number = 0) {
    const selects = this.page.locator('select');
    if (await selects.nth(index).isVisible()) {
      await selects.nth(index).selectOption({ label: option });
    }
  }

  async expectCompleteButton() {
    await expect(
      this.page.getByRole('button', { name: /complete.*checklist/i })
    ).toBeVisible();
  }

  async clickComplete() {
    await this.page.getByRole('button', { name: /complete.*checklist/i }).click();
  }

  async expectCompletedState() {
    // Should show completion timestamp or success state
    await expect(this.page.locator('text=/completed|all.*complete/i')).toBeVisible();
  }

  async expectReadOnly() {
    // Inputs should be disabled
    const checkboxes = this.page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      await expect(checkboxes.first()).toBeDisabled();
    }
  }
}

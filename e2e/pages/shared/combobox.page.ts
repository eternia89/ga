import { Page, Locator, expect } from '@playwright/test';

export class ComboboxHelper {
  constructor(private page: Page) {}

  /**
   * Open a combobox, search, and select an option.
   * @param trigger - The combobox trigger locator (role="combobox")
   * @param searchText - Text to type in the search input
   * @param optionText - Text of the option to select
   */
  async selectOption(trigger: Locator, searchText: string, optionText: string | RegExp) {
    await trigger.click();
    // Wait for popover to open
    const input = this.page.locator('[cmdk-input]');
    await expect(input).toBeVisible({ timeout: 3_000 });
    await input.fill(searchText);
    await this.page.waitForTimeout(200);
    // Click the matching option
    const option = this.page.locator('[cmdk-item]').filter({ hasText: optionText }).first();
    await expect(option).toBeVisible();
    await option.click();
  }

  /**
   * Open the first combobox on the page and select an option.
   */
  async selectFirst(searchText: string, optionText: string | RegExp) {
    const trigger = this.page.locator('[role="combobox"]').first();
    await this.selectOption(trigger, searchText, optionText);
  }

  /**
   * Assert the currently selected value of a combobox trigger.
   */
  async expectSelected(trigger: Locator, text: string | RegExp) {
    await expect(trigger).toContainText(text);
  }

  /**
   * Find a combobox by its label text.
   */
  findByLabel(labelText: string): Locator {
    // Find the label, then the adjacent combobox
    return this.page
      .locator(`label:has-text("${labelText}")`)
      .locator('..')
      .locator('[role="combobox"]');
  }
}

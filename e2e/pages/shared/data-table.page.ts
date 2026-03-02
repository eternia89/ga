import { Page, Locator, expect } from '@playwright/test';

export class DataTablePage {
  private container: Locator;

  constructor(private page: Page, scope?: Locator) {
    this.container = scope || page.locator('main');
  }

  get searchInput() {
    return this.container.locator('input[placeholder="Search..."]').first();
  }

  get table() {
    return this.container.locator('table').first();
  }

  get rows() {
    return this.container.locator('tbody tr');
  }

  get headerCells() {
    return this.container.locator('thead th');
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    // Wait for debounced search
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async expectRowCount(count: number) {
    await expect(this.rows).toHaveCount(count);
  }

  async expectRowContaining(text: string | RegExp) {
    await expect(this.rows.filter({ hasText: text }).first()).toBeVisible();
  }

  async expectNoRows() {
    // Either no rows or a "No results" message
    const rowCount = await this.rows.count();
    if (rowCount > 0) {
      // Some tables show a single row with "No results" text
      await expect(this.rows.first()).toContainText(/no results/i);
    }
  }

  async clickRow(text: string | RegExp) {
    await this.rows.filter({ hasText: text }).first().click();
  }

  async clickSortHeader(columnName: string) {
    const header = this.container
      .locator('thead button', { hasText: columnName })
      .first();
    await header.click();
    await this.page.waitForTimeout(300);
  }

  async expectSortedAsc(columnName: string) {
    const header = this.container
      .locator('thead th', { hasText: columnName })
      .first();
    // Check for ascending sort icon
    await expect(header.locator('svg')).toBeVisible();
  }

  // Pagination
  async goToNextPage() {
    await this.container.getByRole('button', { name: 'Next' }).click();
    await this.page.waitForTimeout(300);
  }

  async goToPreviousPage() {
    await this.container.getByRole('button', { name: 'Previous' }).click();
    await this.page.waitForTimeout(300);
  }

  async expectPageInfo(pattern: RegExp) {
    await expect(this.container.locator('text=/Page \\d+ of \\d+/')).toContainText(pattern);
  }

  async setRowsPerPage(count: string) {
    // Find the rows-per-page select
    const select = this.container.locator('select').first();
    if (await select.isVisible()) {
      await select.selectOption(count);
      await this.page.waitForTimeout(300);
    }
  }

  async getColumnTexts(columnIndex: number): Promise<string[]> {
    const cells = this.rows.locator(`td:nth-child(${columnIndex + 1})`);
    return cells.allTextContents();
  }
}

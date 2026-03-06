import { Page, expect, Locator } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class JobModalPage {
  readonly combobox: ComboboxHelper;
  readonly feedback: InlineFeedbackPage;
  readonly dialog: Locator;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
    this.feedback = new InlineFeedbackPage(page);
    this.dialog = page.locator('[role="dialog"]').first();
  }

  /** Open the "New Job" create dialog from the jobs list page */
  async openCreateDialog() {
    await this.page.getByRole('button', { name: /new job/i }).click();
    await expect(this.dialog).toBeVisible();
  }

  /** Click a "View" button on a table row to open the view modal */
  async openViewModal(rowIndex = 0) {
    const viewButtons = this.page.getByRole('button', { name: /view/i });
    await viewButtons.nth(rowIndex).click();
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogClosed() {
    await expect(this.dialog).not.toBeVisible();
  }

  // Create mode form helpers
  async fillTitle(text: string) {
    await this.dialog.getByLabel(/title/i).fill(text);
  }

  async fillDescription(text: string) {
    await this.dialog.getByLabel(/description/i).fill(text);
  }

  async selectLocation(name: string) {
    const trigger = this.combobox.findByLabel('Location');
    await this.combobox.selectOption(trigger, name, name);
  }

  async selectCategory(name: string) {
    const trigger = this.combobox.findByLabel('Category');
    await this.combobox.selectOption(trigger, name, name);
  }

  async selectPriority(priority: string) {
    await this.dialog.getByLabel(/priority/i).click();
    await this.page.getByRole('option', { name: priority }).click();
  }

  async submitCreate() {
    await this.dialog.getByRole('button', { name: /create job/i }).click();
  }

  // View mode assertions
  async expectTimelinePanel() {
    await expect(this.dialog.locator('text=/Timeline/i')).toBeVisible();
  }

  async expectStickyActionBar() {
    // The sticky bar is a border-t div at the bottom of the dialog
    await expect(this.dialog.locator('.border-t.bg-background').last()).toBeVisible();
  }

  async expectJobDisplayId(pattern: string | RegExp) {
    await expect(this.dialog.locator('h2').first()).toContainText(pattern);
  }

  async expectFormEditable() {
    const titleInput = this.dialog.getByLabel(/title/i);
    await expect(titleInput).toBeEnabled();
  }

  async expectFormReadOnly() {
    const titleInput = this.dialog.getByLabel(/title/i);
    await expect(titleInput).toBeDisabled();
  }

  async editTitle(text: string) {
    const titleInput = this.dialog.getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill(text);
  }

  async saveChanges() {
    await this.dialog.getByRole('button', { name: /save changes/i }).click();
  }

  async close() {
    // Click close button (X) in dialog
    await this.dialog.getByRole('button', { name: /close/i }).click();
  }
}

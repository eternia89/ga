import { Page, expect } from '@playwright/test';
import { DialogHelper } from '../shared/dialog.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';
import { DataTablePage } from '../shared/data-table.page';
import { ComboboxHelper } from '../shared/combobox.page';

export class UserTabPage {
  readonly dialog: DialogHelper;
  readonly feedback: InlineFeedbackPage;
  readonly table: DataTablePage;
  readonly combobox: ComboboxHelper;

  constructor(private page: Page) {
    this.dialog = new DialogHelper(page);
    this.feedback = new InlineFeedbackPage(page);
    this.table = new DataTablePage(page);
    this.combobox = new ComboboxHelper(page);
  }

  async clickNew() {
    await this.page.getByRole('button', { name: /new user/i }).click();
  }

  async createUser(email: string, fullName: string, role: string, company?: string) {
    await this.clickNew();
    await this.dialog.expectOpen();
    await this.dialog.fillField('Email', email);
    await this.dialog.fillField('Full Name', fullName);
    // Select role
    await this.dialog.dialog.getByLabel(/role/i).click();
    await this.page.getByRole('option', { name: role }).click();
    if (company) {
      const trigger = this.dialog.dialog.locator('[role="combobox"]').first();
      await this.combobox.selectOption(trigger, company, company);
    }
    await this.dialog.confirm();
  }

  async editUser(email: string) {
    await this.table.rows.filter({ hasText: email }).getByRole('button', { name: /edit/i }).click();
  }

  async deactivateUser(email: string) {
    await this.table.rows.filter({ hasText: email }).getByRole('button', { name: /deactivate/i }).click();
  }

  async reactivateUser(email: string) {
    await this.table.rows.filter({ hasText: email }).getByRole('button', { name: /reactivate|restore/i }).click();
  }

  async expectUserInTable(email: string | RegExp) {
    await this.table.expectRowContaining(email);
  }

  async expectUserNotInTable(email: string | RegExp) {
    const filterText = typeof email === 'string' ? email : email;
    const rows = this.table.rows.filter({ hasText: filterText });
    await expect(rows).toHaveCount(0);
  }
}

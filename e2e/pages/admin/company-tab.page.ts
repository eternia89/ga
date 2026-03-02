import { Page, expect } from '@playwright/test';
import { DialogHelper } from '../shared/dialog.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';
import { DataTablePage } from '../shared/data-table.page';

export class CompanyTabPage {
  readonly dialog: DialogHelper;
  readonly feedback: InlineFeedbackPage;
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.dialog = new DialogHelper(page);
    this.feedback = new InlineFeedbackPage(page);
    this.table = new DataTablePage(page);
  }

  async clickNew() {
    await this.page.getByRole('button', { name: /new company/i }).click();
  }

  async createCompany(name: string) {
    await this.clickNew();
    await this.dialog.expectOpen();
    await this.dialog.fillField('Name', name);
    await this.dialog.confirm();
  }

  async editCompany(currentName: string, newName: string) {
    // Click edit button on the row
    await this.table.rows.filter({ hasText: currentName }).getByRole('button', { name: /edit/i }).click();
    await this.dialog.expectOpen();
    await this.dialog.fillField('Name', newName);
    await this.dialog.confirm();
  }

  async expectCompanyInTable(name: string) {
    await this.table.expectRowContaining(name);
  }
}

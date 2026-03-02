import { Page, expect } from '@playwright/test';
import { DialogHelper } from '../shared/dialog.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';
import { DataTablePage } from '../shared/data-table.page';
import { ComboboxHelper } from '../shared/combobox.page';

export class DivisionTabPage {
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
    await this.page.getByRole('button', { name: /new division/i }).click();
  }

  async createDivision(name: string, company?: string) {
    await this.clickNew();
    await this.dialog.expectOpen();
    await this.dialog.fillField('Name', name);
    if (company) {
      // Select company in dialog combobox
      const trigger = this.dialog.dialog.locator('[role="combobox"]').first();
      await this.combobox.selectOption(trigger, company, company);
    }
    await this.dialog.confirm();
  }

  async expectDivisionInTable(name: string) {
    await this.table.expectRowContaining(name);
  }
}

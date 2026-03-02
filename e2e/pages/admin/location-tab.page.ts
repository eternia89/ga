import { Page } from '@playwright/test';
import { DialogHelper } from '../shared/dialog.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';
import { DataTablePage } from '../shared/data-table.page';
import { ComboboxHelper } from '../shared/combobox.page';

export class LocationTabPage {
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
    await this.page.getByRole('button', { name: /new location/i }).click();
  }

  async createLocation(name: string, address?: string, company?: string) {
    await this.clickNew();
    await this.dialog.expectOpen();
    await this.dialog.fillField('Name', name);
    if (address) {
      await this.dialog.fillField('Address', address);
    }
    if (company) {
      const trigger = this.dialog.dialog.locator('[role="combobox"]').first();
      await this.combobox.selectOption(trigger, company, company);
    }
    await this.dialog.confirm();
  }

  async expectLocationInTable(name: string) {
    await this.table.expectRowContaining(name);
  }
}

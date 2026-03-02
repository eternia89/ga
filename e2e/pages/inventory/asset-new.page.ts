import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';

export class AssetNewPage {
  readonly combobox: ComboboxHelper;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
  }

  async goto() {
    await this.page.goto('/inventory/new');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'New Asset' })).toBeVisible();
  }

  async fillName(text: string) {
    await this.page.getByLabel(/^name/i).fill(text);
  }

  async selectCategory(name: string) {
    const trigger = this.combobox.findByLabel('Category');
    await this.combobox.selectOption(trigger, name, name);
  }

  async selectLocation(name: string) {
    const trigger = this.combobox.findByLabel('Location');
    await this.combobox.selectOption(trigger, name, name);
  }

  async fillBrand(text: string) {
    await this.page.getByLabel(/brand/i).fill(text);
  }

  async fillModel(text: string) {
    await this.page.getByLabel(/model/i).fill(text);
  }

  async fillSerialNumber(text: string) {
    await this.page.getByLabel(/serial/i).fill(text);
  }

  async fillDescription(text: string) {
    await this.page.getByLabel(/description/i).fill(text);
  }

  async fillAcquisitionDate(date: string) {
    // Date picker input
    await this.page.getByLabel(/acquisition date/i).fill(date);
  }

  async uploadConditionPhoto() {
    const fileInput = this.page.locator('input[type="file"]').first();
    const buffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);
    await fileInput.setInputFiles({
      name: `condition-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      buffer,
    });
    await this.page.waitForTimeout(1_000);
  }

  async uploadInvoice() {
    // Invoice file input (second file input or labeled)
    const fileInputs = this.page.locator('input[type="file"]');
    const invoiceInput = fileInputs.last();
    const buffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);
    await invoiceInput.setInputFiles({
      name: `invoice-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      buffer,
    });
    await this.page.waitForTimeout(1_000);
  }

  async submit() {
    await this.page.getByRole('button', { name: /create asset/i }).click();
  }
}

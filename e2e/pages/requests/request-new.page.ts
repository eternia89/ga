import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';

export class RequestNewPage {
  readonly combobox: ComboboxHelper;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
  }

  async goto() {
    await this.page.goto('/requests/new');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'New Request' })).toBeVisible();
  }

  async fillDescription(text: string) {
    await this.page.getByLabel(/description/i).fill(text);
  }

  async selectLocation(name: string) {
    const trigger = this.combobox.findByLabel('Location');
    await this.combobox.selectOption(trigger, name, name);
  }

  async uploadPhoto() {
    const fileInput = this.page.locator('input[type="file"]').first();
    const buffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);
    await fileInput.setInputFiles({
      name: `test-photo-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      buffer,
    });
    await this.page.waitForTimeout(1_000);
  }

  async submit() {
    await this.page.getByRole('button', { name: /submit request/i }).click();
  }

  async expectSubmitEnabled() {
    await expect(this.page.getByRole('button', { name: /submit request/i })).toBeEnabled();
  }
}

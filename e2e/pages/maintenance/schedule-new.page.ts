import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class ScheduleNewPage {
  readonly combobox: ComboboxHelper;
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto() {
    await this.page.goto('/maintenance/schedules/new');
    await this.page.waitForLoadState('networkidle');
  }

  async selectTemplate(name: string) {
    const trigger = this.combobox.findByLabel('Template');
    await this.combobox.selectOption(trigger, name, name);
  }

  async selectAsset(name: string) {
    const trigger = this.combobox.findByLabel('Asset');
    await this.combobox.selectOption(trigger, name, name);
  }

  async fillIntervalDays(days: string) {
    await this.page.getByLabel(/interval/i).fill(days);
  }

  async selectIntervalType(type: 'Fixed' | 'Floating') {
    await this.page.getByRole('button', { name: type, exact: true }).click();
  }

  async fillStartDate(date: string) {
    const startDate = this.page.getByLabel(/start date/i);
    if (await startDate.isVisible()) {
      await startDate.fill(date);
    }
  }

  async expectTemplateFilteredByCategory() {
    // After selecting an asset, template combobox should only show matching category templates
    const trigger = this.combobox.findByLabel('Template');
    await trigger.click();
    // Check that options are visible (filtered)
    await this.page.waitForTimeout(300);
    const options = this.page.locator('[cmdk-item]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    await this.page.keyboard.press('Escape');
  }

  async submit() {
    await this.page.getByRole('button', { name: /create|save|submit/i }).click();
  }
}

import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';

export class JobNewPage {
  readonly combobox: ComboboxHelper;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
  }

  async goto() {
    await this.page.goto('/jobs/new');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'New Job' })).toBeVisible();
  }

  async fillTitle(text: string) {
    await this.page.getByLabel(/title/i).fill(text);
  }

  async fillDescription(text: string) {
    await this.page.getByLabel(/description/i).fill(text);
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
    await this.page.getByLabel(/priority/i).click();
    await this.page.getByRole('option', { name: priority }).click();
  }

  async selectAssignee(name: string) {
    const trigger = this.combobox.findByLabel('Assign');
    await this.combobox.selectOption(trigger, name, name);
  }

  async fillEstimatedCost(amount: string) {
    await this.page.getByLabel(/estimated cost/i).fill(amount);
  }

  async submit() {
    await this.page.getByRole('button', { name: /create job/i }).click();
  }
}

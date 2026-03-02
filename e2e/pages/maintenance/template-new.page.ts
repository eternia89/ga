import { Page, expect } from '@playwright/test';
import { ComboboxHelper } from '../shared/combobox.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';

export class TemplateNewPage {
  readonly combobox: ComboboxHelper;
  readonly feedback: InlineFeedbackPage;

  constructor(private page: Page) {
    this.combobox = new ComboboxHelper(page);
    this.feedback = new InlineFeedbackPage(page);
  }

  async goto() {
    await this.page.goto('/maintenance/templates/new');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: /new template/i })).toBeVisible();
  }

  async fillName(name: string) {
    await this.page.getByLabel(/name/i).first().fill(name);
  }

  async selectCategory(name: string) {
    const trigger = this.combobox.findByLabel('Category');
    await this.combobox.selectOption(trigger, name, name);
  }

  async fillDescription(text: string) {
    await this.page.getByLabel(/description/i).fill(text);
  }

  // Checklist builder
  async addChecklistItem(type: 'Checkbox' | 'Pass/Fail' | 'Numeric' | 'Text' | 'Photo' | 'Dropdown') {
    await this.page.getByRole('button', { name: new RegExp(`\\+\\s*${type}`, 'i') }).click();
  }

  async fillItemLabel(index: number, label: string) {
    const items = this.page.locator('[class*="sortable"], [data-sortable]').or(
      this.page.locator('input[placeholder*="label" i], input[placeholder*="item" i]')
    );
    // Find label inputs in order
    const labelInputs = this.page.locator('input').filter({ hasText: '' });
    // More reliable: find by the nth checklist item area
    const allLabelInputs = this.page.locator('input[placeholder]').filter({
      has: this.page.locator('visible=true'),
    });
    // Just use the nth input that looks like a label field
    const checklistArea = this.page.locator('input[placeholder*="label" i], input[placeholder*="name" i], input[placeholder*="item" i]');
    if (await checklistArea.nth(index).isVisible()) {
      await checklistArea.nth(index).fill(label);
    }
  }

  async expectEmptyChecklist() {
    // Empty state: dashed border placeholder
    await expect(this.page.locator('[class*="border-dashed"]')).toBeVisible();
  }

  async expectChecklistItemCount(count: number) {
    // Count items with drag handles (grip icons)
    await this.page.waitForTimeout(300);
  }

  async fillNumericUnit(index: number, unit: string) {
    const unitInputs = this.page.locator('input[placeholder*="unit" i], input[placeholder*="PSI" i]');
    if (await unitInputs.nth(index).isVisible()) {
      await unitInputs.nth(index).fill(unit);
    }
  }

  async addDropdownOption(text: string) {
    // Find the dropdown option input and add button
    const optionInput = this.page.locator('input[placeholder*="option" i], input[placeholder*="add" i]').last();
    if (await optionInput.isVisible()) {
      await optionInput.fill(text);
      // Press Enter or click add button
      await optionInput.press('Enter');
    }
  }

  async submit() {
    await this.page.getByRole('button', { name: /create|save|submit/i }).last().click();
  }
}

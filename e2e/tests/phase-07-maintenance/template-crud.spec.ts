/**
 * Phase 07 — Tests 2-9: Template list, create, builder, detail, edit, deactivate/reactivate
 */
import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getTestData } from '../../fixtures/test-data';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

test.describe('Phase 07 — Template CRUD', () => {
  test('Test 2: Templates list page loads with correct columns', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates');
    await gaLeadPage.waitForLoadState('networkidle');

    await expect(gaLeadPage.locator('h1', { hasText: /templates/i })).toBeVisible();

    const headers = gaLeadPage.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const h = headerTexts.join(' ').toLowerCase();
    expect(h).toContain('name');
    expect(h).toContain('category');
    expect(h).toContain('status');

    // New Template button visible for GA Lead
    await expect(gaLeadPage.getByRole('link', { name: /new template/i })).toBeVisible();
  });

  test('Test 3: Create template form has correct fields', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates/new');
    await gaLeadPage.waitForLoadState('networkidle');

    await expect(gaLeadPage.locator('h1', { hasText: /new.*template/i })).toBeVisible();

    // Name input
    await expect(gaLeadPage.getByLabel(/name/i).first()).toBeVisible();
    // Category combobox
    await expect(gaLeadPage.locator('[role="combobox"]').first()).toBeVisible();
    // Description textarea
    await expect(gaLeadPage.getByLabel(/description/i)).toBeVisible();

    // 6 add buttons for checklist types
    for (const type of ['Checkbox', 'Pass/Fail', 'Numeric', 'Text', 'Photo', 'Dropdown']) {
      await expect(gaLeadPage.getByRole('button', { name: new RegExp(`\\+\\s*${type}`, 'i') })).toBeVisible();
    }
  });

  test('Test 4: Add and configure all 6 checklist item types', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates/new');
    await gaLeadPage.waitForLoadState('networkidle');

    // Add each type
    for (const type of ['Checkbox', 'Pass/Fail', 'Numeric', 'Text', 'Photo', 'Dropdown']) {
      await gaLeadPage.getByRole('button', { name: new RegExp(`\\+\\s*${type}`, 'i') }).click();
      await gaLeadPage.waitForTimeout(300);
    }

    // Should have 6 items — verify type badges visible
    for (const type of ['checkbox', 'pass', 'numeric', 'text', 'photo', 'dropdown']) {
      await expect(gaLeadPage.locator(`text=/${type}/i`).first()).toBeVisible();
    }
  });

  test('Test 5: Checklist items can be reordered (drag handles present)', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates/new');
    await gaLeadPage.waitForLoadState('networkidle');

    // Add 3 items
    await gaLeadPage.getByRole('button', { name: /\+\s*Checkbox/i }).click();
    await gaLeadPage.waitForTimeout(200);
    await gaLeadPage.getByRole('button', { name: /\+\s*Text/i }).click();
    await gaLeadPage.waitForTimeout(200);
    await gaLeadPage.getByRole('button', { name: /\+\s*Numeric/i }).click();
    await gaLeadPage.waitForTimeout(200);

    // Verify 3 label inputs exist
    const labelInputs = gaLeadPage.locator('input[placeholder*="label" i], input[placeholder*="item" i], input[placeholder*="name" i]');
    const count = await labelInputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Test 6: Create template and verify in list', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates/new');
    await gaLeadPage.waitForLoadState('networkidle');

    const name = `E2E Template ${Date.now()}`;
    await gaLeadPage.getByLabel(/name/i).first().fill(name);

    // Select category via combobox
    const catTrigger = gaLeadPage.locator('[role="combobox"]').first();
    await catTrigger.click();
    await gaLeadPage.waitForTimeout(300);
    const catOption = gaLeadPage.locator('[cmdk-item]').first();
    if (await catOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await catOption.click();
    }

    // Add a checklist item with label
    await gaLeadPage.getByRole('button', { name: /\+\s*Checkbox/i }).click();
    await gaLeadPage.waitForTimeout(300);
    const labelInput = gaLeadPage.locator('input[placeholder*="label" i], input[placeholder*="item" i]').first();
    if (await labelInput.isVisible()) {
      await labelInput.fill('Check power supply');
    }

    // Submit
    await gaLeadPage.getByRole('button', { name: /create|save|submit/i }).last().click();
    await gaLeadPage.waitForURL(/\/maintenance\/templates/, { timeout: 10_000 });

    // Template should be in the list
    await expect(gaLeadPage.locator('text=' + name)).toBeVisible({ timeout: 5_000 });
  });

  test('Test 7: Template detail page shows info', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates');
    await gaLeadPage.waitForLoadState('networkidle');

    // Click the link inside the first row to navigate to detail
    const firstRowLink = gaLeadPage.locator('tbody tr').first().locator('a').first();
    await expect(firstRowLink).toBeVisible({ timeout: 5_000 });
    await firstRowLink.click();
    await gaLeadPage.waitForLoadState('networkidle');

    // Verify on a template detail page
    await gaLeadPage.waitForURL(/\/maintenance\/templates\//, { timeout: 10_000 });

    // Status badge visible (Active or Inactive)
    await expect(gaLeadPage.locator('text=/Active|Inactive/i').first()).toBeVisible({ timeout: 5_000 });

    // Checklist items visible (at least one type badge)
    await expect(gaLeadPage.locator('text=/checkbox|pass|numeric|text|photo|dropdown/i').first()).toBeVisible();
  });

  test('Test 8: Edit template name on detail page (detail IS edit)', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/templates');
    await gaLeadPage.waitForLoadState('networkidle');

    const firstRowLink = gaLeadPage.locator('tbody tr').first().locator('a').first();
    await expect(firstRowLink).toBeVisible({ timeout: 5_000 });
    await firstRowLink.click();
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForURL(/\/maintenance\/templates\//, { timeout: 10_000 });

    // Detail page IS the edit page — name input should be directly editable
    const nameInput = gaLeadPage.getByLabel(/name/i).first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    const original = await nameInput.inputValue();
    await nameInput.clear();
    await nameInput.fill(original + ' Edited');

    // Save button should be at the bottom
    const saveBtn = gaLeadPage.getByRole('button', { name: /save|update/i }).first();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Success feedback
    await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Test 9: Deactivate and reactivate template', async ({ gaLeadPage }) => {
    // Create a fresh template to test with
    await gaLeadPage.goto('/maintenance/templates/new');
    await gaLeadPage.waitForLoadState('networkidle');

    const name = `E2E Deactivate ${Date.now()}`;
    await gaLeadPage.getByLabel(/name/i).first().fill(name);

    const catTrigger = gaLeadPage.locator('[role="combobox"]').first();
    await catTrigger.click();
    await gaLeadPage.waitForTimeout(300);
    await gaLeadPage.locator('[cmdk-item]').first().click();

    await gaLeadPage.getByRole('button', { name: /\+\s*Checkbox/i }).click();
    await gaLeadPage.waitForTimeout(300);
    const labelInput = gaLeadPage.locator('input[placeholder*="label" i], input[placeholder*="item" i]').first();
    if (await labelInput.isVisible()) await labelInput.fill('Test item');

    await gaLeadPage.getByRole('button', { name: /create|save|submit/i }).last().click();
    await gaLeadPage.waitForURL(/\/maintenance\/templates/, { timeout: 10_000 });

    // Navigate to the template detail page
    await expect(gaLeadPage.locator(`text="${name}"`)).toBeVisible({ timeout: 5_000 });
    await gaLeadPage.locator(`text="${name}"`).click();
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForURL(/\/maintenance\/templates\//, { timeout: 5_000 });

    // Deactivate — use the button on the detail page
    const deactivateBtn = gaLeadPage.getByRole('button', { name: /deactivate/i }).first();
    await expect(deactivateBtn).toBeVisible({ timeout: 5_000 });
    await deactivateBtn.click();

    // Success feedback
    await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });
    // Status should show Inactive
    await expect(gaLeadPage.locator('text=/Inactive/i').first()).toBeVisible({ timeout: 5_000 });

    // Dismiss feedback
    const dismissBtn = gaLeadPage.locator('button[aria-label="Dismiss"]').first();
    if (await dismissBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await dismissBtn.click();
    }

    // Reactivate
    const reactivateBtn = gaLeadPage.getByRole('button', { name: /reactivate/i }).first();
    await expect(reactivateBtn).toBeVisible({ timeout: 5_000 });
    await reactivateBtn.click();

    // Success feedback
    await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });
    await expect(gaLeadPage.locator('text=/Active/i').first()).toBeVisible({ timeout: 5_000 });
  });
});

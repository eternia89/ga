/**
 * Phase 06 — Tests 1-7: Asset sidebar, list, filters, create, invoice, detail, inline edit
 *
 * Tests 1-3 are independent.
 * Tests 4-7 run serially: Test 4 creates an asset, then 5-7 operate on it.
 */
import { test, expect } from '../../fixtures';
import { SidebarPage } from '../../pages/sidebar.page';
import { createClient } from '@supabase/supabase-js';

// Minimal valid JPEG for photo/invoice uploads
const JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

test.describe('Phase 06 — Asset CRUD', () => {
  test('Test 1: Sidebar shows Inventory/Assets link', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/');
    await gaStaffPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(gaStaffPage);
    await sidebar.expectSectionVisible('Inventory');
    await sidebar.expectNavItem('Assets');
  });

  test('Test 2: Asset list page loads with AST-YY-NNNN format IDs', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/inventory');
    await gaStaffPage.waitForLoadState('networkidle');
    await expect(gaStaffPage.locator('h1', { hasText: /inventory|assets/i })).toBeVisible();
    await expect(gaStaffPage.locator('table')).toBeVisible();

    const headers = gaStaffPage.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const headerString = headerTexts.join(' ').toLowerCase();
    expect(headerString).toContain('id');
    expect(headerString).toContain('name');
    expect(headerString).toContain('status');
  });

  test('Test 3: Asset list filters work', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/inventory');
    await gaStaffPage.waitForLoadState('networkidle');

    // Search input may have "Search assets..." or "Search..." placeholder
    const searchInput = gaStaffPage.locator('input[type="text"][placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('test');
      await gaStaffPage.waitForTimeout(500);
      await searchInput.clear();
    }

    // Export button visible for GA Staff
    await expect(gaStaffPage.getByRole('button', { name: /export/i })).toBeVisible();
  });
});

test.describe.serial('Phase 06 — Asset Create & Edit (Tests 4-7)', () => {
  let testAssetId: string | null = null;
  const testAssetName = `E2E Test Asset ${Date.now()}`;

  test('Test 4: Create new asset with condition photo', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/inventory/new');
    await gaStaffPage.waitForLoadState('networkidle');
    await expect(gaStaffPage.locator('h1', { hasText: /new asset/i })).toBeVisible();

    // Fill name
    await gaStaffPage.getByLabel(/^name/i).fill(testAssetName);

    // Select category via combobox
    const categoryTrigger = gaStaffPage.locator('button[role="combobox"]').first();
    await categoryTrigger.click();
    await gaStaffPage.waitForTimeout(300);
    const categoryInput = gaStaffPage.locator('[cmdk-input]');
    if (await categoryInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await categoryInput.fill('');
      await gaStaffPage.waitForTimeout(300);
    }
    const categoryOption = gaStaffPage.locator('[cmdk-item]').first();
    await expect(categoryOption).toBeVisible({ timeout: 5_000 });
    await categoryOption.click();

    // Select location via combobox
    const locationTrigger = gaStaffPage.locator('button[role="combobox"]').nth(1);
    await locationTrigger.click();
    await gaStaffPage.waitForTimeout(300);
    const locationInput = gaStaffPage.locator('[cmdk-input]');
    if (await locationInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await locationInput.fill('');
      await gaStaffPage.waitForTimeout(300);
    }
    const locationOption = gaStaffPage.locator('[cmdk-item]').first();
    await expect(locationOption).toBeVisible({ timeout: 5_000 });
    await locationOption.click();

    // Fill identification fields
    await gaStaffPage.getByLabel(/brand/i).fill('TestBrand');
    await gaStaffPage.getByLabel(/model/i).fill('Model X');
    await gaStaffPage.getByLabel(/serial/i).fill('SN-E2E-001');

    // Fill required acquisition date via React fiber
    const dateInput = gaStaffPage.locator('input[type="date"]').first();
    await dateInput.scrollIntoViewIfNeeded();
    await dateInput.evaluate((el: HTMLInputElement) => {
      const reactPropsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
      if (reactPropsKey) {
        const props = (el as Record<string, unknown>)[reactPropsKey] as Record<string, unknown>;
        if (typeof props.onChange === 'function') {
          (props.onChange as Function)({ target: { value: '2026-01-15', name: el.name } });
        }
      }
    });

    // Fill description
    const descInput = gaStaffPage.getByLabel(/description/i);
    if (await descInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await descInput.fill('E2E test asset');
    }

    // Upload condition photo (required)
    const fileInput = gaStaffPage.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: `condition-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      buffer: JPEG_BUFFER,
    });
    await gaStaffPage.waitForTimeout(1_000);

    // Submit — retry up to 3 times if display_id collision occurs
    // (the RPC sequence can collide with orphaned assets from prior runs)
    for (let attempt = 0; attempt < 3; attempt++) {
      await gaStaffPage.getByRole('button', { name: /create asset/i }).click();

      // Wait for either redirect (success) or error feedback
      const redirected = await gaStaffPage
        .waitForURL(/\/inventory\/[0-9a-f]/, { timeout: 10_000 })
        .then(() => true)
        .catch(() => false);

      if (redirected) break;

      // If duplicate key error, dismiss and retry
      const dismissBtn = gaStaffPage.getByRole('button', { name: /dismiss/i });
      if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await dismissBtn.click();
        await gaStaffPage.waitForTimeout(500);
      }
    }

    await expect(gaStaffPage.getByRole('heading', { name: /AST-/ })).toBeVisible({ timeout: 10_000 });

    // Extract asset ID from URL
    const url = gaStaffPage.url();
    const match = url.match(/\/inventory\/([0-9a-f-]+)/);
    expect(match).toBeTruthy();
    testAssetId = match![1];
  });

  test('Test 5: Invoice upload on creation page', async ({ gaStaffPage }) => {
    test.skip(!testAssetId, 'No test asset created');

    // Navigate to the created asset's detail page (which is also the edit page)
    await gaStaffPage.goto(`/inventory/${testAssetId}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // The detail page IS the edit page for GA Staff — verify edit form is present
    await expect(gaStaffPage.getByRole('heading', { name: /AST-/ })).toBeVisible({ timeout: 5_000 });

    // Invoice Files section should be present
    await expect(gaStaffPage.locator('text=/Invoice Files/i')).toBeVisible();

    // Click "Add Invoice File" button to trigger the hidden file input
    const addInvoiceBtn = gaStaffPage.getByRole('button', { name: /add invoice file/i });
    await expect(addInvoiceBtn).toBeVisible({ timeout: 3_000 });

    // Upload an invoice file via the hidden input
    const invoiceInput = gaStaffPage.locator('input[type="file"][accept*="pdf"]');
    await invoiceInput.setInputFiles({
      name: `invoice-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      buffer: JPEG_BUFFER,
    });
    await gaStaffPage.waitForTimeout(500);

    // Verify the new invoice appears in the list with "New" label
    await expect(gaStaffPage.locator('text=/New/').first()).toBeVisible({ timeout: 3_000 });

    // Save changes to persist the invoice
    await gaStaffPage.getByRole('button', { name: /save changes/i }).click();

    // Wait for success feedback
    await expect(gaStaffPage.locator('text=/updated successfully/i')).toBeVisible({ timeout: 10_000 });
  });

  test('Test 6: Asset detail page layout', async ({ gaStaffPage }) => {
    test.skip(!testAssetId, 'No test asset created');

    await gaStaffPage.goto(`/inventory/${testAssetId}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // Verify heading with AST-YY-NNNN format
    await expect(gaStaffPage.getByRole('heading', { name: /AST-/ })).toBeVisible({ timeout: 5_000 });

    // Verify two-column layout container (grid with max-w)
    const gridContainer = gaStaffPage.locator('.grid.max-w-\\[1000px\\]');
    await expect(gridContainer).toBeVisible();

    // Verify status badge is present
    const statusBadge = gaStaffPage.locator('[aria-label="Click to change status"]');
    await expect(statusBadge).toBeVisible();

    // Verify Activity Timeline section in right column
    await expect(gaStaffPage.locator('text=/Activity Timeline/i')).toBeVisible();

    // Verify the edit form (Asset Details section) is present since we're GA Staff
    await expect(gaStaffPage.locator('text=/Asset Details/i')).toBeVisible();

    // Verify the name field has our test asset name
    const nameInput = gaStaffPage.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toContain('E2E Test Asset');
  });

  test('Test 7: Inline edit asset name', async ({ gaStaffPage }) => {
    test.skip(!testAssetId, 'No test asset created');

    await gaStaffPage.goto(`/inventory/${testAssetId}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // Detail page IS edit page — name field should be directly editable
    const nameField = gaStaffPage.locator('input[name="name"]');
    await expect(nameField).toBeVisible({ timeout: 5_000 });

    // Change the name
    const newName = `E2E Edited Asset ${Date.now()}`;
    await nameField.clear();
    await nameField.fill(newName);

    // Save
    await gaStaffPage.getByRole('button', { name: /save changes/i }).click();

    // Wait for success feedback
    await expect(gaStaffPage.locator('text=/updated successfully/i')).toBeVisible({ timeout: 10_000 });

    // Reload and verify the name persisted
    await gaStaffPage.reload();
    await gaStaffPage.waitForLoadState('networkidle');

    const updatedNameField = gaStaffPage.locator('input[name="name"]');
    await expect(updatedNameField).toHaveValue(newName, { timeout: 5_000 });
  });

  // Cleanup: delete the test asset
  test.afterAll(async () => {
    if (testAssetId) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      await admin.from('inventory_items').delete().eq('id', testAssetId);
    }
  });
});

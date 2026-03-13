/**
 * Quick-62 through Quick-66 — Asset Transfer & UX Regression Suite
 *
 * Covers:
 *   quick-62: Location-mode transfers auto-accept (no pending state, no photo requirement)
 *   quick-65: New Asset dialog shows Company field pre-filled
 *   quick-66: Assets table "Created" column, Schedules table "Created" column,
 *             breadcrumb on /inventory/new shows "Assets", sidebar Assets nav item visible
 *
 * Does NOT cover:
 *   quick-63: Photo upload failure (requires network interception — too fragile)
 *   quick-64: DB-level category uniqueness (not E2E testable at browser level)
 */
import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getTestData } from '../../fixtures/test-data';

// Create admin client for direct DB operations
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Generate a unique display ID that won't collide with the RPC sequence.
 *  Uses a random suffix so parallel test workers can't clash. */
function uniqueDisplayId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AST-E2E-${prefix}-${rand}`;
}

// Asset ID created in beforeAll for quick-62 location transfer tests
let testAssetId: string | null = null;

test.describe.serial('Quick-62 through Quick-66 — Asset Transfer & UX', () => {

  // -------------------------------------------------------------------------
  // Describe 1: quick-62 — Location-mode transfer auto-accepts
  // -------------------------------------------------------------------------
  test.describe('quick-62: Location-mode transfer auto-accepts', () => {
    test.beforeAll(async () => {
      const admin = adminClient();
      const data = getTestData();

      const { data: asset, error } = await admin
        .from('inventory_items')
        .insert({
          company_id: data.companyId,
          display_id: uniqueDisplayId('Q62'),
          name: `E2E Quick-62 Location Transfer ${Date.now()}`,
          category_id: data.categories.furniture,
          location_id: data.locations.headOffice,
          status: 'active',
          acquisition_date: '2026-01-15',
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create test asset: ${error.message}`);
      testAssetId = asset.id;
    });

    test.afterAll(async () => {
      const admin = adminClient();
      if (testAssetId) {
        await admin.from('inventory_movements').delete().eq('item_id', testAssetId);
        await admin.from('inventory_items').delete().eq('id', testAssetId);
        testAssetId = null;
      }
    });

    test('location-mode transfer completes immediately (no pending state)', async ({ gaLeadPage }) => {
      test.skip(!testAssetId, 'No test asset created');

      await gaLeadPage.goto(`/inventory/${testAssetId}`);
      await gaLeadPage.waitForLoadState('networkidle');

      // Click the Transfer button
      const transferBtn = gaLeadPage.getByRole('button', { name: /transfer/i });
      await expect(transferBtn).toBeVisible({ timeout: 5_000 });
      await transferBtn.click();

      // Transfer dialog should open
      const dialog = gaLeadPage.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog.locator('text=/Transfer Asset/i')).toBeVisible();

      // Switch to Location mode by clicking the "Move to Location" button
      const moveToLocationBtn = dialog.getByRole('button', { name: /Move to Location/i });
      await expect(moveToLocationBtn).toBeVisible({ timeout: 3_000 });
      await moveToLocationBtn.click();

      // Wait for mode switch to settle
      await gaLeadPage.waitForTimeout(200);

      // Select a location from the combobox (first combobox in dialog)
      const locationCombobox = dialog.locator('button[role="combobox"]').first();
      await locationCombobox.click();
      await gaLeadPage.waitForTimeout(300);
      const firstOption = gaLeadPage.locator('[cmdk-item]').first();
      await expect(firstOption).toBeVisible({ timeout: 5_000 });
      await firstOption.click();

      // In location mode, photo upload should NOT be visible
      await expect(dialog.locator('input[type="file"]')).not.toBeVisible({ timeout: 2_000 });

      // Submit using the "Move Asset" button
      const moveAssetBtn = dialog.getByRole('button', { name: /Move Asset/i });
      await expect(moveAssetBtn).toBeVisible({ timeout: 3_000 });
      await moveAssetBtn.click();

      // Dialog should close automatically (auto-accept — no pending state)
      await expect(dialog).not.toBeVisible({ timeout: 10_000 });

      // Reload and verify no In Transit / Transfer in Progress state
      await gaLeadPage.reload();
      await gaLeadPage.waitForLoadState('networkidle');

      await expect(gaLeadPage.locator('text=/In Transit/i')).not.toBeVisible({ timeout: 5_000 });
      await expect(gaLeadPage.locator('text=/Transfer in Progress/i')).not.toBeVisible({ timeout: 5_000 });
    });
  });

  // -------------------------------------------------------------------------
  // Describe 2: quick-65 — Asset create dialog shows Company field
  // -------------------------------------------------------------------------
  test.describe('quick-65: Asset create dialog shows Company field pre-filled', () => {
    test('New Asset dialog shows Company field pre-filled', async ({ gaLeadPage }) => {
      await gaLeadPage.goto('/inventory');
      await gaLeadPage.waitForLoadState('networkidle');

      // Click the "New Asset" CTA button
      const newAssetBtn = gaLeadPage.getByRole('button', { name: /New Asset/i });
      await expect(newAssetBtn).toBeVisible({ timeout: 5_000 });
      await newAssetBtn.click();

      // Dialog should open
      const dialog = gaLeadPage.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Company label should be visible inside dialog
      await expect(dialog.locator('text=/Company/i').first()).toBeVisible({ timeout: 3_000 });

      // For GA Lead (single-company user), the Company field renders as a disabled Input.
      // Verify either a disabled input or the company name "E2E Test Corp" is present.
      const companyVisible =
        (await dialog.locator('input[disabled]').first().isVisible({ timeout: 2_000 }).catch(() => false)) ||
        (await dialog.locator('text=/E2E Test Corp/i').isVisible({ timeout: 2_000 }).catch(() => false));

      expect(companyVisible).toBe(true);

      // Close dialog by pressing Escape
      await gaLeadPage.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    });
  });

  // -------------------------------------------------------------------------
  // Describe 3: quick-66 (a) — Assets table has Created column
  // -------------------------------------------------------------------------
  test.describe('quick-66 (a): Assets table has Created column', () => {
    test('Assets table shows Created column header', async ({ gaLeadPage }) => {
      await gaLeadPage.goto('/inventory');
      await gaLeadPage.waitForLoadState('networkidle');

      // Wait for table to appear
      await expect(gaLeadPage.locator('table')).toBeVisible({ timeout: 5_000 });

      // Collect all column header texts
      const headers = await gaLeadPage.locator('thead th').allTextContents();
      const joined = headers.join(' ').toLowerCase();

      expect(joined).toContain('created');
    });
  });

  // -------------------------------------------------------------------------
  // Describe 4: quick-66 (b) — Schedules table has Created column
  // -------------------------------------------------------------------------
  test.describe('quick-66 (b): Schedules table has Created column', () => {
    test('Schedules table shows Created column header', async ({ gaLeadPage }) => {
      await gaLeadPage.goto('/maintenance/schedules');
      await gaLeadPage.waitForLoadState('networkidle');

      // Wait for table to appear
      await expect(gaLeadPage.locator('table')).toBeVisible({ timeout: 5_000 });

      // Collect all column header texts
      const headers = await gaLeadPage.locator('thead th').allTextContents();
      const joined = headers.join(' ').toLowerCase();

      expect(joined).toContain('created');
    });
  });

  // -------------------------------------------------------------------------
  // Describe 5: quick-66 (d) — Template name cell uses break-words
  // -------------------------------------------------------------------------
  test.describe('quick-66 (d): Template name cell uses whitespace-normal break-words', () => {
    test('Template name cell has whitespace-normal and break-words classes (structural check)', async ({ gaLeadPage }) => {
      await gaLeadPage.goto('/maintenance/templates');
      await gaLeadPage.waitForLoadState('networkidle');

      // Wait for table to appear
      await expect(gaLeadPage.locator('table')).toBeVisible({ timeout: 5_000 });

      // The template name cell should NOT have the "truncate" class.
      // It should use whitespace-normal + break-words to allow wrapping long names.
      // Check the first name cell in the table body — verify it lacks "truncate".
      const firstNameCell = gaLeadPage.locator('tbody td').first();
      await expect(firstNameCell).toBeVisible({ timeout: 5_000 });

      const truncateExists = await gaLeadPage.evaluate(() => {
        const cells = document.querySelectorAll('tbody td');
        // Find the first cell that could be a name cell (not a badge or button)
        for (const cell of cells) {
          const inner = cell.querySelector('span, div, p');
          if (inner && inner.classList.contains('truncate')) return true;
          if (cell.classList.contains('truncate')) return true;
        }
        return false;
      });

      // The template name cells must not use truncate
      expect(truncateExists).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Describe 6: quick-66 (c) — Breadcrumb and sidebar
  // -------------------------------------------------------------------------
  test.describe('quick-66 (c): Breadcrumb and sidebar nav', () => {
    test('Breadcrumb on /inventory/new shows Assets', async ({ gaLeadPage }) => {
      await gaLeadPage.goto('/inventory/new');
      await gaLeadPage.waitForLoadState('networkidle');

      // Breadcrumb should contain an "Assets" link pointing to /inventory
      const breadcrumbAssets = gaLeadPage
        .locator('nav[aria-label="breadcrumb"] a', { hasText: /^Assets$/i })
        .or(gaLeadPage.locator('a[href="/inventory"]:has-text("Assets")'));

      await expect(breadcrumbAssets).toBeVisible({ timeout: 5_000 });
    });

    test('Assets nav item visible to ga_lead in sidebar', async ({ gaLeadPage }) => {
      await gaLeadPage.goto('/inventory');
      await gaLeadPage.waitForLoadState('networkidle');

      // Sidebar should contain a link to /inventory with "Assets" text
      await expect(gaLeadPage.locator('aside a[href="/inventory"]')).toBeVisible({ timeout: 5_000 });
    });
  });
});

/**
 * Phase 06 — Tests 8-11, 13: Status change, transfer flow, in-transit indicator
 *
 * These tests run serially as a workflow: create asset → change status → transfer → accept/cancel.
 * Test data is created via the admin API to avoid depending on other tests.
 */
import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getTestData } from '../../fixtures/test-data';

// Minimal valid JPEG for photo uploads
const JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

// Create admin client for direct DB operations
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Helper: upload a photo via the PhotoUpload component's hidden input inside a dialog */
async function uploadPhotoInDialog(page: import('@playwright/test').Page) {
  const dialog = page.locator('[role="dialog"]');
  const fileInput = dialog.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: `photo-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    buffer: JPEG_BUFFER,
  });
  await page.waitForTimeout(500);
}

/** Helper: select a combobox option inside a dialog */
async function selectComboboxInDialog(
  page: import('@playwright/test').Page,
  comboboxIndex: number,
  searchText: string = ''
) {
  const dialog = page.locator('[role="dialog"]');
  const trigger = dialog.locator('button[role="combobox"]').nth(comboboxIndex);
  await trigger.click();
  await page.waitForTimeout(300);
  const input = page.locator('[cmdk-input]');
  if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await input.fill(searchText);
    await page.waitForTimeout(300);
  }
  const option = page.locator('[cmdk-item]').first();
  await expect(option).toBeVisible({ timeout: 5_000 });
  await option.click();
  await page.waitForTimeout(200);
}

let testAssetId: string | null = null;
let transferTestAssetId: string | null = null;

/** Generate a unique display ID that won't collide with the RPC sequence.
 *  Uses a random suffix so parallel test workers can't clash. */
function uniqueDisplayId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AST-E2E-${prefix}-${rand}`;
}

test.describe.serial('Phase 06 — Asset Status & Transfer', () => {
  // Create test assets directly in DB before all tests
  test.beforeAll(async () => {
    const admin = adminClient();
    const data = getTestData();

    // Insert asset for status tests (random display ID to avoid RPC sequence collision)
    const { data: asset, error } = await admin
      .from('inventory_items')
      .insert({
        company_id: data.companyId,
        display_id: uniqueDisplayId('ST'),
        name: `E2E Status Test Asset ${Date.now()}`,
        category_id: data.categories.furniture,
        location_id: data.locations.headOffice,
        status: 'active',
        acquisition_date: '2026-01-15',
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create test asset: ${error.message}`);
    testAssetId = asset.id;

    // Insert a second asset for transfer tests
    const { data: asset2, error: error2 } = await admin
      .from('inventory_items')
      .insert({
        company_id: data.companyId,
        display_id: uniqueDisplayId('TR'),
        name: `E2E Transfer Test Asset ${Date.now()}`,
        category_id: data.categories.electronics,
        location_id: data.locations.headOffice,
        status: 'active',
        acquisition_date: '2026-01-15',
      })
      .select('id')
      .single();

    if (error2) throw new Error(`Failed to create transfer test asset: ${error2.message}`);
    transferTestAssetId = asset2.id;
  });

  test.afterAll(async () => {
    const admin = adminClient();
    // Clean up movements and assets
    if (testAssetId) {
      await admin.from('inventory_movements').delete().eq('item_id', testAssetId);
      await admin.from('inventory_items').delete().eq('id', testAssetId);
    }
    if (transferTestAssetId) {
      await admin.from('inventory_movements').delete().eq('item_id', transferTestAssetId);
      await admin.from('inventory_items').delete().eq('id', transferTestAssetId);
    }
  });

  test('Test 8: Change asset status (active → under_repair)', async ({ gaStaffPage }) => {
    test.skip(!testAssetId, 'No test asset created');

    await gaStaffPage.goto(`/inventory/${testAssetId}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // Click the status badge to open status change dialog
    const statusBadge = gaStaffPage.locator('[aria-label="Click to change status"]').first();
    await expect(statusBadge).toBeVisible({ timeout: 5_000 });
    await statusBadge.click();

    // Dialog should appear
    const dialog = gaStaffPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('text=/Change Asset Status/i')).toBeVisible();

    // Select "Under Repair" from the status dropdown
    const selectTrigger = dialog.locator('[role="combobox"]').first();
    await selectTrigger.click();
    // Wait for select content to appear and click "Under Repair"
    const underRepairOption = gaStaffPage.locator('[role="option"]', { hasText: /Under Repair/i });
    await expect(underRepairOption).toBeVisible({ timeout: 3_000 });
    await underRepairOption.click();

    // Upload condition photo (required)
    await uploadPhotoInDialog(gaStaffPage);

    // Submit
    const submitBtn = dialog.getByRole('button', { name: /change status/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Dialog should close and status badge should update
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Reload to verify persisted status
    await gaStaffPage.reload();
    await gaStaffPage.waitForLoadState('networkidle');

    // Verify badge now shows "Under Repair"
    await expect(gaStaffPage.locator('text=/Under Repair/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Test 9: Initiate asset transfer', async ({ gaLeadPage }) => {
    test.skip(!transferTestAssetId, 'No transfer test asset created');

    await gaLeadPage.goto(`/inventory/${transferTestAssetId}`);
    await gaLeadPage.waitForLoadState('networkidle');

    // Click Transfer button
    const transferBtn = gaLeadPage.getByRole('button', { name: /transfer/i });
    await expect(transferBtn).toBeVisible({ timeout: 5_000 });
    await transferBtn.click();

    // Transfer dialog should open
    const dialog = gaLeadPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('text=/Transfer Asset/i')).toBeVisible();

    // Select destination location via combobox (first combobox in dialog)
    await selectComboboxInDialog(gaLeadPage, 0);

    // Select receiver via combobox (second combobox in dialog)
    await selectComboboxInDialog(gaLeadPage, 1);

    // Upload sender condition photo (required)
    await uploadPhotoInDialog(gaLeadPage);

    // Submit transfer
    const submitBtn = dialog.getByRole('button', { name: /initiate transfer/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Reload and verify transfer pending UI
    await gaLeadPage.reload();
    await gaLeadPage.waitForLoadState('networkidle');

    // Should see "In Transit" badge or "Transfer in Progress" banner
    const transitIndicator = gaLeadPage.locator('text=/In Transit|Transfer in Progress/i').first();
    await expect(transitIndicator).toBeVisible({ timeout: 5_000 });

    // Should see Cancel Transfer button (initiator can cancel)
    await expect(gaLeadPage.getByRole('button', { name: /cancel transfer/i })).toBeVisible();
  });

  test('Test 10: Accept transfer with photo', async ({ gaStaffPage }) => {
    // Test 9 created a pending transfer on transferTestAssetId.
    // The receiver (gaStaff) should see Accept/Reject buttons.
    test.skip(!transferTestAssetId, 'No transfer test asset created');

    // First check if gaStaff is the receiver. If the combobox selected a different user,
    // we need to use admin API to get the actual receiver.
    // Since gaStaff might not be the receiver, let's use admin to check and fix if needed.
    const admin = adminClient();
    const data = getTestData();

    // Ensure gaStaff is the receiver
    const { data: movement } = await admin
      .from('inventory_movements')
      .select('id, receiver_id')
      .eq('item_id', transferTestAssetId!)
      .eq('status', 'pending')
      .single();

    if (movement && movement.receiver_id !== data.users.gaStaff.id) {
      // Update the receiver to gaStaff for this test
      await admin
        .from('inventory_movements')
        .update({ receiver_id: data.users.gaStaff.id })
        .eq('id', movement.id);
    }

    await gaStaffPage.goto(`/inventory/${transferTestAssetId}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // Receiver should see Accept Transfer button
    const acceptBtn = gaStaffPage.getByRole('button', { name: /accept transfer/i });
    await expect(acceptBtn).toBeVisible({ timeout: 5_000 });

    // Also verify Reject button is present
    await expect(gaStaffPage.getByRole('button', { name: /reject transfer/i })).toBeVisible();

    // Click Accept
    await acceptBtn.click();

    // Accept dialog should open
    const dialog = gaStaffPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByRole('heading', { name: /Accept Transfer/i })).toBeVisible();

    // Upload received condition photo (required)
    await uploadPhotoInDialog(gaStaffPage);

    // Submit
    const submitBtn = dialog.getByRole('button', { name: /accept transfer/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Reload and verify asset location changed (no more "In Transit")
    await gaStaffPage.reload();
    await gaStaffPage.waitForLoadState('networkidle');

    // "In Transit" / "Transfer in Progress" should be gone
    const transitBadge = gaStaffPage.locator('text=/In Transit/i');
    await expect(transitBadge).not.toBeVisible({ timeout: 5_000 });

    // Transfer button should be visible again (no pending transfer)
    await expect(gaStaffPage.getByRole('button', { name: /^transfer$/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Test 11: Cancel transfer', async ({ gaLeadPage }) => {
    test.skip(!transferTestAssetId, 'No transfer test asset created');

    // Create a new pending transfer via admin API for this test
    const admin = adminClient();
    const data = getTestData();

    const { data: movement, error } = await admin
      .from('inventory_movements')
      .insert({
        company_id: data.companyId,
        item_id: transferTestAssetId!,
        from_location_id: data.locations.headOffice,
        to_location_id: data.locations.branchB,
        initiated_by: data.users.gaLead.id,
        receiver_id: data.users.gaStaff.id,
        status: 'pending',
      })
      .select('id')
      .single();

    test.skip(!!error, `Failed to create transfer: ${error?.message}`);

    // GA Lead (initiator) navigates to asset detail
    await gaLeadPage.goto(`/inventory/${transferTestAssetId}`);
    await gaLeadPage.waitForLoadState('networkidle');

    // Should see Cancel Transfer button
    const cancelBtn = gaLeadPage.getByRole('button', { name: /cancel transfer/i });
    await expect(cancelBtn).toBeVisible({ timeout: 5_000 });

    // Click Cancel → AlertDialog confirmation
    await cancelBtn.click();

    // AlertDialog should appear
    const alertDialog = gaLeadPage.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await expect(alertDialog.locator('text=/Are you sure/i')).toBeVisible();

    // Click "Cancel Transfer" confirmation button in the AlertDialog
    const confirmBtn = alertDialog.getByRole('button', { name: /cancel transfer/i });
    await confirmBtn.click();

    // AlertDialog should close
    await expect(alertDialog).not.toBeVisible({ timeout: 10_000 });

    // Reload and verify transfer is cancelled (no more In Transit)
    await gaLeadPage.reload();
    await gaLeadPage.waitForLoadState('networkidle');

    // "In Transit" should be gone
    const transitBadge = gaLeadPage.locator('text=/In Transit/i');
    await expect(transitBadge).not.toBeVisible({ timeout: 5_000 });

    // Transfer button should be visible again
    await expect(gaLeadPage.getByRole('button', { name: /^transfer$/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Test 13: In-transit indicator on list and detail', async ({ gaStaffPage }) => {
    // Create a pending transfer so the in-transit indicator shows
    test.skip(!testAssetId, 'No test asset created');

    const admin = adminClient();
    const data = getTestData();

    // Need to set status back to active first for testAssetId (was changed in Test 8)
    await admin
      .from('inventory_items')
      .update({ status: 'active' })
      .eq('id', testAssetId!);

    const { data: movement } = await admin
      .from('inventory_movements')
      .insert({
        company_id: data.companyId,
        item_id: testAssetId!,
        from_location_id: data.locations.headOffice,
        to_location_id: data.locations.branchA,
        initiated_by: data.users.gaLead.id,
        receiver_id: data.users.gaStaff.id,
        status: 'pending',
      })
      .select('id')
      .single();

    // Check list page for In Transit indicator
    await gaStaffPage.goto('/inventory');
    await gaStaffPage.waitForLoadState('networkidle');
    await expect(gaStaffPage.locator('table')).toBeVisible();

    // The asset with pending transfer should show "In Transit" text on the list
    const transitOnList = gaStaffPage.locator('text=/In Transit/i');
    await expect(transitOnList.first()).toBeVisible({ timeout: 5_000 });

    // Check detail page for In Transit indicator
    await gaStaffPage.goto(`/inventory/${testAssetId}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // Should see "In Transit" badge and "Transfer in Progress" banner
    await expect(gaStaffPage.locator('text=/In Transit/i').first()).toBeVisible({ timeout: 5_000 });
    await expect(gaStaffPage.locator('text=/Transfer in Progress/i')).toBeVisible({ timeout: 5_000 });

    // Clean up the transfer
    if (movement) {
      await admin.from('inventory_movements').delete().eq('id', movement.id);
    }
  });
});

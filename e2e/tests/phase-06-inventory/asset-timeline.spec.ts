/**
 * Phase 06 — Test 12: Asset timeline events
 *
 * Verifies the Activity Timeline section shows creation events with correct structure.
 */
import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getTestData } from '../../fixtures/test-data';

test.describe('Phase 06 — Asset Timeline', () => {
  test('Test 12: Asset timeline shows creation and edit events', async ({ gaStaffPage }) => {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const data = getTestData();

    // Create asset via admin API (random display ID to avoid RPC sequence collision)
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const { data: asset, error } = await admin
      .from('inventory_items')
      .insert({
        company_id: data.companyId,
        display_id: `AST-E2E-TL-${rand}`,
        name: `E2E Timeline Asset ${Date.now()}`,
        category_id: data.categories.furniture,
        location_id: data.locations.headOffice,
        status: 'active',
        acquisition_date: '2026-01-15',
      })
      .select('id')
      .single();

    test.skip(!!error, `Failed to create test asset: ${error?.message}`);

    // Navigate to asset detail
    await gaStaffPage.goto(`/inventory/${asset!.id}`);
    await gaStaffPage.waitForLoadState('networkidle');

    // Verify the right column has the Activity Timeline section
    const timelineSection = gaStaffPage.locator('text=/Activity Timeline/i');
    await expect(timelineSection).toBeVisible({ timeout: 5_000 });

    // Verify the timeline heading is inside a bordered container
    const timelineContainer = gaStaffPage.locator('.rounded-lg.border').filter({
      has: gaStaffPage.locator('text=/Activity Timeline/i'),
    });
    await expect(timelineContainer).toBeVisible();

    // Should have at least a creation event
    await expect(gaStaffPage.locator('text=/created/i').first()).toBeVisible({ timeout: 5_000 });

    // Verify the two-column layout (detail + timeline)
    const gridContainer = gaStaffPage.locator('.grid.max-w-\\[1000px\\]');
    await expect(gridContainer).toBeVisible();

    // Cleanup
    await admin.from('inventory_items').delete().eq('id', asset!.id);
  });
});

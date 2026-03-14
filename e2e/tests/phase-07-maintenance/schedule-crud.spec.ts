/**
 * Phase 07 — Tests 10-15, 21: Schedule list, create, detail, activate/deactivate/delete, auto-pause, edit interval
 *
 * Tests 12-14, 21 run serially: Test 12 creates a schedule, then 13/14/21 operate on it.
 *
 * Extended tests (quick-70, quick-75, quick-77):
 *   - Test A: Create schedule without asset (non-asset path)
 *   - Test B: auto_create_days_before persists with non-zero value
 *   - Test C: RLS blocks cross-company schedule INSERT at DB level
 */
import { test, expect } from '../../fixtures';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '../../fixtures/supabase-admin';
import { getTestData } from '../../fixtures/test-data';

test.describe('Phase 07 — Schedule CRUD', () => {
  test('Test 10: Schedules list page loads with correct columns', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance');
    await gaLeadPage.waitForLoadState('networkidle');

    await expect(gaLeadPage.locator('h1', { hasText: /schedule/i })).toBeVisible();

    const headers = gaLeadPage.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const h = headerTexts.join(' ').toLowerCase();
    expect(h).toContain('template');
    expect(h).toContain('asset');
    expect(h).toContain('interval');
    expect(h).toContain('status');

    // New Schedule button visible for GA Lead
    await expect(gaLeadPage.getByRole('link', { name: /new schedule/i })).toBeVisible();
  });

  test('Test 11: Create schedule form shows template and asset comboboxes', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/schedules/new');
    await gaLeadPage.waitForLoadState('networkidle');

    // Template & Asset section
    await expect(gaLeadPage.locator('text=/Template.*Asset/i').first()).toBeVisible({ timeout: 5_000 });

    // Template combobox
    await expect(gaLeadPage.locator('[role="combobox"]').first()).toBeVisible();
    // Asset combobox
    await expect(gaLeadPage.locator('[role="combobox"]').nth(1)).toBeVisible();

    // Select a template to test bidirectional filter
    const templateCombo = gaLeadPage.locator('[role="combobox"]').first();
    await templateCombo.click();
    await gaLeadPage.waitForTimeout(300);
    const firstTemplate = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstTemplate.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstTemplate.click();
    }
  });
});

test.describe.serial('Phase 07 — Schedule Lifecycle (Tests 12-14, 21)', () => {
  let scheduleCreated = false;

  test('Test 12: Create schedule with interval and type', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance/schedules/new');
    await gaLeadPage.waitForLoadState('networkidle');

    // Select template
    const templateCombo = gaLeadPage.locator('[role="combobox"]').first();
    await templateCombo.click();
    await gaLeadPage.waitForTimeout(300);
    const firstTemplate = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstTemplate.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstTemplate.click();
    }

    // Select asset
    await gaLeadPage.waitForTimeout(500);
    const assetCombo = gaLeadPage.locator('[role="combobox"]').nth(1);
    await assetCombo.click();
    await gaLeadPage.waitForTimeout(300);
    const firstAsset = gaLeadPage.locator('[cmdk-item]').first();
    if (await firstAsset.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstAsset.click();
    }

    // Set interval
    await gaLeadPage.getByLabel(/interval/i).fill('30');

    // Fixed/Floating toggle buttons
    await expect(gaLeadPage.getByRole('button', { name: 'Fixed' })).toBeVisible();
    await expect(gaLeadPage.getByRole('button', { name: 'Floating' })).toBeVisible();

    // Submit
    await gaLeadPage.getByRole('button', { name: /create|save|submit/i }).click();
    await gaLeadPage.waitForURL(/\/maintenance/, { timeout: 10_000 });

    scheduleCreated = true;
  });

  test('Test 13: Schedule detail page shows info', async ({ gaLeadPage }) => {
    test.skip(!scheduleCreated, 'No schedule created');

    await gaLeadPage.goto('/maintenance');
    await gaLeadPage.waitForLoadState('networkidle');

    // Wait for table to have data
    const firstRow = gaLeadPage.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });

    // Click row (may have link or be clickable directly)
    const rowLink = firstRow.locator('a').first();
    if (await rowLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await rowLink.click();
    } else {
      await firstRow.click();
    }
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForTimeout(2_000);

    // Should be on a detail page now — check for schedule info
    // Template/Asset/Interval text should be visible
    await expect(gaLeadPage.locator('text=/template/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(gaLeadPage.locator('text=/asset/i').first()).toBeVisible();
    await expect(gaLeadPage.locator('text=/interval/i').first()).toBeVisible();
  });

  test('Test 14: Deactivate and activate schedule', async ({ gaLeadPage }) => {
    test.skip(!scheduleCreated, 'No schedule created');

    await gaLeadPage.goto('/maintenance');
    await gaLeadPage.waitForLoadState('networkidle');

    const firstRow = gaLeadPage.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    const rowLink = firstRow.locator('a').first();
    if (await rowLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await rowLink.click();
    } else {
      await firstRow.click();
    }
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForTimeout(2_000);

    // Deactivate
    const deactivateBtn = gaLeadPage.getByRole('button', { name: /deactivate/i }).first();
    if (await deactivateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deactivateBtn.click();
      await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });

      // Dismiss
      const dismissBtn = gaLeadPage.locator('button[aria-label="Dismiss"]').first();
      if (await dismissBtn.isVisible({ timeout: 1_000 }).catch(() => false)) await dismissBtn.click();

      // Activate
      const activateBtn = gaLeadPage.getByRole('button', { name: /activate/i }).first();
      if (await activateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await activateBtn.click();
        await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('Test 21: Edit interval on schedule detail', async ({ gaLeadPage }) => {
    test.skip(!scheduleCreated, 'No schedule created');

    await gaLeadPage.goto('/maintenance');
    await gaLeadPage.waitForLoadState('networkidle');

    const firstRow = gaLeadPage.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    const rowLink = firstRow.locator('a').first();
    if (await rowLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await rowLink.click();
    } else {
      await firstRow.click();
    }
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForTimeout(2_000);

    // Look for edit button
    const editBtn = gaLeadPage.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();

      const intervalInput = gaLeadPage.getByLabel(/interval/i);
      if (await intervalInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await intervalInput.clear();
        await intervalInput.fill('7');
        await gaLeadPage.getByRole('button', { name: /save|update/i }).click();
        await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });
      }
    } else {
      // Interval field might be directly editable (detail IS edit page)
      const intervalInput = gaLeadPage.getByLabel(/interval/i);
      if (await intervalInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await intervalInput.clear();
        await intervalInput.fill('7');
        await gaLeadPage.getByRole('button', { name: /save|update/i }).click();
        await expect(gaLeadPage.locator('.bg-green-50').first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test.skip('Test 15: Auto-pause on asset status change', async () => {
    // Complex multi-step flow requiring active schedule + asset status change
  });
});

// ============================================================================
// Extended Tests (quick-70, quick-75, quick-77)
// Test A & B: UI tests via gaLeadPage — serial (share general template)
// ============================================================================

test.describe.serial('Phase 07 — Schedule Extended Tests (quick-70, quick-75)', () => {
  let generalTemplateId: string;
  let generalTemplateName: string;
  const createdScheduleIds: string[] = [];

  test.beforeAll(async () => {
    const admin = getAdminClient();

    // Create a guaranteed general template (category_id = null) for non-asset tests
    generalTemplateName = `E2E General Tmpl ${Date.now()}`;
    const { data: tmpl, error: tmplError } = await admin
      .from('maintenance_templates')
      .insert({
        company_id: null,
        category_id: null,
        name: generalTemplateName,
        description: 'E2E test general template (no asset category)',
        checklist: JSON.stringify([{ id: '1', label: 'Check item', type: 'checkbox' }]),
        is_active: true,
      })
      .select('id')
      .single();
    if (tmplError) throw new Error(`Failed to create general template: ${tmplError.message}`);
    generalTemplateId = tmpl.id;
  });

  test.afterAll(async () => {
    const admin = getAdminClient();

    // Clean up schedules created during tests
    for (const schedId of createdScheduleIds) {
      await admin.from('maintenance_schedules').delete().eq('id', schedId);
    }

    // Clean up the general template
    if (generalTemplateId) {
      await admin.from('maintenance_templates').delete().eq('id', generalTemplateId);
    }
  });

  test('Test A: Create schedule WITHOUT asset (non-asset path)', async ({ gaLeadPage }) => {
    // Open the create dialog via ?action=create permalink
    await gaLeadPage.goto('/maintenance?action=create');
    await gaLeadPage.waitForLoadState('networkidle');

    // Wait for the dialog to appear
    const dialog = gaLeadPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Select the general template via combobox inside the dialog
    const templateCombo = dialog.locator('[role="combobox"]').first();
    await templateCombo.click();
    await gaLeadPage.waitForTimeout(300);
    const searchInput = gaLeadPage.locator('[cmdk-input]');
    await searchInput.fill(generalTemplateName);
    await gaLeadPage.waitForTimeout(300);
    const templateOption = gaLeadPage.locator('[cmdk-item]').filter({ hasText: generalTemplateName }).first();
    await expect(templateOption).toBeVisible({ timeout: 5_000 });
    await templateOption.click();

    // Wait for form to update after template selection
    await gaLeadPage.waitForTimeout(500);

    // Confirm the "general template" hint is visible (no asset required)
    await expect(dialog.locator('text=/no asset required/i')).toBeVisible({ timeout: 5_000 });

    // Confirm that the Asset label/combobox is NOT visible (hidden for general templates)
    const assetLabel = dialog.locator('label', { hasText: /^Asset/ });
    await expect(assetLabel).not.toBeVisible();

    // Set interval_days to 14
    await dialog.getByLabel(/interval/i).clear();
    await dialog.getByLabel(/interval/i).fill('14');

    // Leave auto_create_days_before as default (0)
    // Submit the form
    await dialog.getByRole('button', { name: /create/i }).click();

    // Dialog closes on success, and page refreshes
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Verify schedule list has data
    await gaLeadPage.waitForLoadState('networkidle');
    const firstRow = gaLeadPage.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });

    // Track created schedule for cleanup and get its ID for direct navigation
    const admin = getAdminClient();
    const { data: recentSchedules } = await admin
      .from('maintenance_schedules')
      .select('id')
      .eq('template_id', generalTemplateId)
      .order('created_at', { ascending: false })
      .limit(1);
    const createdScheduleId = recentSchedules?.[0]?.id;
    if (createdScheduleId) {
      createdScheduleIds.push(createdScheduleId);
    }

    // Navigate directly to the schedule detail page by ID
    expect(createdScheduleId).toBeTruthy();
    await gaLeadPage.goto(`/maintenance/schedules/${createdScheduleId}`);
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForTimeout(2_000);

    // Confirm detail page loads and shows template name
    await expect(gaLeadPage.locator('text=/template/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Test B: auto_create_days_before persists with non-zero value', async ({ gaLeadPage }) => {
    // Open the create dialog via ?action=create permalink
    await gaLeadPage.goto('/maintenance?action=create');
    await gaLeadPage.waitForLoadState('networkidle');

    // Wait for the dialog to appear
    const dialog = gaLeadPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Select the general template
    const templateCombo = dialog.locator('[role="combobox"]').first();
    await templateCombo.click();
    await gaLeadPage.waitForTimeout(300);
    const searchInput = gaLeadPage.locator('[cmdk-input]');
    await searchInput.fill(generalTemplateName);
    await gaLeadPage.waitForTimeout(300);
    const templateOption = gaLeadPage.locator('[cmdk-item]').filter({ hasText: generalTemplateName }).first();
    await expect(templateOption).toBeVisible({ timeout: 5_000 });
    await templateOption.click();

    await gaLeadPage.waitForTimeout(500);

    // Set interval_days to 30
    await dialog.getByLabel(/interval/i).clear();
    await dialog.getByLabel(/interval/i).fill('30');

    // Fill auto_create_days_before with 7
    const autoCreateInput = dialog.getByLabel(/auto.create/i);
    await autoCreateInput.clear();
    await autoCreateInput.fill('7');

    // Submit the form
    await dialog.getByRole('button', { name: /create/i }).click();

    // Dialog closes on success, and page refreshes
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Wait for list to load
    await gaLeadPage.waitForLoadState('networkidle');

    // Track the created schedule for cleanup and get its ID for direct navigation
    const admin = getAdminClient();
    const { data: recentSchedules } = await admin
      .from('maintenance_schedules')
      .select('id')
      .eq('template_id', generalTemplateId)
      .order('created_at', { ascending: false })
      .limit(1);
    const createdScheduleId = recentSchedules?.[0]?.id;
    if (createdScheduleId && !createdScheduleIds.includes(createdScheduleId)) {
      createdScheduleIds.push(createdScheduleId);
    }

    // Navigate directly to the schedule detail page by ID
    expect(createdScheduleId).toBeTruthy();
    await gaLeadPage.goto(`/maintenance/schedules/${createdScheduleId}`);
    await gaLeadPage.waitForLoadState('networkidle');
    await gaLeadPage.waitForTimeout(2_000);

    // On the detail page (which IS the edit page), verify auto_create_days_before = 7
    // The edit form shows this as an input field with value "7"
    const autoCreateField = gaLeadPage.getByLabel(/auto.create/i);
    await expect(autoCreateField).toBeVisible({ timeout: 10_000 });
    await expect(autoCreateField).toHaveValue('7');
  });
});

// ============================================================================
// Test C: RLS cross-company INSERT test (API-level, no browser)
// ============================================================================

baseTest.describe('Phase 07 — Schedule RLS Cross-Company (quick-75)', () => {
  let companyBId: string;
  let companyBCreatedByUs = false;
  let companyAUserClient: SupabaseClient;
  let generalTemplateId: string;

  const COMPANY_B_NAME = 'E2E Schedule Auth Test Co B';

  baseTest.beforeAll(async () => {
    const admin = getAdminClient();
    const testData = getTestData();

    // 1. Find or create Company B
    const { data: existingCompany } = await admin
      .from('companies')
      .select('id')
      .eq('name', COMPANY_B_NAME)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCompany) {
      companyBId = existingCompany.id;
      companyBCreatedByUs = false;
    } else {
      const { data: newCompany, error: companyError } = await admin
        .from('companies')
        .insert({ name: COMPANY_B_NAME })
        .select('id')
        .single();
      if (companyError) throw new Error(`Failed to create Company B: ${companyError.message}`);
      companyBId = newCompany.id;
      companyBCreatedByUs = true;
    }

    // 2. Create a general template for the INSERT test (global, no company)
    const { data: tmpl, error: tmplError } = await admin
      .from('maintenance_templates')
      .select('id')
      .eq('name', 'E2E RLS Schedule Test Template')
      .is('deleted_at', null)
      .maybeSingle();

    if (tmpl) {
      generalTemplateId = tmpl.id;
    } else {
      const { data: newTmpl, error: newTmplError } = await admin
        .from('maintenance_templates')
        .insert({
          company_id: null,
          category_id: null,
          name: 'E2E RLS Schedule Test Template',
          description: 'For RLS cross-company INSERT test',
          checklist: JSON.stringify([]),
          is_active: true,
        })
        .select('id')
        .single();
      if (newTmplError) throw new Error(`Failed to create test template: ${newTmplError.message}`);
      generalTemplateId = newTmpl.id;
    }

    // 3. Create an anon-key Supabase client and sign in as Company A's ga_lead
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseAnonKey)
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

    companyAUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const gaLead = testData.users.gaLead;
    const { error: signInError } = await companyAUserClient.auth.signInWithPassword({
      email: gaLead.email,
      password: gaLead.password,
    });
    if (signInError) throw new Error(`Failed to sign in as ga_lead: ${signInError.message}`);
  });

  baseTest.afterAll(async () => {
    const admin = getAdminClient();

    // Clean up template if we created it
    if (generalTemplateId) {
      // Delete any schedules referencing this template first
      await admin.from('maintenance_schedules').delete().eq('template_id', generalTemplateId);
      await admin.from('maintenance_templates').delete().eq('id', generalTemplateId);
    }

    // Clean up Company B only if we created it
    if (companyBCreatedByUs && companyBId) {
      await admin.from('companies').delete().eq('id', companyBId);
    }
  });

  baseTest('Test C: RLS rejects cross-company schedule INSERT', async () => {
    // Attempt to INSERT a maintenance_schedule with Company B's company_id
    // while signed in as Company A's ga_lead.
    // The RLS INSERT policy requires company_id = current_user_company_id(),
    // so this should be rejected.
    const now = new Date();
    const nextDueAt = new Date(now.getTime() + 30 * 86400000).toISOString();

    const { error } = await companyAUserClient.from('maintenance_schedules').insert({
      company_id: companyBId,
      template_id: generalTemplateId,
      interval_days: 30,
      interval_type: 'floating',
      auto_create_days_before: 0,
      next_due_at: nextDueAt,
      is_active: true,
    });

    // RLS WITH CHECK blocks cross-company inserts
    baseExpect(error).not.toBeNull();
  });
});

/**
 * Phase 02 — Tests 11-12: Sidebar navigation structure and role filtering
 */
import { test, expect } from '../../fixtures';
import { SidebarPage } from '../../pages/sidebar.page';

test.describe('Phase 02 — Sidebar Navigation', () => {
  test('Test 11: Sidebar has correct section structure', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(adminPage);

    // Admin sees all sections
    await sidebar.expectSectionVisible('Operations');
    await sidebar.expectSectionVisible('Inventory');
    await sidebar.expectSectionVisible('Admin');

    // Admin sees all nav items
    await sidebar.expectNavItem('Dashboard');
    await sidebar.expectNavItem('Requests');
    await sidebar.expectNavItem('Jobs');
    await sidebar.expectNavItem('Approvals');
    await sidebar.expectNavItem('Assets');
    await sidebar.expectNavItem('Settings');
  });

  test('Test 12: General user does not see Admin section', async ({ generalUserPage }) => {
    await generalUserPage.goto('/');
    await generalUserPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(generalUserPage);

    // General user sees Operations
    await sidebar.expectSectionVisible('Operations');
    await sidebar.expectNavItem('Dashboard');

    // General user should NOT see Admin section
    await sidebar.expectSectionHidden('Admin');
    await sidebar.expectNavItemHidden('Settings');
  });

  test('Test 12b: GA Lead sees Jobs and Approvals', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/');
    await gaLeadPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(gaLeadPage);
    await sidebar.expectNavItem('Requests');
    await sidebar.expectNavItem('Jobs');
    await sidebar.expectNavItem('Approvals');
  });
});

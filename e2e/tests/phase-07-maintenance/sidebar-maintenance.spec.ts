/**
 * Phase 07 — Test 1: Sidebar Maintenance section visibility
 */
import { test, expect } from '../../fixtures';
import { SidebarPage } from '../../pages/sidebar.page';

test.describe('Phase 07 — Sidebar Maintenance', () => {
  test('Test 1: Admin sees Maintenance section with Templates and Schedules', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(adminPage);
    await sidebar.expectSectionVisible('Maintenance');
    await sidebar.expectNavItem('Templates');
    await sidebar.expectNavItem('Schedules');
  });

  test('Test 1b: GA Lead sees Maintenance section', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/');
    await gaLeadPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(gaLeadPage);
    await sidebar.expectSectionVisible('Maintenance');
    await sidebar.expectNavItem('Templates');
    await sidebar.expectNavItem('Schedules');
  });

  test('Test 1c: General user sees Maintenance with Schedules only', async ({ generalUserPage }) => {
    await generalUserPage.goto('/');
    await generalUserPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(generalUserPage);
    // General user CAN see Maintenance section (with Schedules link)
    await sidebar.expectSectionVisible('Maintenance');
    await sidebar.expectNavItem('Schedules');
  });

  test('Test 1d: Templates link navigates to /maintenance/templates', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/');
    await gaLeadPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(gaLeadPage);
    await sidebar.navigateTo('Templates');
    await expect(gaLeadPage).toHaveURL(/\/maintenance\/templates/);
  });

  test('Test 1e: Schedules link navigates to /maintenance', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/');
    await gaLeadPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(gaLeadPage);
    await sidebar.navigateTo('Schedules');
    await expect(gaLeadPage).toHaveURL(/\/maintenance$/);
  });
});

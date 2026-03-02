/**
 * Phase 03 — Tests 3-4: Company create and edit
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { CompanyTabPage } from '../../pages/admin/company-tab.page';

test.describe('Phase 03 — Company CRUD', () => {
  test('Test 3: Create a company', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const companyTab = new CompanyTabPage(adminPage);
    await settings.goto();
    await settings.switchTab('Companies');

    const uniqueName = `Test Company ${Date.now()}`;
    await companyTab.createCompany(uniqueName);

    await companyTab.feedback.expectSuccess(/created|success/i);
    await companyTab.expectCompanyInTable(uniqueName);
  });

  test('Test 4: Edit a company', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const companyTab = new CompanyTabPage(adminPage);
    await settings.goto();
    await settings.switchTab('Companies');

    // Create a company first
    const originalName = `Edit Test ${Date.now()}`;
    await companyTab.createCompany(originalName);
    await companyTab.feedback.expectSuccess();
    await companyTab.feedback.dismiss();

    // Edit it
    const newName = `${originalName} Updated`;
    await companyTab.editCompany(originalName, newName);
    await companyTab.feedback.expectSuccess(/updated|success/i);
    await companyTab.expectCompanyInTable(newName);
  });
});

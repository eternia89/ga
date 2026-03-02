import { test as setup } from '@playwright/test';
import path from 'path';
import { getTestData } from '../fixtures/test-data';

const AUTH_DIR = path.resolve(__dirname, '../.auth');

const roles = [
  { key: 'admin', file: 'admin.json' },
  { key: 'gaLead', file: 'ga_lead.json' },
  { key: 'gaStaff', file: 'ga_staff.json' },
  { key: 'financeApprover', file: 'finance_approver.json' },
  { key: 'generalUser', file: 'general_user.json' },
] as const;

for (const role of roles) {
  setup(`authenticate as ${role.key}`, async ({ page }) => {
    const data = getTestData();
    const user = data.users[role.key];

    await page.goto('/login');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 15_000 });
    await page.waitForLoadState('networkidle');

    // Save storage state
    await page.context().storageState({
      path: path.join(AUTH_DIR, role.file),
    });
  });
}

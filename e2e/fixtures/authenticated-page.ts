import { test as base, Page, BrowserContext } from '@playwright/test';
import path from 'path';
import { getTestData } from './test-data';
import type { TestData } from '../helpers/seed';

type RoleFixtures = {
  adminPage: Page;
  gaLeadPage: Page;
  gaStaffPage: Page;
  financeApproverPage: Page;
  generalUserPage: Page;
  testData: TestData;
};

const AUTH_DIR = path.resolve(__dirname, '../.auth');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function createAuthenticatedPage(
  context: { browser: { newContext: (opts: object) => Promise<BrowserContext> } },
  storageFile: string
): Promise<Page> {
  const ctx = await context.browser.newContext({
    baseURL: BASE_URL,
    storageState: path.join(AUTH_DIR, storageFile),
  });
  return ctx.newPage();
}

export const test = base.extend<RoleFixtures>({
  testData: async ({}, use) => {
    await use(getTestData());
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: path.join(AUTH_DIR, 'admin.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  gaLeadPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: path.join(AUTH_DIR, 'ga_lead.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  gaStaffPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: path.join(AUTH_DIR, 'ga_staff.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  financeApproverPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: path.join(AUTH_DIR, 'finance_approver.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  generalUserPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState: path.join(AUTH_DIR, 'general_user.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';

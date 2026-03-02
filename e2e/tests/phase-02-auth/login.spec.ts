/**
 * Phase 02 — Auth Tests 1-5: Login page, email login, invalid credentials
 */
import { test, expect } from '@playwright/test';
import { getTestData } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';

test.describe('Phase 02 — Login', () => {
  test('Test 1: Unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('Test 2: Login page layout', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.expectPageVisible();
    await login.expectGoogleButtonVisible();
    await login.expectEmailFormVisible();
    await login.expectForgotPasswordLink();
  });

  test.skip('Test 3: Google OAuth login (cannot automate)', async () => {
    // Google OAuth requires real Google credentials and browser interaction
    // that cannot be automated in E2E tests
  });

  test('Test 4: Email/password login', async ({ page }) => {
    const data = getTestData();
    const login = new LoginPage(page);
    await login.goto();
    await login.login(data.users.admin.email, data.users.admin.password);

    // Should redirect to dashboard
    await page.waitForURL('/', { timeout: 15_000 });
    await expect(page.locator('aside')).toBeVisible();
  });

  test('Test 5: Invalid credentials show error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('nonexistent@example.com', 'wrongpassword');

    await login.expectError(/invalid email or password/i);
  });
});

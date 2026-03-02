import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

  async expectPageVisible() {
    await expect(this.page.locator('h1')).toHaveText('GA Operations');
    await expect(this.page.locator('text=Sign in to continue')).toBeVisible();
  }

  async expectGoogleButtonVisible() {
    await expect(this.page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  }

  async expectEmailFormVisible() {
    await expect(this.page.locator('#email')).toBeVisible();
    await expect(this.page.locator('#password')).toBeVisible();
    await expect(this.page.locator('button[type="submit"]')).toBeVisible();
  }

  async expectError(text: string | RegExp) {
    const alert = this.page.locator('.bg-red-50').first();
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(text);
  }

  async expectForgotPasswordLink() {
    await expect(this.page.locator('a[href="/reset-password"]')).toBeVisible();
  }
}

import { Page, expect } from '@playwright/test';

/**
 * Wait for an inline feedback message to appear.
 */
export async function waitForFeedback(
  page: Page,
  type: 'success' | 'error',
  textMatch?: string | RegExp
) {
  const selector = type === 'success' ? '.bg-green-50' : '.bg-red-50';
  const feedback = page.locator(selector).first();
  await expect(feedback).toBeVisible({ timeout: 10_000 });
  if (textMatch) {
    await expect(feedback).toContainText(textMatch);
  }
  return feedback;
}

/**
 * Wait for the data table to have at least one row loaded.
 */
export async function waitForTableLoad(page: Page) {
  // Wait for table body rows to appear (or "No results" message)
  await page.waitForLoadState('networkidle');
  // Give table time to render after data loads
  await page.waitForTimeout(500);
}

/**
 * Wait for navigation to complete after a click.
 */
export async function waitForNavigation(page: Page, urlPattern: string | RegExp) {
  await page.waitForURL(urlPattern, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Dismiss any visible feedback messages.
 */
export async function dismissFeedback(page: Page) {
  const dismissButtons = page.locator('button[aria-label="Dismiss"]');
  const count = await dismissButtons.count();
  for (let i = 0; i < count; i++) {
    await dismissButtons.nth(i).click();
  }
}

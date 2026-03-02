import { expect, Locator } from '@playwright/test';

/**
 * Assert that a locator contains a date in dd-MM-yyyy format.
 */
export async function expectDateFormat(locator: Locator) {
  const text = await locator.textContent();
  expect(text).toMatch(/\d{2}-\d{2}-\d{4}/);
}

/**
 * Assert that a locator contains a datetime in dd-MM-yyyy, HH:mm:ss format.
 */
export async function expectDateTimeFormat(locator: Locator) {
  const text = await locator.textContent();
  expect(text).toMatch(/\d{2}-\d{2}-\d{4}, \d{2}:\d{2}:\d{2}/);
}

/**
 * Assert that a locator contains IDR-formatted currency (Rp prefix, dot separators).
 */
export async function expectIDRFormat(locator: Locator) {
  const text = await locator.textContent();
  expect(text).toMatch(/Rp[\s.]?[\d.]+/);
}

/**
 * Get today's date in dd-MM-yyyy format.
 */
export function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

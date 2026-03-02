import fs from 'fs';
import path from 'path';
import type { TestData } from '../helpers/seed';

let cachedData: TestData | null = null;

/**
 * Load seeded test data IDs from .auth/test-data.json.
 * Written by global-setup.ts.
 */
export function getTestData(): TestData {
  if (cachedData) return cachedData;

  const filePath = path.resolve(__dirname, '../.auth/test-data.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(
      'Test data not found. Run global-setup first (npx playwright test --project=setup)'
    );
  }

  cachedData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TestData;
  return cachedData;
}

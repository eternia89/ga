#!/usr/bin/env tsx

/**
 * Seed all E2E test users into local Supabase.
 *
 * Usage:  npx tsx scripts/seed-test-users.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { seedTestData } from '../e2e/helpers/seed';

async function main() {
  console.log('Seeding test users to local Supabase...\n');

  const data = await seedTestData();

  console.log('========================================');
  console.log('TEST USERS SEEDED');
  console.log('========================================');
  console.log(`Company ID: ${data.companyId}`);
  console.log('');
  for (const [role, user] of Object.entries(data.users)) {
    console.log(`  ${role.padEnd(18)} ${user.email.padEnd(28)} (password: ${user.password})`);
  }
  console.log('========================================');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

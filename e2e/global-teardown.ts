import { cleanupTestData } from './helpers/seed';

async function globalTeardown() {
  if (process.env.E2E_KEEP_DATA) {
    console.log('\n⏭️  Skipping teardown (E2E_KEEP_DATA set)');
    return;
  }

  console.log('\n🧹 Cleaning up E2E test data...');
  await cleanupTestData();
  console.log('✅ Test data cleaned up');
}

export default globalTeardown;

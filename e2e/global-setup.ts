import { seedTestData } from './helpers/seed';
import fs from 'fs';
import path from 'path';

async function globalSetup() {
  console.log('\n🔧 Seeding E2E test data...');

  const testData = await seedTestData();

  // Write test data IDs for fixtures to read
  const authDir = path.resolve(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  fs.writeFileSync(
    path.resolve(authDir, 'test-data.json'),
    JSON.stringify(testData, null, 2)
  );

  console.log('✅ Test data seeded successfully');
  console.log(`   Company: ${testData.companyId}`);
  console.log(`   Users: ${Object.keys(testData.users).join(', ')}`);
}

export default globalSetup;

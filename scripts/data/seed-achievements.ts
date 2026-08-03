import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.development.local');
if (existsSync(envPath)) config({ path: envPath });
else config();

async function run() {
  const { seedAchievementDefinitions } = await import('../../src/lib/db/achievements');
  await seedAchievementDefinitions();
  console.log('Achievement definitions seeded successfully.');
}

run().catch((error) => {
  console.error('Failed to seed achievements:', error);
  process.exit(1);
});

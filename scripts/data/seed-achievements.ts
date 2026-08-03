import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.development.local');
if (existsSync(envPath)) config({ path: envPath });
else config();

async function run() {
  const { seedAchievementDefinitions, backfillAchievementsForAllUsers } = await import('../../src/lib/db/achievements');
  await seedAchievementDefinitions();
  const backfillResult = await backfillAchievementsForAllUsers();
  console.log('Achievement definitions seeded successfully.');
  console.log(
    `Achievements backfill complete: users=${backfillResult.usersProcessed}, evaluated=${backfillResult.totalEvaluatedCount}, unlockedNow=${backfillResult.totalUnlockedNow}`
  );
}

run().catch((error) => {
  console.error('Failed to seed achievements:', error);
  process.exit(1);
});

import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

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

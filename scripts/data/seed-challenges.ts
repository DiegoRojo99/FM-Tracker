import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production.local'
  : '.env.development.local';

const envPath = resolve(process.cwd(), envFile);
if (existsSync(envPath)) config({ path: envPath });
else config();

async function run() {
  const { seedChallengeCatalog } = await import('../../src/lib/db/challengeCatalog');
  const result = await seedChallengeCatalog();

  console.log('Challenge catalog seeded successfully.');
  console.log(
    `Definitions created=${result.definitionsCreated}, updated=${result.definitionsUpdated}, goals upserted=${result.goalsUpserted}, rules created=${result.rulesCreated}`
  );
  console.log(
    `Stale goals deleted=${result.staleGoalsDeleted}, stale goals skipped (runs exist)=${result.staleGoalDeleteSkipped}`
  );
}

run().catch((error) => {
  console.error('Failed to seed challenge catalog:', error);
  process.exit(1);
});

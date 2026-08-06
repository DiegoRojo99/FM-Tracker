import type admin from 'firebase-admin';
import type { Pool } from 'pg';

function logDeprecated(): void {
  console.warn('⚠️ migrate-career-challenges is deprecated.');
  console.warn('This step targeted removed CareerChallenge/CareerChallengeGoal tables.');
  console.warn('Create ChallengeRun migration or seed scripts for the new schema instead.');
}

export async function migrateCareerChallenges(_firestore: admin.firestore.Firestore, _pool: Pool) {
  logDeprecated();
  return {
    success: true,
    skipped: true,
    reason: 'Legacy challenge run tables removed; migration intentionally disabled.',
  };
}

if (require.main === module) {
  migrateCareerChallenges({} as admin.firestore.Firestore, {} as Pool)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Deprecated migration failed unexpectedly:', error);
      process.exit(1);
    });
}

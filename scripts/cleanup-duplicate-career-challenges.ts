function logDeprecated(): void {
  console.warn('⚠️ cleanup-duplicate-career-challenges is deprecated.');
  console.warn('The CareerChallenge/CareerChallengeGoal tables were removed in challenge schema rebuild.');
  console.warn('Use ChallengeRun/ChallengeRunGoal specific maintenance scripts if needed.');
}

async function cleanupDuplicateCareerChallenges() {
  logDeprecated();
  return {
    success: true,
    skipped: true,
    reason: 'Legacy CareerChallenge tables no longer exist.',
  };
}

if (require.main === module) {
  cleanupDuplicateCareerChallenges()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deprecated script failed unexpectedly:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateCareerChallenges };

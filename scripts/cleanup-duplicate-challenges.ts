function logDeprecated(): void {
  console.warn('⚠️ cleanup-duplicate-challenges is deprecated.');
  console.warn('The Challenge/ChallengeGoal/ChallengeGoalTeam tables were removed in challenge schema rebuild.');
  console.warn('Use ChallengeDefinition/ChallengeDefinitionGoal specific maintenance scripts if needed.');
}

async function cleanupDuplicateChallenges() {
  logDeprecated();
  return {
    success: true,
    skipped: true,
    reason: 'Legacy Challenge tables no longer exist.',
  };
}

if (require.main === module) {
  cleanupDuplicateChallenges()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deprecated script failed unexpectedly:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateChallenges };

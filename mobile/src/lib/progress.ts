import type { ChallengeRun } from './types';

export function challengePercent(run: ChallengeRun | undefined): number {
  if (!run) return 0;
  if (run.completedAt) return 100;
  const goalIds = new Set(run.challenge.goals.map(goal => goal.id));
  if (!goalIds.size) return 0;
  const complete = new Set(
    run.goalProgress.filter(goal => goal.isComplete && goalIds.has(goal.challengeGoalId))
      .map(goal => goal.challengeGoalId),
  );
  return Math.floor(complete.size / goalIds.size * 100);
}

export function bestChallengeRun(runs: ChallengeRun[], challengeId: number) {
  return runs.filter(run => run.challengeId === challengeId)
    .sort((a, b) => Number(Boolean(b.completedAt)) - Number(Boolean(a.completedAt))
      || challengePercent(b) - challengePercent(a))[0];
}

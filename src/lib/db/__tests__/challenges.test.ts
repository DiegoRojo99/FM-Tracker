import { describe, expect, it } from 'vitest';
import type { ChallengeWithGoals } from '../../types/prisma/Challenge';
import type { Trophy } from '../../../../prisma/generated/client';
import { dedupeTrophiesForChallengeEvaluation, filterCompletedChallengeGoalsBasedOnTrophies } from '../../challenges/progression';

describe('challenge progression evaluation', () => {
  it('marks matching goals as complete based on the trophies supplied', () => {
    const challenge = {
      id: 1,
      goals: [
        { id: 101, competitionId: 12, countryId: null, teams: [] },
        { id: 102, competitionId: null, countryId: 'ENG', teams: [] },
        { id: 103, competitionId: 99, countryId: null, teams: [] },
      ],
    } as unknown as ChallengeWithGoals;

    const trophy = {
      id: 7,
      competitionGroupId: 12,
      teamId: 10,
      season: '2023/24',
      saveId: 'save-1',
      gameId: 'game-1',
    } as unknown as Trophy;

    const progress = filterCompletedChallengeGoalsBasedOnTrophies(challenge, [trophy], 'ENG');

    expect(progress.map(({ challengeGoalId, isComplete }) => ({ challengeGoalId, isComplete }))).toEqual([
      { challengeGoalId: 101, isComplete: true },
      { challengeGoalId: 102, isComplete: true },
      { challengeGoalId: 103, isComplete: false },
    ]);
  });

  it('deduplicates repeated trophies before evaluating progress', () => {
    const trophy = {
      id: 7,
      competitionGroupId: 12,
      teamId: 10,
      season: '2023/24',
      saveId: 'save-1',
      gameId: 'game-1',
    } as unknown as Trophy;

    const deduped = dedupeTrophiesForChallengeEvaluation([trophy, { ...trophy, id: 8 } as Trophy]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe(7);
  });
});

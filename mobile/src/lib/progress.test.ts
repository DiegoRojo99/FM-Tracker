import { describe, expect, it } from 'vitest';
import { bestChallengeRun, challengePercent } from './progress';
import type { ChallengeRun } from './types';

function run(overrides: Partial<ChallengeRun> = {}): ChallengeRun {
  return {
    id: 1,
    challengeId: 7,
    completedAt: null,
    challenge: {
      id: 7, name: 'Continental journey', summary: null, description: '', tags: [],
      goals: [{ id: 10, title: null, description: '' }, { id: 11, title: null, description: '' }],
    },
    goalProgress: [{ challengeGoalId: 10, isComplete: true }],
    game: { id: 'fm27', name: 'Football Manager 2027', shortName: 'FM27' },
    ...overrides,
  };
}

describe('challenge progress', () => {
  it('handles missing runs and empty goals', () => {
    expect(challengePercent(undefined)).toBe(0);
    const attempt = run();
    expect(challengePercent({ ...attempt, challenge: { ...attempt.challenge, goals: [] } })).toBe(0);
    expect(challengePercent(attempt)).toBe(50);
  });

  it('ignores obsolete goal records and does not count duplicates twice', () => {
    expect(challengePercent(run({ goalProgress: [
      { challengeGoalId: 10, isComplete: true },
      { challengeGoalId: 10, isComplete: true },
      { challengeGoalId: 999, isComplete: true },
    ] }))).toBe(50);
  });

  it('prefers completed runs, then the best progress across saves', () => {
    const partial = run();
    const complete = run({ id: 2, completedAt: '2026-11-17', goalProgress: [] });
    expect(challengePercent(complete)).toBe(100);
    expect(bestChallengeRun([run({ challengeId: 8 }), partial, complete], 7)).toBe(complete);
    expect(bestChallengeRun([run({ id: 3, goalProgress: [] }), partial], 7)).toBe(partial);
    expect(bestChallengeRun([partial], 100)).toBeUndefined();
  });
});

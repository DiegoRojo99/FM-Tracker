import type { ChallengeWithGoals, CareerChallengeGoalInput } from '../types/prisma/Challenge';
import type { Trophy } from '../../../prisma/generated/client';
import { challengeGoalToCareerChallengeGoal } from '../dto/challenges';

export function dedupeTrophiesForChallengeEvaluation(trophies: Trophy[]): Trophy[] {
  const seen = new Set<string>();
  return trophies.filter((trophy) => {
    const identity = [trophy.competitionGroupId, trophy.teamId, trophy.season, trophy.saveId, trophy.gameId]
      .join(':');
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function filterCompletedChallengeGoalsBasedOnTrophies(
  challenge: ChallengeWithGoals,
  trophies: Trophy[],
  countryCode?: string | string[]
): CareerChallengeGoalInput[] {
  const goals: CareerChallengeGoalInput[] = [];
  const uniqueTrophies = dedupeTrophiesForChallengeEvaluation(trophies);
  const countryCodes = normalizeCountryCodes(countryCode);

  for (const goal of challenge.goals) {
    const isCompleted = uniqueTrophies.some((trophy) => filterGoalByTrophy(goal, trophy, countryCodes));
    const careerGoal = challengeGoalToCareerChallengeGoal({ goal, isCompleted });
    goals.push(careerGoal);
  }

  return goals;
}

function filterGoalByTrophy(
  goal: ChallengeWithGoals['goals'][number],
  trophy: Trophy,
  countryCodes: string[]
): boolean {
  if (goal.competitionId && goal.competitionId !== trophy.competitionGroupId) {
    return false;
  }
  if (goal.teams?.length && goal.teams.every((team) => team.teamId !== trophy.teamId)) {
    return false;
  }
  if (goal.country && !countryCodes.includes(goal.country.code)) {
    return false;
  }
  return true;
}

function normalizeCountryCodes(countryCode?: string | string[]): string[] {
  if (!countryCode) return [];
  if (Array.isArray(countryCode)) {
    return countryCode.filter((code): code is string => typeof code === 'string' && code.length > 0);
  }
  return countryCode.length > 0 ? [countryCode] : [];
}

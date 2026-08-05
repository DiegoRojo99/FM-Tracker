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
  countryCode?: string
): CareerChallengeGoalInput[] {
  const goals: CareerChallengeGoalInput[] = [];
  const uniqueTrophies = dedupeTrophiesForChallengeEvaluation(trophies);

  for (const goal of challenge.goals) {
    const isCompleted = uniqueTrophies.some((trophy) => filterGoalByTrophy(goal, trophy, countryCode));
    const careerGoal = challengeGoalToCareerChallengeGoal({ goal, isCompleted });
    goals.push(careerGoal);
  }

  return goals;
}

function filterGoalByTrophy(
  goal: ChallengeWithGoals['goals'][number],
  trophy: Trophy,
  countryCode?: string
): boolean {
  if (goal.competitionId && goal.competitionId !== trophy.competitionGroupId) {
    return false;
  }
  if (goal.teams?.length && goal.teams.every((team) => team.teamId !== trophy.teamId)) {
    return false;
  }
  if (goal.country && countryCode && goal.country.code !== countryCode) {
    return false;
  }
  if (goal.country && !countryCode) {
    return false;
  }
  return true;
}

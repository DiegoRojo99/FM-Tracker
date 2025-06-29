import { CareerChallenge, Challenge } from "../types/Challenge";
import { Trophy } from "../types/Trophy";

export function getCareerChallengeFromChallengeAndTrophy(challenge: Challenge, trophy: Trophy | null): CareerChallenge {
  // Create a new CareerChallenge object based on the Challenge
  let completedGoals: string[] = [];
  if (trophy) {
    // If a trophy is provided, we can assume the challenge is completed
    completedGoals = challenge.goals.filter(goal => {
      if (goal.competitionId && goal.competitionId === trophy.competitionId) {
        return true;
      }
      if (goal.teamGroup && goal.teamGroup.includes(trophy.teamId)) {
        return true;
      }
      if (goal.countryId && goal.countryId === trophy.countryCode) {
        return true;
      }
      return false;
    }).map(goal => goal.id);
  }

  return {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    goals: challenge.goals,
    completedGoals: [],
    startedAt: new Date().toISOString(),
  };
}

export function getCareerChallengeFromChallengeAndTrophies(challenge: Challenge, trophies: Trophy[]): CareerChallenge {
  // Create a new CareerChallenge object based on the Challenge
  let completedGoals: string[] = [];
  if (trophies.length) {
    // If trophies are provided, we can assume the challenge is completed
    completedGoals = challenge.goals.filter(goal => {
      if (goal.competitionId && trophies.some(trophy => trophy.competitionId === goal.competitionId)) {
        return true;
      }
      if (goal.teamGroup && trophies.some(trophy => trophy.teamId && goal.teamGroup?.includes(trophy.teamId))) {
        return true;
      }
      if (goal.countryId && trophies.some(trophy => trophy.countryCode && goal.countryId === trophy.countryCode)) {
        return true;
      }
      return false;
    }).map(goal => goal.id);
  }

  return {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    goals: challenge.goals,
    completedGoals: [],
    startedAt: new Date().toISOString(),
  };
}

export function getChallengeWithoutStartingAt(challenge: CareerChallenge): Omit<CareerChallenge, 'startedAt'> {
  const { startedAt, ...rest } = challenge;
  return rest;
}
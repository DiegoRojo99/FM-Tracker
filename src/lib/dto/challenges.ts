import { CareerChallenge, Challenge } from "../types/firebase/Challenge";
import { Trophy } from "../types/Trophy";

export function getCareerChallengeFromChallengeAndTrophy(challenge: Challenge, trophy: Trophy | null): Omit<CareerChallenge, 'gameId'> {
  // Create a new CareerChallenge object based on the Challenge
  let completedGoals: string[] = [];
  if (trophy) {
    // If a trophy is provided, we can assume the challenge is completed
    completedGoals = challenge.goals.filter(goal => {
      if (goal.competitionId && String(goal.competitionId) === String(trophy.competitionId)) {
        return true;
      }
      if (goal.teamGroup && goal.teamGroup.includes(String(trophy.teamId))) {
        return true;
      }
      if (goal.countryId && String(goal.countryId) === String(trophy.countryCode)) {
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
    completedGoals: completedGoals,
    startedAt: new Date().toISOString(),
  };
}

export function getCareerChallengeFromChallengeAndTrophies(challenge: Challenge, trophies: Trophy[]): Omit<CareerChallenge, 'gameId'> {
  // Create a new CareerChallenge object based on the Challenge
  let completedGoals: string[] = [];
  if (trophies.length) {
    // If trophies are provided, we can assume the challenge is completed
    completedGoals = challenge.goals.filter(goal => {
      if (goal.competitionId && trophies.some(trophy => String(trophy.competitionId) === String(goal.competitionId))) {
        return true;
      }
      if (goal.teamGroup && trophies.some(trophy => String(trophy.teamId) === String(goal.teamGroup))) {
        return true;
      }
      if (goal.countryId && trophies.some(trophy => String(trophy.countryCode) === String(goal.countryId))) {
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
    completedGoals: completedGoals,
    startedAt: new Date().toISOString(),
  };
}

export function getChallengeWithoutStartingAt(challenge: CareerChallenge): Omit<CareerChallenge, 'startedAt'> {
  const { startedAt, ...rest } = challenge;
  console.log('Career challenge started at:', startedAt);
  return rest;
}
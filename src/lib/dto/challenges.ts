import { CareerChallengeGoal, Trophy } from "../../../prisma/generated/client";
import { CareerChallenge, CareerChallengeGoalInput, Challenge, ChallengeGoalWithDetails, ChallengeWithGoals } from "../types/prisma/Challenge";

type goalToCareerGoal = {
  goal: ChallengeGoalWithDetails;
  isCompleted: boolean;
}

export function challengeGoalToCareerChallengeGoal(props: goalToCareerGoal): CareerChallengeGoalInput {
  return {
    challengeGoalId: props.goal.id,
    isComplete: props.isCompleted,
    completedAt: props.isCompleted ? new Date() : null,
    createdAt: new Date(),
  };
}

export function getCareerChallengeFromChallengeAndTrophy(challenge: ChallengeWithGoals, trophy: Trophy | null): Omit<CareerChallenge, 'id'> {
  // Create a new CareerChallenge object based on the Challenge
  let completedGoals: ChallengeGoalWithDetails[] = [];
  
  if (trophy) {
    // If a trophy is provided, we can assume the challenge is completed
    completedGoals = challenge.goals.filter(goal => {
      if (goal.competitionId && goal.competitionId === trophy.competitionGroupId) {
        return true;  
      }
      if (goal.teams?.length && goal.teams.some(team => team.teamId === trophy.teamId)) {
        return true;
      }
      // if (goal.country?.code && goal.country?.code === trophy.countryCode) {
      //   return true;
      // }
      return false;
    });
  }

  const userChallenge: Omit<CareerChallenge, 'id'> = {
    userId: '', // to be filled when adding to DB
    challengeId: challenge.id,
    gameId: '', // to be filled when adding to DB
    saveId: '', // to be filled when adding to DB
    startedAt: new Date(),
    completedAt: completedGoals.length === challenge.goals.length ? new Date() : null,   
  }

  return userChallenge;
}

export function getCareerChallengeFromChallengeAndTrophies(challenge: ChallengeWithGoals, trophies: Trophy[]): Omit<CareerChallenge, 'gameId'> {
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
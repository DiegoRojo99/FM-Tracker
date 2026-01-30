import { CareerChallenge, CareerChallengeGoalInput, ChallengeGoalWithDetails } from "../types/prisma/Challenge";

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

export function getChallengeWithoutStartingAt(challenge: CareerChallenge): Omit<CareerChallenge, 'startedAt'> {
  const { startedAt, ...rest } = challenge;
  console.log('Career challenge started at:', startedAt);
  return rest;
}
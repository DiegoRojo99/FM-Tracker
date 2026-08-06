import { ChallengeGoalWithDetails, CareerChallengeGoalInput, CareerChallenge } from "../types/prisma/Challenge";

type goalToCareerGoal = {
  goal: ChallengeGoalWithDetails;
  isCompleted: boolean;
}

export function challengeGoalToCareerChallengeGoal(props: goalToCareerGoal): CareerChallengeGoalInput {
  return {
    challengeGoalId: props.goal.id,
    isComplete: props.isCompleted,
    completedAt: props.isCompleted ? new Date() : null,
    progress: props.isCompleted ? 1 : 0,
    evidence: null,
  };
}

export function getChallengeWithoutStartingAt(challenge: CareerChallenge): Omit<CareerChallenge, 'startedAt'> {
  const { startedAt, ...rest } = challenge;
  console.log('Challenge run started at:', startedAt);
  return rest;
}
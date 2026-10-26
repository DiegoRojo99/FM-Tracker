import { ChallengeGoalWithDetails, CareerChallengeGoalInput, CareerChallenge } from "../types/prisma/Challenge";
import type { Prisma } from "../../../prisma/generated/client";

type goalToCareerGoal = {
  goal: ChallengeGoalWithDetails;
  isCompleted: boolean;
  evidence?: Prisma.JsonValue | null;
}

export function challengeGoalToCareerChallengeGoal(props: goalToCareerGoal): CareerChallengeGoalInput {
  return {
    challengeGoalId: props.goal.id,
    isComplete: props.isCompleted,
    completedAt: props.isCompleted ? new Date() : null,
    progress: props.isCompleted ? 1 : 0,
    evidence: props.isCompleted ? (props.evidence ?? null) : null,
  };
}

export function getChallengeWithoutStartingAt(challenge: CareerChallenge): Omit<CareerChallenge, 'startedAt'> {
  const { startedAt, ...rest } = challenge;
  console.log('Challenge run started at:', startedAt);
  return rest;
}
import { 
  Challenge, 
  ChallengeGoal, 
  CareerChallenge, 
  CompetitionGroup,
  Country,
  ChallengeGoalTeam,
  CareerChallengeGoal,
  Game
} from "../../../../prisma/generated/client";

export type ChallengeWithGoals = Challenge & {
  goals: ChallengeGoalWithDetails[];
};

export type ChallengeGoalWithDetails = ChallengeGoal & {
  competition: CompetitionGroup | null;
  country: Country | null;
  teams: ChallengeGoalTeam[];
};

export type CareerChallengeWithDetails = CareerChallenge & {
  challenge: ChallengeWithGoals;
  goalProgress: CareerChallengeGoal[];
  game: Game
};

export type CareerChallengeGoalInput = Omit<CareerChallengeGoal, 'id' | 'careerChallengeId'>;

export type {
  Challenge,
  ChallengeGoal,
  CareerChallenge,
  CareerChallengeGoal,
  CareerChallengeGoalInput
}
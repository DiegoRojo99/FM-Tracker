import {
  ChallengeDefinition,
  ChallengeGoal,
  ChallengeRun,
  ChallengeRunGoal,
  ChallengeRule,
  CompetitionGroup,
  Country,
  Game,
  Save,
  Team,
} from "../../../../prisma/generated/client";

export type ChallengeGoalTeamLink = {
  teamId: number;
  team: Team;
};

export type ChallengeGoalWithDetails = ChallengeGoal & {
  challengeId: number;
  competitionId: number | null;
  countryId: string | null;
  competition: CompetitionGroup | null;
  country: Country | null;
  teams: ChallengeGoalTeamLink[];
  rules: ChallengeRule[];
};

export type ChallengeWithGoals = ChallengeDefinition & {
  name: string;
  bonus: string | null;
  goals: ChallengeGoalWithDetails[];
};

export type Challenge = ChallengeWithGoals;

export type CareerChallengeGoal = ChallengeRunGoal;

export type CareerChallengeGoalInput = Omit<
  ChallengeRunGoal,
  'id' | 'challengeRunId' | 'createdAt' | 'updatedAt'
>;

export type CareerChallengeWithDetails = ChallengeRun & {
  challengeId: number;
  challenge: ChallengeWithGoals;
  goalProgress: CareerChallengeGoal[];
  game: Game;
};

export type CareerChallengeWithSaveDetails = CareerChallengeWithDetails & {
  save: Save | null;
};

export type CareerChallenge = ChallengeRun;

export type {
  ChallengeDefinition,
  ChallengeGoal,
  ChallengeRun,
  ChallengeRunGoal,
  CareerChallengeWithSaveDetails,
};

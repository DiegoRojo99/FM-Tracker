export type ChallengeGoal = {
  id: string;
  description: string;

  // Optional identifiers for matching trophies
  competitionId?: string;
  teamId?: string;
  teamGroup?: string[]; 
  countryId?: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  goals: ChallengeGoal[];
};

export type CareerChallenge = {
  id: string;
  name: string;
  description: string;
  goals: ChallengeGoal[];

  completedGoals: string[]; // Array of goal IDs completed
  startedAt: string;
  completedAt?: string;
};

export type {
  ChallengeGoal,
  Challenge,
  CareerChallenge
}
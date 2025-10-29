export type ChallengeGoal = {
  id: string;
  description: string;

  // Optional identifiers for matching trophies
  competitionId?: string;
  teamGroup?: string[]; 
  countryId?: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  goals: ChallengeGoal[];
  bonus?: string; // Optional bonus description
};

export type CareerChallenge = {
  id: string;
  name: string;
  description: string;
  goals: ChallengeGoal[];

  completedGoals: string[]; // Array of goal IDs completed
  startedAt: string;
  completedAt?: string;
  gameId: string; // The game (e.g., 'fm24', 'fm26') this challenge is associated with
};

export type ChallengeGoalInputData = {
  id: string;
  description: string;
  competitionId?: string;
  countryId?: string;
  teamGroup?: string[];
};

export type {
  ChallengeGoal,
  Challenge,
  CareerChallenge,
  ChallengeGoalInputData
}
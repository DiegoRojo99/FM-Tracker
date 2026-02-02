import { FullDetailsSave } from "./Save";
import { Team } from "./Team";

export type GlobalStats = {
  totalUsers: number;
  totalSaves: number;
  totalTrophies: number;
  totalSeasons: number;
  totalCareerStints: number;
  totalChallenges: number;
  timestamp: string;
}

export interface UserStats {
  activeSaves: number;
  totalTrophies: number;
  totalMatches: number;
  currentSeasons: number;
  favoriteTeam?: Team;
  longestSave?: FullDetailsSave;
}
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
  totalPromotions: number;
  favoriteTeams: Team[];
  longestSave?: FullDetailsSave;
  achievements: {
    unlockedCount: number;
    totalCount: number;
    totalPoints: number;
    progressPercent: number;
  };
  challenges: {
    completedCount: number;
    inProgressCount: number;
  };
}
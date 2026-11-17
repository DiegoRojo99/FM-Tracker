// JSON contracts for the existing Next.js API; dates are serialized strings.
export type Team = { id: number; name: string; logo: string | null };
export type Competition = { id: number; name: string; logoUrl: string | null };
export type Game = { id: string; name: string; shortName: string };

export type SavePreview = {
  id: string;
  season: string;
  updatedAt: string;
  currentClub: Team | null;
  currentNT: Team | null;
  currentLeague: Competition | null;
  game: Game;
};

export type Challenge = {
  id: number;
  name: string;
  description: string;
  summary: string | null;
  tags: string[];
  goals: { id: number; title: string | null; description: string }[];
};

export type ChallengeRun = {
  id: number;
  challengeId: number;
  completedAt: string | null;
  challenge: Challenge;
  goalProgress: { challengeGoalId: number; isComplete: boolean }[];
  game: Game;
};

export type Trophy = {
  id: number;
  dateWon: string;
  team: Team;
  competitionGroup: Competition;
};

export type TrophyGroup = { competitionGroup: Competition; trophies: Trophy[] };

export type SaveDetails = SavePreview & {
  isOwner: boolean;
  careerStints: {
    id: number;
    team: Team;
    startDate: string;
    endDate: string | null;
    isNational: boolean;
  }[];
  seasons: {
    id: number;
    season: string;
    team: Team;
    leagueResult: {
      position: number;
      promoted: boolean;
      relegated: boolean;
      competition: Competition;
    } | null;
    cupResults: { id: number; reachedRound: string; competition: Competition }[];
  }[];
  trophies: Trophy[];
  challenges: ChallengeRun[];
};

export type AchievementData = {
  definitions: {
    key: string;
    title: string;
    description: string;
    category: string;
    rarity: string;
    points: number;
    maxProgress: number;
  }[];
  userAchievements: {
    achievementKey: string;
    progress: number;
    unlockedAt: string | null;
  }[];
  summary: {
    totalPoints: number;
    unlockedCount: number;
    totalCount: number;
    progressPercent: number;
  };
};

export type UserStats = {
  activeSaves: number;
  totalTrophies: number;
  currentSeasons: number;
  totalPromotions: number;
  favoriteTeams: Team[];
  achievements: AchievementData['summary'];
  challenges: { completedCount: number; inProgressCount: number };
};

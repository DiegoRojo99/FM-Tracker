type Trophy = {
  id: string; // Firestore auto-id
  name: string;
  competitionId: string;
  competitionType: 'League' | 'Cup' | 'Continental' | 'International';
  national: boolean;
  logo?: string;
}

type TrophyWin = {
  trophyId: string;
  teamId: string;
  season: string; // e.g., "2024/25"
  dateWon?: string;
  notes?: string;
};

export type { Trophy, TrophyWin };
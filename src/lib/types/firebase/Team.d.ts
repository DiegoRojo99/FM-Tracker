import { TeamInput } from "../InsertDB"
import { Timestamp } from 'firebase/firestore';

export type Team = {
  id: number;
  name: string;
  logo: string;
  national: boolean;

  countryCode: string;         // Matches `Country.name` (e.g., "Belgium" or "Lithuania")
  leagueId: number;
  season: number;

  coordinates: {
    lat: number | null;
    lng: number | null;
  };
  
  isFemale?: boolean; // Indicates if the team is a women's team (optional)
};

export type TeamWithDetails = TeamInput & {
  id: string
  competition?: Competition
  country?: Country
}

// Season-specific team data
export type TeamSeason = {
  season: number;                // 2023, 2024, 2025
  apiCompetitionId: number;      // Which API competition they were in
  gameCompetitionId: string;     // Which game competition this maps to
  position?: number;             // Final league position (if available)
  points?: number;               // Points earned (if available)
  lastUpdated: Timestamp;
  dataSource: 'api' | 'manual' | 'estimated';
  confidence: 'high' | 'medium' | 'low';
}

export type TeamSeasonInput = Omit<TeamSeason, 'lastUpdated'>;

// Enhanced team with season history
export type TeamWithHistory = Team & {
  seasons?: TeamSeason[];        // Historical season data
  currentGameCompetition?: string; // Current game competition ID
};
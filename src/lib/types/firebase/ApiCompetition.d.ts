import { Timestamp } from 'firebase/firestore';
import { Team } from './Team';

// Raw competition data from API-Sports
export type ApiCompetition = {
  id: number;                    // API-Sports ID
  name: string;                  // "Tercera División RFEF - Group 1"
  logo: string;
  countryCode: string;
  countryName: string;
  type: "League" | "Cup";
  season: number;                // 2023, 2024, etc.
  inFootballManager: boolean;
  apiSource: "api-sports";
  lastUpdated: Timestamp;
  createdAt: Timestamp;
  
  // Optional cached teams for this competition
  teams?: Team[];
};

// Season-specific data for an API competition
export type ApiCompetitionSeason = {
  season: number;                // 2023, 2024, 2025
  teams: Team[];                 // Teams in this competition for this season
  lastUpdated: Timestamp;
  dataComplete: boolean;         // Whether all team data has been fetched
  totalTeams?: number;           // Expected number of teams
};

export type ApiCompetitionInput = Omit<ApiCompetition, 'lastUpdated' | 'createdAt'>;
export type ApiCompetitionSeasonInput = Omit<ApiCompetitionSeason, 'lastUpdated'>;
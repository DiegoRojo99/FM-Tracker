import admin from "firebase-admin";

type Timestamp = admin.firestore.Timestamp;

/**
 * Firestore adminCompetitions collection schema
 * This represents the admin-curated competition data with display settings
 */
export interface FirestoreAdminCompetition {
  id: string; // Document ID as string
  apiCompetitionId: number; // References the API competition
  name: string;
  displayName: string;
  countryCode: string; // 2-letter country code
  countryName: string;
  type: string; // "League", "Cup", etc.
  isVisible: boolean; // Whether to show in UI
  isGrouped: boolean; // Whether this belongs to a grouped competition
  groupName: string | null; // Name of the group (e.g., "Serie C", "Primera RFEF")
  groupOrder: number | null; // Order within the group
  priority: number; // Priority for ordering competitions
  sortOrder: number; // Sort order within priority group
  logoUrl: string;
  createdBy: string; // Who created this entry
  createdAt: Timestamp | { _seconds: number; _nanoseconds: number }; // Mixed types observed
  lastUpdated: Timestamp;
  updatedBy?: string; // Optional field, present in 143/152 docs
}

/**
 * Firestore apiCompetitions collection schema
 * This represents raw API data for competitions
 */
export interface FirestoreApiCompetition {
  id: number; // Document ID as number (API competition ID)
  name: string;
  logo: string; // Note: called 'logo' in API, 'logoUrl' in admin
  countryCode: string;
  countryName: string;
  type: string;
  season: number; // The season this data is for (e.g., 2023)
  inFootballManager: boolean; // Whether this competition exists in FM
  apiSource: string; // "api-sports"
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

/**
 * Firestore apiCompetitions season data schema
 * This represents season-specific data for API competitions
 */
export interface FirestoreApiCompetitionSeason {
  dataComplete: boolean;
  lastUpdated: Timestamp;
  season: number;
  teams: FirestoreApiCompetitionSeasonTeamData[];
}

/**
 * Firestore apiCompetitions season teamdata schema
 * This represents season-team-specific data for API competitions
 */
export interface FirestoreApiCompetitionSeasonTeamData {
  id: number; // Team ID
  leagueId: number;
  logo: string;
  name: string;
  national: boolean;
  season: number;
  coordinates: {
    lat: number;
    lon: number;
  };
}


const CompetitionMigrationTypes = {
  FirestoreAdminCompetition,
  FirestoreApiCompetition,
  FirestoreApiCompetitionSeason,
  FirestoreApiCompetitionSeasonTeamData,
};

export default CompetitionMigrationTypes;
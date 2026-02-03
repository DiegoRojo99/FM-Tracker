import admin from "firebase-admin";

type Timestamp = admin.firestore.Timestamp;

/**
 * Firestore save-level trophy structure
 * Path: users/{userId}/saves/{saveId}/trophies/{trophyId}
 */
export interface FirestoreSaveTrophy {
  id?: string; // Document ID (sometimes present in data)
  teamId: string; // API team ID as string
  teamName: string;
  teamLogo: string;
  competitionId: string; // API competition ID as string
  competitionName: string;
  competitionLogo: string;
  competitionType: string; // "League" or "Cup"
  season: string; // "2024/25"
  countryCode?: string; // 2-letter country code
  dateWon?: string; // ISO date string (optional)
  createdAt: string | Timestamp; // Mixed formats in data
  game: string; // "fm24", etc.
  updatedAt?: Timestamp;
}

const TrophyMigrationTypes = {
  FirestoreSaveTrophy,
};

export default TrophyMigrationTypes;
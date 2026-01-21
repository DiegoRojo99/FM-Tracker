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

/**
 * Global trophy template structure
 * Path: trophies/{trophyId}
 */
export interface FirestoreGlobalTrophy {
  competitionId: string;
  countryId: string;
  name: string;
  createdAt: Timestamp;
}

/**
 * PostgreSQL Trophy mapping
 */
export interface PostgresTrophy {
  id: number; // Auto-increment
  teamId: number; // References Team.id
  competitionGroupId: number; // References CompetitionGroup.id
  season: string; // "2024/25"
  gameId: number; // References Game.id
  saveId?: string; // References Save.id (optional)
  createdAt: Date;
}

/**
 * Trophy migration mapping strategy
 */
export interface TrophyMigrationStrategy {
  source: "Save-level trophies (users/{userId}/saves/{saveId}/trophies)";
  target: "Trophy table with proper foreign key relationships";
  
  mappingRules: {
    teamIdMapping: "Convert string teamId to integer, validate against Team table";
    competitionMapping: "Map competitionId to CompetitionGroup via junction table";
    gameMapping: "Map game string to Game.id (fm24 -> gameId)";
    seasonFormat: "Keep season string format (2024/25)";
    saveReference: "Link to Save.id for career tracking";
  };
  
  validationRules: {
    teamExists: "teamId must exist in Team table";
    competitionExists: "competitionId must map to valid CompetitionGroup";
    gameExists: "game must exist in Game table";
    saveExists: "saveId must exist in Save table";
    uniqueConstraint: "Prevent duplicate trophies (teamId + competitionId + season + gameId)";
  };
}

/**
 * Migration analysis results
 */
export interface TrophyMigrationAnalysis {
  dataLocation: "users/{userId}/saves/{saveId}/trophies";
  dataFormat: "Save-specific trophies with complete metadata";
  estimatedCount: "Unknown - needs full scan";
  keyFields: {
    required: ["teamId", "competitionId", "season", "game"];
    optional: ["countryCode", "dateWon", "updatedAt"];
    foreign_keys: ["teamId -> Team", "competitionId -> CompetitionGroup", "game -> Game", "saveId -> Save"];
  };
  challenges: {
    unknownCompetitions: "Some competitionIds may not exist in our competition dataset";
    teamValidation: "Team IDs need validation against migrated teams";
    gameMapping: "Need to map game strings to Game IDs";
    duplicateDetection: "Prevent duplicate trophy entries";
  };
}

export default {
  FirestoreSaveTrophy,
  FirestoreGlobalTrophy,
  PostgresTrophy,
  TrophyMigrationStrategy,
  TrophyMigrationAnalysis
};
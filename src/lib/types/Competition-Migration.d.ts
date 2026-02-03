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
 * Firestore apiCompetitions collection schema
 * This represents raw API data for competitions
 */
export type FirestoreCompetition = Omit<FirestoreApiCompetition, 'createdAt' | 'lastUpdated' | 'apiSource'>;

/**
 * Migration mapping between Firestore and PostgreSQL
 * This shows how the data will be mapped during migration
 */
export interface CompetitionMigrationMapping {
  // AdminCompetitions -> CompetitionGroup
  adminToGroup: {
    firestore: FirestoreAdminCompetition;
    postgresql: {
      id: number; // Auto-increment
      name: string; // from admin.name
      displayName: string; // from admin.displayName
      countryCode: string; // from admin.countryCode
      type: string; // from admin.type
      tier: number | null; // Derived from priority/groupOrder logic
      logoUrl: string | null; // from admin.logoUrl
      isActive: boolean; // from admin.isVisible
      createdAt: Date;
      updatedAt: Date;
    };
  };

  // ApiCompetitions -> ApiCompetition
  apiToApi: {
    firestore: FirestoreApiCompetition;
    postgresql: {
      id: number; // from api.id
      name: string; // from api.name
      countryCode: string; // from api.countryCode
      type: string; // from api.type
      logoUrl: string | null; // from api.logo
      tier: number | null; // TBD - may need to be derived
      isActive: boolean; // from api.inFootballManager
      createdAt: Date;
      updatedAt: Date;
    };
  };

  // Junction table: CompetitionGroupApiCompetition
  groupApiMapping: {
    competitionGroupId: number; // References CompetitionGroup.id
    apiCompetitionId: number; // References ApiCompetition.id (from FirestoreAdminCompetition.apiCompetitionId)
    createdAt: Date;
  };
}

/**
 * Analysis of the relationship between the two collections
 */
export interface CompetitionRelationshipAnalysis {
  // Key observations:
  // 1. adminCompetitions.apiCompetitionId -> apiCompetitions.id (primary relationship)
  // 2. adminCompetitions have display/grouping logic that's not in apiCompetitions
  // 3. adminCompetitions.isGrouped determines if competitions should be grouped
  // 4. adminCompetitions.groupName creates logical groups (e.g., "Serie C")
  // 5. Both collections have 152 documents, suggesting 1:1 relationship currently
  
  migrationStrategy: {
    phase1: "Migrate ApiCompetition table first (raw API data)";
    phase2: "Create CompetitionGroup entries based on grouping logic in adminCompetitions";
    phase3: "Create junction table entries to link groups with API competitions";
    phase4: "Handle promotion/relegation relationships (separate migration)";
  };

  groupingLogic: {
    // If isGrouped = true and groupName is set:
    // - Create/find CompetitionGroup by (countryCode + groupName + type)
    // - Set tier based on groupOrder (lower order = higher tier)
    
    // If isGrouped = false:
    // - Create individual CompetitionGroup for this competition
    // - tier derived from priority (higher priority = lower tier number)
    
    tierCalculation: "priority 0-100: tier 1, 101-300: tier 2, 301-500: tier 3, 501+: tier 4";
  };
}

/**
 * Migration validation rules
 */
export interface CompetitionMigrationValidation {
  adminCompetitionsChecks: {
    allHaveApiCompetitionId: boolean; // Must be true
    allHaveCountryCode: boolean; // Must be true  
    validCountryCodes: boolean; // Must exist in countries table
    uniqueApiCompetitionIds: boolean; // Should be true for 1:1 mapping
  };
  
  apiCompetitionsChecks: {
    allHaveValidCountryCode: boolean; // Must exist in countries table
    idsMatchAdminReferences: boolean; // All adminCompetitions.apiCompetitionId should exist in apiCompetitions.id
  };
  
  crossCollectionChecks: {
    orphanedAdminCompetitions: number; // admin competitions without matching API competition
    orphanedApiCompetitions: number; // API competitions not referenced by admin competitions
    countryCodeConsistency: boolean; // Same apiCompetitionId should have same countryCode in both collections
  };
}

const CompetitionMigrationTypes = {
  FirestoreAdminCompetition,
  FirestoreApiCompetition,
  CompetitionMigrationMapping,
  CompetitionRelationshipAnalysis,
  CompetitionMigrationValidation
};

export default CompetitionMigrationTypes;
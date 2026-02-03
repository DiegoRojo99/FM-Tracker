import { Timestamp } from 'firebase/firestore';

// Merged/playable competitions for game logic (trophies, promotions, etc.)
export type GameCompetition = {
  id: string;                    // "tercera-division-rfef-spain"
  name: string;                  // "Tercera División RFEF"
  displayName: string;           // Clean name for UI
  logo: string;
  countryCode: string;
  countryName: string;
  type: "League" | "Cup";
  tier: number;                  // 1 = top division, 5 = fifth tier
  
  // Linked API competitions (the groups that make up this competition)
  apiCompetitionIds: number[];   // [439, 440, 441, ...] all groups
  
  // Promotion/Relegation system
  promotionRules: {
    promotesToId?: string;       // Game competition ID for promotion
    relegationToId?: string;     // Game competition ID for relegation
    promotionSlots: number;      // Number of teams promoted
    relegationSlots: number;     // Number of teams relegated
    playoffSlots?: number;       // Teams that go to promotion playoffs
  };
  
  // Game availability
  availableInGames: string[];    // ["fm24", "fm25", "fm26"]
  isActive: boolean;             // Whether this competition is currently active
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSyncedAt?: Timestamp;      // Last time API data was synced
  
  // Display options
  priority: number;              // For sorting in dropdowns (lower = higher priority)
  isPlayable: boolean;           // Whether users can select this in saves
};

// Simplified version for creation
export type GameCompetitionInput = Omit<GameCompetition, 'createdAt' | 'updatedAt' | 'lastSyncedAt'>;

// For API responses
export type GameCompetitionWithStats = GameCompetition & {
  totalTeams?: number;           // Total teams across all API competitions
  lastSeasonUpdated?: number;    // Last season that has complete data
};
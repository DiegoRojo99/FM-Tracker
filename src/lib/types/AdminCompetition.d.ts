import { Timestamp } from 'firebase/firestore';

// For admin management of which API competitions to show/hide/group
export type AdminCompetition = {
  apiCompetitionId: number; // Links to ApiCompetition
  name: string; // Original competition name
  displayName: string; // Customizable display name
  countryCode: string;
  countryName: string;
  type: string; // 'League', 'Cup', etc.
  
  // Visibility settings
  isVisible: boolean; // Show in dropdowns
  isGrouped: boolean; // Part of a group
  groupName?: string; // Group name (e.g., "Spanish Regional Leagues")
  groupOrder?: number; // Order within group
  
  // Display settings
  priority: number; // For sorting (higher = more important)
  sortOrder: number; // Manual ordering override
  logoUrl?: string;
  
  // Simple promotion/relegation links
  promotionTargetId?: string; // apiCompetitionId as string for promotion (upper league)
  relegationTargetId?: string; // apiCompetitionId as string for relegation (lower league)
  
  // Metadata
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  createdBy: string;
}

export type AdminCompetitionInput = Omit<AdminCompetition, 'id' | 'createdAt' | 'lastUpdated'>;

// For admin interface grouping
export type AdminCompetitionGroup = {
  groupName: string;
  competitions: AdminCompetition[];
  isExpanded?: boolean; // UI state
}

// For dropdowns with visibility rules
export type CompetitionDropdownOption = {
  id: string;
  name: string;
  displayName: string;
  countryCode: string;
  isGroup?: boolean;
  groupName?: string;
  priority: number;
}
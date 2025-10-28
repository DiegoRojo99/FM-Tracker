
export type AlgoliaCompetition = {
  objectID: string; // Algolia requires a unique identifier
  name: string; // e.g., "J2 League"
  id: number; // API-sports ID, e.g., 99
  countryId: string; // e.g., "JP"
  type: 'League' | 'Cup' | string; // Optional enum, fallback to string for flexibility
  logo: string; // URL to competition logo
  countryCode: string; // e.g., "JP"
  countryName: string; // e.g., "Japan"
  season: number; // e.g., 2023
  inFootballManager: boolean; // e.g., false
  isFemale?: boolean; // Indicates if the competition is a female league (optional)
  seasons: number[]; // Array of supported seasons (e.g., [2023, 2025])
};

export type AlgoliaTeam = {
  objectID: string; // Algolia requires a unique identifier
  name: string; // e.g., "Ferencvarosi TC"
  id: number; // API-sports ID, e.g., 651
  logo: string; // URL to team logo
  countryCode: string; // e.g., "HU"
  leagueId: number; // e.g., 271
  season: number; // e.g., 2023
  national: boolean; // e.g., false
  coordinates: Record<string, unknown>; // e.g., {}
  path: string; // e.g., "teams/651"
  lastmodified: {
    _operation: string; // e.g., "IncrementSet"
    value: number; // e.g., 1750009571588
  };
  isFemale?: boolean; // Indicates if the team is a women's team (optional)
};

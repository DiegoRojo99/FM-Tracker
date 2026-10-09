
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
  isFemale?: boolean | null; // Indicates if the team is a women's team (optional)
};

import { TeamInput } from "./InsertDB"

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
};

export type TeamWithDetails = TeamInput & {
  id: string
  competition?: Competition
  country?: Country
}

export type GroupedTeamsByLeague = {
  leagueId: number;
  teams: Team[];
}

export type GroupedTeamsByLeagueWithCoords = {
  leagueId: number;
  teams: Team[];
  teamsWithCoords: number;
}
import { 
  Team as PrismaTeam, 
  TeamSeason as PrismaTeamSeason 
} from '../../../../prisma/generated/client';

export type Team = PrismaTeam;

export type GroupedTeamsByLeague = {
  leagueId: number;
  teams: Team[];
}

export type GroupedTeamsByLeagueWithCoords = {
  leagueId: number;
  teams: Team[];
  teamsWithCoords: number;
}

// Season-specific team data
export type TeamSeason = PrismaTeamSeason;
import { 
  Team as PrismaTeam, 
  TeamSeason as PrismaTeamSeason 
} from '../../../../prisma/generated/client';

export type Team = PrismaTeam;
export type TeamSeason = PrismaTeamSeason;
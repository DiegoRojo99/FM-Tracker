import { CareerStint as PrismaStint } from '../../../../prisma/generated/client';
import { Team } from './Team';

export type CareerStint = PrismaStint;
export type FullCareerStint = CareerStint & {
  team: Team | null;
};

export type CareerStintInput = Omit<CareerStint, 'id' | 'teamName' | 'teamLogo' | 'createdAt' | 'updatedAt'> & {
  leagueId?: string | null;
};
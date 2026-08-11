import { prisma } from '@/lib/db/prisma';
import { CompetitionGroup } from '../../../prisma/generated/client';

export async function fetchCompetition(competitionId: number): Promise<CompetitionGroup | null> {
  const competition = await prisma.competitionGroup.findUnique({
    where: {
      id: competitionId,
    },
  });

  return competition;
}

export function normalizeCompetitionType(type: string | null): string | null {
  if (!type) return null;
  // Canonical ALL_CAPS types are passed through as-is.
  if (type === type.toUpperCase() && type.includes('_')) return type;
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export async function getInFootballManagerCountryCodes(): Promise<string[]> {
  const countries = await prisma.country.findMany({
    where: { inFootballManager: true },
    select: { code: true },
  })

  return countries.map((country) => country.code)
}

interface GetActiveCompetitionsOptions {
  countries?: string[]
  type?: string | null
  types?: string[]
  isFemale?: boolean | null
}

export async function getActiveCompetitions(options: GetActiveCompetitionsOptions = {}): Promise<CompetitionGroup[]> {
  const countriesToQuery = options.countries && options.countries.length > 0
    ? options.countries
    : await getInFootballManagerCountryCodes();

  const typeFilter = options.types && options.types.length > 0
    ? { type: { in: options.types } }
    : options.type
      ? { type: normalizeCompetitionType(options.type) ?? undefined }
      : {};

  const womenNameMatcher = {
    OR: [
      { name: { contains: 'women', mode: 'insensitive' as const } },
      { displayName: { contains: 'women', mode: 'insensitive' as const } },
      { name: { contains: 'femenino', mode: 'insensitive' as const } },
      { displayName: { contains: 'femenino', mode: 'insensitive' as const } },
      { name: { contains: 'feminine', mode: 'insensitive' as const } },
      { displayName: { contains: 'feminine', mode: 'insensitive' as const } },
      { name: { contains: 'féminin', mode: 'insensitive' as const } },
      { displayName: { contains: 'féminin', mode: 'insensitive' as const } },
      { name: { contains: 'feminina', mode: 'insensitive' as const } },
      { displayName: { contains: 'feminina', mode: 'insensitive' as const } },
    ],
  };

  const mappedWomenCompetitionMatcher = {
    apiCompetitions: {
      some: {
        apiCompetition: {
          teamSeasons: {
            some: {
              team: { isFemale: true },
            },
          },
        },
      },
    },
  };

  const genderFilter = options.isFemale === null || options.isFemale === undefined
    ? {}
    : options.isFemale
      ? {
        OR: [womenNameMatcher, mappedWomenCompetitionMatcher],
      }
      : {
        NOT: womenNameMatcher,
      };

  return prisma.competitionGroup.findMany({
    where: {
      isActive: true,
      countryCode: { in: countriesToQuery },
      ...typeFilter,
      ...genderFilter,
    },
  });
}
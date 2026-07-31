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
  if (!type) return null
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
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
}

export async function getActiveCompetitions(options: GetActiveCompetitionsOptions = {}): Promise<CompetitionGroup[]> {
  const countriesToQuery = options.countries && options.countries.length > 0
    ? options.countries
    : await getInFootballManagerCountryCodes();

  const normalizedType = normalizeCompetitionType(options.type ?? null)
  return prisma.competitionGroup.findMany({
    where: {
      isActive: true,
      countryCode: { in: countriesToQuery },
      ...(normalizedType ? { type: normalizedType } : {}),
    },
  })
}
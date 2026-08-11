import { Team } from "../types/prisma/Team";
import { prisma } from "./prisma";

export async function fetchTeam(teamId: number): Promise<Team | null> {
  return await prisma.team.findUnique({
    where: {
      id: teamId,
    },
  });
}

export async function fetchTeamsByName(name: string): Promise<Team[]> {
  return await prisma.team.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
  });
}

export async function fetchTeamsByIds(ids: number[]) {
  return await prisma.team.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}

export async function fetchAllTeams() {
  return await prisma.team.findMany();
}

function getSeasonFromGameId(gameId: string): string {
  if (gameId.includes('fm24')) return '2023/2024'
  if (gameId.includes('fm25')) return '2024/2025'
  if (gameId.includes('fm26')) return '2025/2026'
  return '2023/2024'
}

async function getApiCompetitionIdsFromLeagueId(leagueId: number): Promise<number[]> {
  const competitions = await prisma.competitionGroup.findMany({
    where: { id: leagueId },
    include: { apiCompetitions: true },
  })

  return competitions.flatMap((competition) =>
    competition.apiCompetitions.map((apiCompetition) => apiCompetition.apiCompetitionId)
  )
}

function isWomenCompetitionName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /women|femenino|feminine|féminin|feminina/i.test(name);
}

export async function fetchTeamsByLeague(leagueId: number, gameId?: string | null): Promise<Team[]> {
  const season = gameId ? getSeasonFromGameId(gameId) : null
  const apiCompetitionIds = await getApiCompetitionIdsFromLeagueId(leagueId)

  if (apiCompetitionIds.length > 0) {
    const seasonFilteredTeams = await prisma.team.findMany({
      where: {
        teamSeasons: {
          some: {
            apiCompetitionId: { in: apiCompetitionIds },
            ...(season ? { season } : {}),
          },
        },
      },
    })

    if (seasonFilteredTeams.length > 0) return seasonFilteredTeams;

    // Fallback to any season for this league when data for the selected game season is missing.
    const anySeasonTeams = await prisma.team.findMany({
      where: {
        teamSeasons: {
          some: {
            apiCompetitionId: { in: apiCompetitionIds },
          },
        },
      },
    })

    if (anySeasonTeams.length > 0) return anySeasonTeams;
  }

  // Last-resort fallback when competition-to-team mappings are incomplete.
  const competitionGroup = await prisma.competitionGroup.findUnique({
    where: { id: leagueId },
    select: { countryCode: true, name: true, displayName: true },
  });

  if (!competitionGroup) return [];

  const isWomenLeague =
    isWomenCompetitionName(competitionGroup.name) ||
    isWomenCompetitionName(competitionGroup.displayName);

  return prisma.team.findMany({
    where: {
      countryCode: competitionGroup.countryCode,
      national: false,
      ...(isWomenLeague
        ? { isFemale: true }
        : { isFemale: { not: true } }),
    },
    orderBy: { name: 'asc' },
    take: 200,
  });
}
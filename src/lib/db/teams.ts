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

export async function fetchTeamsByLeague(leagueId: number, gameId?: string | null): Promise<Team[]> {
  const season = gameId ? getSeasonFromGameId(gameId) : null
  const apiCompetitionIds = await getApiCompetitionIdsFromLeagueId(leagueId)
  if (apiCompetitionIds.length === 0) return []

  return prisma.team.findMany({
    where: {
      teamSeasons: {
        some: {
          apiCompetitionId: { in: apiCompetitionIds },
          ...(season ? { season } : {}),
        },
      },
    },
  })
}
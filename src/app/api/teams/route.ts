import { prisma } from '@/lib/db/prisma';
import { Team } from '@/lib/types/prisma/Team';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get('leagueId');
  const gameId = req.nextUrl.searchParams.get('gameId');
  const nameParam = req.nextUrl.searchParams.get('name');

  if (leagueId) {
    if (isNaN(Number(leagueId))) return NextResponse.json([], { status: 400 });
    const teams = await searchTeamsByLeague(leagueId, gameId);
    return NextResponse.json(teams, { status: 200 });
  }
  else if (nameParam) {
    if (!nameParam) return NextResponse.json([], { status: 400 });
    const teams = await searchTeamsByName(nameParam);
    return NextResponse.json(teams, { status: 200 });
  }
}

function getSeasonFromGameId(gameId: string): string {
  if (gameId.includes('fm24')) return '2023/24';
  if (gameId.includes('fm25')) return '2024/25';
  if (gameId.includes('fm26')) return '2025/26';
  return '2023/24';
}

async function getApiCompetitionIdsFromLeagueId(leagueId: number): Promise<number[]> {
  return await prisma.competitionGroup.findMany({
    where: {
      id: leagueId,
    },
    include: {
      apiCompetitions: true,
    },
  }).then(results => results.flatMap(r => r.apiCompetitions.map(ac => ac.apiCompetitionId)));
}

async function searchTeamsByLeague(leagueId: string, gameId: string | null): Promise<Team[]> {
    const season = gameId ? getSeasonFromGameId(gameId) : null;
    console.log('Searching teams for leagueId:', leagueId, 'season:', season);
    const apiCompetitionIds = await getApiCompetitionIdsFromLeagueId(Number(leagueId));
    console.log('Found API Competition IDs:', apiCompetitionIds);

    if (apiCompetitionIds.length === 0) {
      return [];
    }

    const teams = await prisma.team.findMany({
      where: {
        teamSeasons: {
          some: {
            apiCompetitionId: { in: apiCompetitionIds },
            ...(season ? { season } : {}),
          },
        },
      },
    });
    console.log('Found teams:', teams.length);
    return teams;
}

async function searchTeamsByName(name: string): Promise<Team[]> {
  return await prisma.team.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
  });
}
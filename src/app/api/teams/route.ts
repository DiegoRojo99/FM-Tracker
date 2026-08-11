import { NextRequest, NextResponse } from 'next/server';
import { readThroughCache } from '@/lib/cache/redis';
import { fetchTeamsByLeague, fetchTeamsByName } from '@/lib/db/teams';

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get('leagueId');
  const gameId = req.nextUrl.searchParams.get('gameId');
  const nameParam = req.nextUrl.searchParams.get('name');

  if (leagueId) {
    if (isNaN(Number(leagueId))) return NextResponse.json([], { status: 400 });
    const cacheKey = `teams:v2:league:${leagueId}:game:${gameId ?? 'any'}`;
    const { data: teams, cacheStatus } = await readThroughCache(
      cacheKey,
      60 * 10,
      () => fetchTeamsByLeague(Number(leagueId), gameId)
    );

    return NextResponse.json(teams, {
      status: 200,
      headers: { 'x-cache': cacheStatus }
    });
  }
  else if (nameParam) {
    if (!nameParam) return NextResponse.json([], { status: 400 });
    const teams = await fetchTeamsByName(nameParam);
    return NextResponse.json(teams, { status: 200 });
  }
  
  return NextResponse.json([], { status: 400 });
}
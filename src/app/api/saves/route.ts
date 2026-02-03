import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { fetchCompetition } from '@/lib/db/competitions';
import { addChallengeForCountry, addChallengeForTeam } from '@/lib/db/challenges';
import { getUserPreviewSaves } from '@/lib/db/saves';
import { Save } from '@/lib/types/prisma/Save';
import { fetchTeam } from '@/lib/db/teams';
import { prisma } from '@/lib/db/prisma';
import { CareerStint } from '@/lib/types/prisma/Career';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userSaves = await getUserPreviewSaves(uid);
    if (!userSaves || userSaves.length === 0) {
      return new Response('No saves found', { status: 404 });
    }

    return new Response(JSON.stringify(userSaves), { status: 200 });
  });
}

function getSeasonFromGameId(gameId: string): string {
  if (gameId.includes('fm24')) return '2023/24';
  if (gameId.includes('fm25')) return '2024/25';
  if (gameId.includes('fm26')) return '2025/26';
  return '2023/24';
}

function getStartDateFromGameId(gameId: string): string {
  if (gameId.includes('fm24')) return '2023-07-01';
  if (gameId.includes('fm25')) return '2024-07-01';
  if (gameId.includes('fm26')) return '2025-07-01';
  return '2023-07-01';
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    // Parse request body
    const body = await req.json();
    const { countryCode, leagueId, startingTeamId, gameId } = body;

    // Validate team id
    const startingTeam = !startingTeamId ? null : await fetchTeam(Number(startingTeamId));
    if (!startingTeam) return new Response('Invalid starting team ID', { status: 400 });

    // Validate league id
    const currentLeagueData = await fetchCompetition(Number(leagueId));
    if (!currentLeagueData) return new Response('Invalid league ID', { status: 400 });

    // Validate required fields
    const gameIdToUse = gameId || 'fm26';
    const currentClubId = startingTeam && !startingTeam.national ? startingTeam.id : null;
    const currentNTId = startingTeam && startingTeam.national ? startingTeam.id : null;
    const saveId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Prepare save data
    const saveInputData: Save = {
      id: saveId,
      userId: uid,
      gameId: gameIdToUse,
      countryCode: countryCode || null,
      currentClubId: currentClubId,
      currentNTId: currentNTId,
      currentLeagueId: Number(leagueId) || null,
      season: getSeasonFromGameId(gameIdToUse),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create save in database with connected team and league data
    const docRef = await prisma.save.create({
      data: saveInputData,
    });

    // Create a starting career stint
    const careerStintInputData: Omit<CareerStint, 'id'> = {
      saveId: docRef.id,
      teamId: Number(startingTeamId),
      startDate: getStartDateFromGameId(gameIdToUse),
      endDate: null,
      isNational: startingTeam ? startingTeam.national : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create career stint in database
    await prisma.careerStint.create({
      data: careerStintInputData,
    });
    
    // Check if the team has any matching challenges
    await addChallengeForTeam(docRef.id, Number(startingTeamId));
    await addChallengeForCountry(docRef.id, countryCode);

    return new Response(JSON.stringify(saveInputData), { status: 201 });
  });
}
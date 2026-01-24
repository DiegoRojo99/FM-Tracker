import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { Save, SaveTeam, SaveWithoutId } from '@/lib/types/Save';
import { Team } from '@/lib/types/firebase/Team';
import admin from 'firebase-admin';
import { adminDB } from '@/lib/auth/firebase-admin';

const { Timestamp } = admin.firestore;
import { fetchCompetition } from '@/lib/db/competitions';
import { addChallengeForCountry, addChallengeForTeam } from '@/lib/db/challenges';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Reference user's saves subcollection
    const savesRef = adminDB.collection('users').doc(uid).collection('saves');
    const savesSnapshot = await savesRef.get();

    if (savesSnapshot.empty) {
      return new Response('No saves found', { status: 404 });
    }

    // Map docs to JSON
    const saves = savesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Save[];
    return new Response(JSON.stringify(saves), { status: 200 });
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

    const body = await req.json();
    const { countryCode, leagueId, startingTeamId, gameId } = body;

    let currentClub: SaveTeam | null = null;
    let currentNT: SaveTeam | null = null;
    const gameIdToUse = gameId || 'fm26';

    if (!startingTeamId) {
      // If no starting team, we can create an unemployed save
      const saveData: SaveWithoutId = {
        userId: uid,
        gameId: gameIdToUse,
        countryCode: null,
        currentClub: null,
        currentNT: null,
        currentLeague: null,
        season: getSeasonFromGameId(gameIdToUse),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const savesRef = adminDB.collection('users').doc(uid).collection('saves');
      const docRef = await savesRef.add(saveData);
      return new Response(JSON.stringify({ id: docRef.id, ...saveData }), { status: 201 });
    }
    
    // Validate startingTeamId
    const teamDoc = adminDB.collection('teams').doc(String(startingTeamId));
    if (!teamDoc) return new Response('Invalid team ID', { status: 400 });

    // Fetch the team document
    const teamSnapshot = await teamDoc.get();
    if (!teamSnapshot.exists) return new Response('Starting team not found', { status: 404 });

    const teamData = teamSnapshot.data() as Team;
    const saveTeam: SaveTeam = {
      id: teamData.id,
      name: teamData.name,
      logo: teamData.logo,
    };

    if (teamData.national) currentNT = saveTeam;
    else currentClub = saveTeam;

    const currentLeagueData = await fetchCompetition(countryCode, String(leagueId));
    if (!currentLeagueData) {
      return new Response('Invalid league ID or country code', { status: 404 });
    }

    const currentLeague: SaveTeam = {
      id: currentLeagueData.id,
      name: currentLeagueData.name,
      logo: currentLeagueData.logo || '',
    };

    const saveData: SaveWithoutId = {
      userId: uid,
      gameId: gameIdToUse,
      countryCode,
      currentClub,
      currentNT,
      currentLeague,
      season: getSeasonFromGameId(gameIdToUse),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const savesRef = adminDB.collection('users').doc(uid).collection('saves');
    const docRef = await savesRef.add(saveData);

    // Create a starting career stint
    const careerStintData = {
      teamId: String(startingTeamId),
      leagueId,
      countryCode,
      startDate: getStartDateFromGameId(gameIdToUse),
      endDate: null,
      createdAt: Timestamp.now(),
      isNational: !!currentNT,
      teamName: currentClub?.name || currentNT?.name,
      teamLogo: currentClub?.logo || currentNT?.logo,
    };

    const stintsRef = adminDB.collection('users').doc(uid).collection('saves').doc(docRef.id).collection('career');
    stintsRef.add(careerStintData);
    
    // Check if the team has any matching challenges
    await addChallengeForTeam(uid, docRef.id, String(startingTeamId));
    await addChallengeForCountry(uid, docRef.id, countryCode);

    return new Response(JSON.stringify({ id: docRef.id, ...saveData }), { status: 201 });
  });
}
import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { Save, SaveTeam } from '@/lib/types/Save';
import { Team } from '@/lib/types/Team';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDB } from '@/lib/auth/firebase-admin';

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

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { countryCode, leagueId, startingTeamId } = body;
    if (!countryCode || !leagueId) {
      return new Response('Missing required fields', { status: 400 });
    }

    let currentClub: SaveTeam | null = null;
    let currentNT: SaveTeam | null = null;

    if (startingTeamId) {
      console.log(`Fetching starting team with ID: ${startingTeamId}`);
      const teamDoc = adminDB.collection('teams').doc(String(startingTeamId));
      if (!teamDoc) return new Response('Invalid team ID', { status: 400 });
      console.log(`Fetching team document: ${teamDoc.path}`);
      const teamSnapshot = await teamDoc.get();
      if (!teamSnapshot.exists) return new Response('Starting team not found', { status: 404 });

      const teamData = teamSnapshot.data() as Team;
      const saveTeam: SaveTeam = {
        id: teamData.id,
        name: teamData.name,
        logo: teamData.logo,
      };

      if (teamData.national) {
        currentNT = saveTeam;
      } else {
        currentClub = saveTeam;
      }
    }

    const saveData = {
      userId: uid,
      countryCode,
      leagueId,
      currentClub,
      currentNT,
      createdAt: Timestamp.now(),
    };

    const savesRef = adminDB.collection('users').doc(uid).collection('saves');
    const docRef = await savesRef.add(saveData);

    // Create a starting career stint if a startingTeamId is provided
    if (startingTeamId) {
      const careerStintData = {
        teamId: startingTeamId,
        leagueId,
        countryCode,
        startDate: '2023-07-01',
        endDate: null,
        createdAt: Timestamp.now(),
        isNational: !!currentNT,
        teamName: currentClub?.name || currentNT?.name,
        teamLogo: currentClub?.logo || currentNT?.logo,
      };

      const stintsRef = adminDB.collection('users').doc(uid).collection('saves').doc(docRef.id).collection('career');
      stintsRef.add(careerStintData);
    }

    return new Response(JSON.stringify({ id: docRef.id, ...saveData }), { status: 201 });
  });
}
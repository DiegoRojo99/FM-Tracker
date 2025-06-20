import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { GetTeamData } from '../teams/[id]/GetTeamData';
import { GetLeagueData } from '../leagues/GetLeagueData';
import { Save, SaveWithDetails } from '@/lib/types/Save';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Reference user's saves subcollection
    const savesRef = collection(db, 'users', uid, 'saves');
    const savesSnapshot = await getDocs(savesRef);

    if (savesSnapshot.empty) {
      return new Response('No saves found', { status: 404 });
    }

    // Map docs to JSON
    const saves = savesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Save[];
    
    // Add team and league details to each save
    const savesWithDetails = await Promise.all(saves.map(addSaveDetails));
    return new Response(JSON.stringify(savesWithDetails), { status: 200 });
  });
}

async function addSaveDetails(save: Save): Promise<SaveWithDetails> {
  const teamData = save.startingTeamId ? await GetTeamData(String(save.startingTeamId)) : null;
  const leagueData = (save.countryCode && save.leagueId) ? await GetLeagueData(String(save.countryCode), String(save.leagueId)) : null;
  return {...save, team: teamData, league: leagueData };
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      console.error('Unauthorized access attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();

    // Reference user's saves subcollection
    const savesRef = collection(db, 'users', uid, 'saves');

    // Add userId to the document explicitly for easier querying
    const saveData = {
      ...body,
      userId: uid,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(savesRef, saveData);

    // Create a starting career stint if a startingTeamId is provided
    if (body.startingTeamId) {
      const careerStintData = {
        teamId: body.startingTeamId,
        leagueId: body.leagueId,
        countryCode: body.countryCode,
        startDate: '2023-07-01',
        endDate: null,
      };

      // Reference user's career stints subcollection
      const careerStintsRef = collection(db, 'users', uid, 'saves', docRef.id, 'career');
      await addDoc(careerStintsRef, careerStintData);
    }
    
    // Return the created save with its ID
    return new Response(JSON.stringify({ id: docRef.id, ...saveData }), { status: 201 });
  });
}
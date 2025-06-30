import { db } from '@/lib/db/firebase';
import { withAuth } from '@/lib/auth/withAuth';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  PartialWithFieldValue
} from 'firebase/firestore';
import { NextRequest } from 'next/server';
import { CareerStintInput } from '@/lib/types/InsertDB';
import { fetchTeam } from '@/lib/db/teams';
import { fetchCompetition } from '@/lib/db/competitions';
import { Save } from '@/lib/types/Save';
import { addChallengeForCountry, addChallengeForTeam } from '@/lib/db/challenges';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const { id } = await context.params;
    if (!id) return new Response('Save ID is required', { status: 400 });

    const body = await req.json();
    if (!body.teamId || !body.startDate) {
      return new Response('Missing required fields', { status: 400 });
    }

    const startDate = new Date(body.startDate);
    const formattedStartDate = formatDate(startDate);

    const teamData = await fetchTeam(String(body.teamId));
    if (!teamData) return new Response('Team not found', { status: 404 });

    const isNational = teamData.national ?? false;
    if (!isNational && !teamData.leagueId) {
      return new Response('Club teams must have a leagueId', { status: 400 });
    }

    // Find latest stint of the same type (club/national) with no endDate
    const stintsRef = collection(db, 'users', uid, 'saves', id, 'career');
    const stintQuery = query(
      stintsRef,
      where('isNational', '==', isNational),
      where('endDate', '==', null),
      orderBy('startDate', 'desc'),
      limit(1)
    );

    const stintSnap = await getDocs(stintQuery);
    if (!stintSnap.empty) {
      const lastStint = stintSnap.docs[0];
      await updateDoc(lastStint.ref, {
        endDate: formattedStartDate,
      });
    }

    const leagueId = body.leagueId && !isNational ? String(body.leagueId) : String(teamData.leagueId);
    const newStint: CareerStintInput = {
      teamId: String(teamData.id),
      teamLogo: teamData.logo,
      teamName: teamData.name,
      leagueId,
      startDate: formattedStartDate,
      endDate: body.endDate ? formatDate(new Date(body.endDate)) : null,
      isNational,
      countryCode: teamData.countryCode ?? 'Unknown',
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(stintsRef, newStint);

    const competitionData = !isNational ? await fetchCompetition(teamData.countryCode, leagueId) : null;
    if (!competitionData) {
      console.warn(`⚠️ Skipping team ${teamData.name} — no competition found for country "${teamData.countryCode}" and league "${leagueId}"`);
    }

    // Update save doc with current team
    const saveRef = doc(db, 'users', uid, 'saves', id);
    const saveUpdateField = isNational ? 'currentNT' : 'currentClub';
    
    const updateData: PartialWithFieldValue<Save> = {
      [saveUpdateField]: {
        id: teamData.id,
        name: teamData.name,
        logo: teamData.logo,
      },
    };

    // Only add `currentLeague` if `competitionData` exists and not national team
    if (competitionData && !isNational) {
      updateData.currentLeague = {
        id: competitionData.id,
        name: competitionData.name,
        logo: competitionData.logo || '',
      };
    }

    // Check if the team has any matching challenges
    await addChallengeForTeam(uid, id, String(body.teamId));
    await addChallengeForCountry(uid, id, teamData.countryCode);

    await updateDoc(saveRef, updateData);
    return new Response(JSON.stringify({ id: docRef.id, ...newStint }), {
      status: 201,
    });
  });
}
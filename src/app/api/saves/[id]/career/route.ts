import { db } from '@/lib/firebase';
import { withAuth } from '@/lib/auth/withAuth';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { NextRequest } from 'next/server';
import { CareerStintInput } from '@/lib/types/InsertDB';
import { Team } from '@/lib/types/Team';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (uid) => {

    // Ensure user is authenticated
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Extract the save ID from the request parameters
    const { id } = await context.params;
    if (!id) {
      return new Response('Save ID is required', { status: 400 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.teamId || !body.startDate) {
      return new Response('Missing required fields', { status: 400 });
    }

    const stintsRef = collection(
      db,
      'users',
      uid,
      'saves',
      id,
      'career'
    );

    function formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    
    const teamSnapshot = await getDoc(doc(db, 'users', uid, 'teams', body.teamId));
    if (!teamSnapshot.exists()) {
      return new Response('Team not found', { status: 404 });
    }
    const teamData = teamSnapshot.data() as Team;

    const newStint: CareerStintInput = {
      teamId: body.teamId,
      teamLogo: teamData.logo,
      teamName: teamData.name,
      leagueId: String(teamData.leagueId),
      startDate: formatDate(new Date(body.startDate)),
      endDate: body.endDate ? formatDate(new Date(body.endDate)) : null,
      isNational: teamData.national || false,
      countryCode: teamData.countryCode || 'Unknown',
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(stintsRef, newStint);

    return new Response(JSON.stringify({ id: docRef.id, ...newStint }), {
      status: 201,
    });
  });
}

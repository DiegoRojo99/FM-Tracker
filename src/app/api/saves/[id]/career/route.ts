import { db } from '@/lib/firebase';
import { withAuth } from '@/lib/auth/withAuth';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { NextRequest } from 'next/server';
import { CareerStintInput } from '@/lib/types/InsertDB';
import { Team } from '@/lib/types/Team';

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

    const teamSnapshot = await getDoc(doc(db, 'teams', body.teamId));
    if (!teamSnapshot.exists()) {
      return new Response('Team not found', { status: 404 });
    }

    const teamData = teamSnapshot.data() as Team;
    const isNational = teamData.national ?? false;

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

    const newStint: CareerStintInput = {
      teamId: body.teamId,
      teamLogo: teamData.logo,
      teamName: teamData.name,
      leagueId: String(teamData.leagueId),
      startDate: formattedStartDate,
      endDate: body.endDate ? formatDate(new Date(body.endDate)) : null,
      isNational,
      countryCode: teamData.countryCode ?? 'Unknown',
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(stintsRef, newStint);

    // Update save doc with current team
    const saveRef = doc(db, 'users', uid, 'saves', id);
    const saveUpdateField = isNational ? 'currentNT' : 'currentClub';
    await updateDoc(saveRef, {
      [saveUpdateField]: {
        id: teamData.id,
        name: teamData.name,
        logo: teamData.logo,
      },
      updatedAt: Timestamp.now(),
    });

    return new Response(JSON.stringify({ id: docRef.id, ...newStint }), {
      status: 201,
    });
  });
}
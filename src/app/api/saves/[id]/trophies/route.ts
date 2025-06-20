import { withAuth } from '@/lib/auth/withAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

// Auto-season inference if missing
function getSeasonFromDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return month > 6
    ? `${year}/${(year + 1).toString().slice(-2)}`
    : `${year - 1}/${year.toString().slice(-2)}`;
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }
    
    const body = await req.json();
    // Validate required fields
    if (!body.teamId || !body.competitionId || !body.dateWon || !body.countryCode) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Fetch team data
    const teamSnap = await getDoc(doc(db, 'teams', body.teamId));
    if (!teamSnap.exists()) throw new Error('Team not found');
    const teamData = teamSnap.data();

    // Fetch competition data
    const compSnap = await getDoc(doc(db, 'countries', body.countryCode, 'competitions', body.competitionId));
    if (!compSnap.exists()) throw new Error('Competition not found');
    const compData = compSnap.data();

    const season = getSeasonFromDate(body.dateWon);
    const dateWonString = typeof body.dateWon === 'string' ? body.dateWon : body.dateWon.toISOString().split('T')[0];

    const newTrophy = {
      teamId: body.teamId,
      teamName: teamData.name,
      teamLogo: teamData.logo,

      competitionId: body.competitionId,
      competitionName: compData.name,
      competitionLogo: compData.logo,

      dateWon: dateWonString,
      season,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'users', uid, 'saves', saveId, 'trophies'), newTrophy);
    return NextResponse.json({ id: docRef.id, ...newTrophy }, { status: 201 }); 
  });
}

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }

    const trophiesRef = collection(db, 'users', uid, 'saves', saveId, 'trophies');
    const snapshot = await getDocs(trophiesRef);

    const trophies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(trophies);
  });
}
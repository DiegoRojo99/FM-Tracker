import { db } from '@/lib/db/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get('leagueId');
  const nameParam = req.nextUrl.searchParams.get('name');
  if (leagueId) {
    if (isNaN(Number(leagueId))) return NextResponse.json([], { status: 400 });
    const teams = await searchTeamsByLeague(leagueId);
    return NextResponse.json(teams, { status: 200 });
  }
  else if (nameParam) {
    if (!nameParam) return NextResponse.json([], { status: 400 });
    const teams = await searchTeamsByName(nameParam);
    return NextResponse.json(teams, { status: 200 });
  }
}

async function searchTeamsByLeague(leagueId: string) {
    const q = query(collection(db, 'teams'), where('leagueId', '==', Number(leagueId)));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => doc.data());
    return data;
}

async function searchTeamsByName(name: string) {
    const q = query(collection(db, 'teams'), where('name', 'array-contains', name));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => doc.data());
    return data;
}
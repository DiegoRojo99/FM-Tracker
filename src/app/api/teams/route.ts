import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get('leagueId');
  if (!leagueId) return NextResponse.json([], { status: 400 });

  const q = query(collection(db, 'teams'), where('leagueId', '==', Number(leagueId)));
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => doc.data());
  return NextResponse.json(data);
}

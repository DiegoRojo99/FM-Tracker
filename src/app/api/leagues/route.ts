import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get('countryCode');
  if (!countryCode) return NextResponse.json([], { status: 400 });

  const q = query(collection(db, 'competitions'), where('countryCode', '==', countryCode));
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => doc.data());
  return NextResponse.json(data);
}

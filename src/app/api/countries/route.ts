import { db } from '@/lib/db/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  const q = query(collection(db, 'countries'), where('inFootballManager', '==', true));
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => doc.data());
  return NextResponse.json(data);
}

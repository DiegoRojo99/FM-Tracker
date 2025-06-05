import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  const snapshot = await getDocs(collection(db, 'countries'));
  const data = snapshot.docs.map(doc => doc.data());
  return NextResponse.json(data);
}

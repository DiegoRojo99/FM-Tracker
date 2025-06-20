import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { CareerStint } from '@/lib/types/Career';
import { Trophy } from '@/lib/types/Trophy';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      console.error('Unauthorized access attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!saveId) {
      return new Response('Save ID is required', { status: 400 });
    }

    // Fetch the save document from Firestore
    const saveSnapshot = await getDoc(doc(db, 'users', uid, 'saves', saveId));
    if (!saveSnapshot.exists()) {
      return new Response('Save not found', { status: 404 });
    }

    // Fetch the career data associated with the save
    const careersSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'career'));
    const careerData: CareerStint[] = careersSnapshot.docs.map(doc => doc.data() as CareerStint);

    // Fetch the trophies data associated with the save
    const trophiesSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'trophies'));
    const trophiesData: Trophy[] = trophiesSnapshot.docs.map(doc => doc.data() as Trophy);

    return new Response(JSON.stringify({ ...saveSnapshot.data(), career: careerData, trophies: trophiesData, id: saveId }), { status: 200 });
  });
}
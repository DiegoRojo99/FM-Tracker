import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { adminDB } from '@/lib/auth/firebase-admin';

// GET /api/users/[userId]/primary-save
export async function GET(request: NextRequest) {
  return withAuth(request, async (uid) => {
    try {
      // Get user's saves from the user's saves subcollection
      const savesRef = adminDB.collection('users').doc(uid).collection('saves');
      const savesSnapshot = await savesRef.get();
      const saves = savesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Find the primary save
      const primary = saves.find((save: any) => save.isPrimary === true) || null;
      return new Response(JSON.stringify(primary), { status: 200 });
    } 
    catch (error) {
      console.error('Error fetching primary save:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  });
}

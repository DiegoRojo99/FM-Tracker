import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest } from 'next/server';
import { adminDB } from '@/lib/auth/firebase-admin';
import { SaveWithChildren } from '@/lib/types/Save';
import { Trophy, TrophyGroup } from '@/lib/types/Trophy';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const savesRef = adminDB.collection('users').doc(uid).collection('saves');
    const savesSnap = await savesRef.get();
    if (savesSnap.empty) {
      return new Response('No saves found', { status: 404 });
    }

    const saves = savesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SaveWithChildren[];

    const groupedTrophies: TrophyGroup[] = [];
    await Promise.all(
      saves.map(async (save) => {
        const saveRef = adminDB.collection('users').doc(uid).collection('saves').doc(save.id);
        const trophiesSnap = await saveRef.collection('trophies').get();

        const saveTrophies: Trophy[] = trophiesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Trophy[];

        saveTrophies.forEach((trophy) => {
          const group = groupedTrophies.find((g) => g.competitionId === trophy.competitionId);
          if (group) {
            group.trophies.push(trophy);
          } 
          else {
            groupedTrophies.push({
              competitionId: trophy.competitionId,
              competitionName: trophy.competitionName,
              competitionLogo: trophy.competitionLogo,
              competitionType: trophy.competitionType,
              trophies: [trophy],
            });
          }
        });
      })
    );

    return new Response(JSON.stringify(groupedTrophies), { status: 200 });
  });
}
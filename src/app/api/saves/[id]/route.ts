import { db } from '@/lib/db/firebase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { FullDetailsSave } from '@/lib/types/prisma/Save';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    const save: FullDetailsSave | null = await prisma.save.findUnique({
      where: {
        id: saveId,
        userId: uid,
      },
      include: {
        currentLeague: true,
        currentClub: true,
        currentNT: true,
        game: true,
        careerStints: {
          include: {
            team: true,
          },
        },
        trophies: {
          include: {
            team: true,
            competitionGroup: true,
          },
        },
        seasons: {
          include: {
            team: true,
            leagueResult: {include: {competition: true}},
            cupResults: {include: {competition: true}},
          },
        },
        challenges: {
          include: {
            challenge: {
              include: {
                goals: {
                  include: {
                    competition: true,
                    country: true,
                    teams: true,
                  },
                },
              },
            },
            goalProgress: true,
            game: true,
          },
        }
      },
    });

    if (!saveId) {
      return new Response('Save ID is required', { status: 400 });
    }

    if (!save) {
      return new Response('Save not found', { status: 404 });
    }

    return new Response(JSON.stringify(save), { status: 200 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!saveId) {
      return new Response('Save ID is required', { status: 400 });
    }

    try {
      // Delete all subcollections first
      const saveRef = doc(db, 'users', uid, 'saves', saveId);
      
      // Delete career subcollection
      const careerSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'career'));
      const careerDeletePromises = careerSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      // Delete trophies subcollection
      const trophiesSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'trophies'));
      const trophiesDeletePromises = trophiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      // Delete seasons subcollection
      const seasonsSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'seasons'));
      const seasonsDeletePromises = seasonsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      // Delete challenges subcollection
      const challengesSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'challenges'));
      const challengesDeletePromises = challengesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      // Wait for all subcollection deletions to complete
      await Promise.all([
        ...careerDeletePromises,
        ...trophiesDeletePromises,
        ...seasonsDeletePromises,
        ...challengesDeletePromises
      ]);
      
      // Finally, delete the save document itself
      await deleteDoc(saveRef);

      return new Response('Save and all associated data deleted successfully', { status: 200 });
    } catch (error) {
      console.error('Error deleting save:', error);
      return new Response('Failed to delete save', { status: 500 });
    }
  });
}
import { db } from '@/lib/db/firebase';
import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { CareerStint } from '@/lib/types/Career';
import { Trophy } from '@/lib/types/Trophy';
import { SeasonSummary } from '@/lib/types/Season';
import { getChallengesForSave } from '@/lib/db/challenges';
import { Challenge } from '@/lib/types/Challenge';

export async function GET(req: NextRequest) {
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

    // Fetch the save document from Firestore
    const saveSnapshot = await getDoc(doc(db, 'users', uid, 'saves', saveId));
    if (!saveSnapshot.exists()) {
      return new Response('Save not found', { status: 404 });
    }

    // Fetch the career data associated with the save
    const careersSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'career'));
    const careerData: CareerStint[] = careersSnapshot.docs.map(doc => doc.data() as CareerStint)
      .sort((a, b) => {
        // Sort by start date, assuming startDate is a string
        return (a.startDate as string).localeCompare(b.startDate as string);
      });

    // Fetch the trophies data associated with the save
    const trophiesSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'trophies'));
    const trophiesData: Trophy[] = trophiesSnapshot.docs.map(doc => doc.data() as Trophy);

    // Fetch the seasons data associated with the save
    const seasonsSnapshot = await getDocs(collection(db, 'users', uid, 'saves', saveId, 'seasons'));
    const seasonsData: SeasonSummary[] = seasonsSnapshot.docs.map(doc => doc.data() as SeasonSummary);

    // Fetch challenges associated with the save
    const challenges: Challenge[] = await getChallengesForSave(uid, saveId);

    return new Response(JSON.stringify({ ...saveSnapshot.data(), career: careerData, trophies: trophiesData, seasons: seasonsData, challenges, id: saveId }), { status: 200 });
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
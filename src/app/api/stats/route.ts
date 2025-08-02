import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/firebase';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    // Get total number of users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get total number of saves across all users
    const savesSnapshot = await getDocs(collectionGroup(db, 'saves'));
    const totalSaves = savesSnapshot.size;

    // Get total number of seasons across all saves
    const seasonsSnapshot = await getDocs(collectionGroup(db, 'seasons'));
    const totalSeasons = seasonsSnapshot.size;

    // Get total number of career stints across all saves
    const careerSnapshot = await getDocs(collectionGroup(db, 'career'));
    const totalCareerStints = careerSnapshot.size;

    // Get total number of trophies from saves subcollections only
    let totalTrophies = 0;
    let totalChallenges = 0;

    // Iterate through each save to count trophies and challenges
    for (const saveDoc of savesSnapshot.docs) {
      const savePath = saveDoc.ref.path; // e.g., "users/uid/saves/saveId"
      
      // Count trophies in this save
      const trophiesSnapshot = await getDocs(collection(db, `${savePath}/trophies`));
      totalTrophies += trophiesSnapshot.size;
      
      // Count challenges in this save
      const challengesSnapshot = await getDocs(collection(db, `${savePath}/challenges`));
      totalChallenges += challengesSnapshot.size;
    }

    const stats = {
      totalUsers,
      totalSaves,
      totalTrophies,
      totalSeasons,
      totalCareerStints,
      totalChallenges,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}

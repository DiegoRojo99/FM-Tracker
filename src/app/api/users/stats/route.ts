import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { adminDB } from '@/lib/auth/firebase-admin';

interface UserStats {
  activeSaves: number;
  totalTrophies: number;
  totalMatches: number;
  currentSeasons: number;
  favoriteTeam?: string;
  longestSave?: string;
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (uid) => {
    try {
      // Get user's saves from the user's saves subcollection
      const savesRef = adminDB.collection('users').doc(uid).collection('saves');
      const savesSnapshot = await savesRef.get();

      const saves = savesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const activeSaves = saves.length;
      
      // Get total trophies from all saves
      let totalTrophies = 0;
      let currentSeasons = 0;
      let longestSaveId = '';
      let maxSeasons = 0;
      
      for (const save of saves) {
        // Count trophies for this save
        const trophiesRef = adminDB.collection('users').doc(uid).collection('saves').doc(save.id).collection('trophies');
        const trophiesSnapshot = await trophiesRef.get();
        
        totalTrophies += trophiesSnapshot.size;
        
        // Count current seasons for this save
        const seasonsRef = adminDB.collection('users').doc(uid).collection('saves').doc(save.id).collection('seasons');
        const seasonsSnapshot = await seasonsRef.get();
        
        const seasonCount = seasonsSnapshot.size;
        currentSeasons += seasonCount;
        
        // Track longest save
        if (seasonCount > maxSeasons) {
          maxSeasons = seasonCount;
          longestSaveId = save.id;
        }
      }

      // Get favorite team (most used team across saves)
      const teamUsage: { [key: string]: number } = {};
      
      for (const save of saves) {
        const saveData = save as any;
        // Check both currentClub and currentNT for team information
        const currentTeam = saveData.currentClub || saveData.currentNT;
        if (currentTeam && currentTeam.name) {
          teamUsage[currentTeam.name] = (teamUsage[currentTeam.name] || 0) + 1;
        }
      }

      const favoriteTeam = Object.keys(teamUsage).length > 0 
        ? Object.entries(teamUsage).reduce((a, b) => teamUsage[a[0]] > teamUsage[b[0]] ? a : b)[0]
        : undefined;

      // Get longest save name
      let longestSaveName: string | undefined;
      if (longestSaveId) {
        const longestSave = saves.find((save: any) => save.id === longestSaveId) as any;
        if (longestSave) {
          const currentTeam = longestSave.currentClub || longestSave.currentNT;
          if (currentTeam && currentTeam.name) {
            longestSaveName = currentTeam.name;
          } else {
            longestSaveName = 'Free Agent Career';
          }
        }
      }

      const userStats: UserStats = {
        activeSaves,
        totalTrophies,
        totalMatches: 0, // Set to 0 as requested
        currentSeasons,
        favoriteTeam,
        longestSave: longestSaveName
      };

      return new Response(JSON.stringify(userStats), { status: 200 });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500 }
      );
    }
  });
}
import { db } from '@/lib/db/firebase';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Trophy } from '../types/Trophy';
import { fetchCompetition } from './competitions';
import { fetchTeam } from './teams';

export async function addTrophyToSave(
  { teamId, competitionId, countryCode, uid, season, saveId }: 
  {
    teamId: string;
    competitionId: string;
    countryCode: string;
    uid: string;
    season: string;
    saveId: string;
  }
): Promise<string | null> {
  try {
    
    // Check for existing trophy
    const trophiesRef = collection(db, 'users', uid, 'saves', saveId, 'trophies');
    const existingQuery = query(
      trophiesRef,
      where('competitionId', '==', competitionId),
      where('season', '==', season)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      console.log('Trophy already exists for this competition and season');
      return null;
    }

    const competition = await fetchCompetition(countryCode, competitionId);
    if (!competition) throw new Error('Competition not found');

    const team = await fetchTeam(teamId);
    if (!team) throw new Error('Team not found');
    
    const ref = doc(trophiesRef); 
    const trophyData: Trophy = {
      id: competitionId,
      teamId: teamId,
      teamName: team.name,
      teamLogo: team.logo,
      competitionId: competitionId,
      competitionName: competition.name,
      competitionLogo: competition.logo,
      competitionType: competition.type,
      season: season,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, trophyData);
    return ref.id; // Return the ID of the newly created trophy
  } 
  catch (error) {
    console.error('Error adding trophy to save:', error);
    return null;
  }
}

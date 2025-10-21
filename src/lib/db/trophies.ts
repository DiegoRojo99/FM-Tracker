import { db } from '@/lib/db/firebase';
import { collection, doc, getDocs, query, setDoc, where, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Trophy } from '../types/Trophy';
import { fetchCompetition } from './competitions';
import { fetchTeam } from './teams';
import { addChallengeForTrophy } from './challenges';

export async function addTrophyToSave(
  { teamId, competitionId, countryCode, uid, season, saveId, game }: 
  {
    teamId: string;
    competitionId: string;
    countryCode: string;
    uid: string;
    season: string;
    saveId: string;
    game: string;
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
      teamId: teamId,
      teamName: team.name,
      teamLogo: team.logo,
      competitionId: competitionId,
      competitionName: competition.name,
      competitionLogo: competition.logo,
      competitionType: competition.type,
      season: season,
      game: game,
      countryCode: countryCode,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, trophyData);

    // Check if the trophy matches any existing challenges
    await addChallengeForTrophy(uid, saveId, trophyData);

    return ref.id; // Return the ID of the newly created trophy
  } 
  catch (error) {
    console.error('Error adding trophy to save:', error);
    return null;
  }
}

export async function getTrophiesForSave(userId: string, saveId: string): Promise<Trophy[]> {
  const trophiesCol = collection(db, 'users', userId, 'saves', saveId, 'trophies');
  const trophySnapshot = await getDocs(trophiesCol);
  return trophySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trophy[];
}

export async function getAllTrophiesForUser(userId: string): Promise<Trophy[]> {
  const savesCol = collection(db, 'users', userId, 'saves');
  const savesSnapshot = await getDocs(savesCol);
  
  const trophies: Trophy[] = [];
  for (const saveDoc of savesSnapshot.docs) {
    const trophiesCol = collection(saveDoc.ref, 'trophies');
    const trophySnapshot = await getDocs(trophiesCol);
    trophySnapshot.forEach(doc => {
      trophies.push({ id: doc.id, ...doc.data() } as Trophy);
    });
  }
  
  return trophies;
}

export async function updateTrophy(
  uid: string,
  saveId: string,
  trophyId: string,
  updates: { teamId?: string; season?: string; countryCode?: string; competitionId?: string }
): Promise<boolean> {
  try {
    const trophyRef = doc(db, 'users', uid, 'saves', saveId, 'trophies', trophyId);
    
    // Get current trophy data
    const trophyDoc = await getDoc(trophyRef);
    if (!trophyDoc.exists()) {
      throw new Error('Trophy not found');
    }

    const currentTrophy = trophyDoc.data() as Trophy;
    
    // Prepare updated data
    const updateData: Partial<Trophy> = {};
    
    // If team is being updated, fetch new team data
    if (updates.teamId && updates.teamId !== currentTrophy.teamId) {
      const team = await fetchTeam(updates.teamId);
      if (!team) throw new Error('Team not found');
      updateData.teamId = updates.teamId;
      updateData.teamName = team.name;
      updateData.teamLogo = team.logo;
    }
    
    // If competition is being updated, fetch new competition data
    if (updates.competitionId && updates.competitionId !== currentTrophy.competitionId) {
      const countryCode = updates.countryCode || currentTrophy.countryCode;
      const competition = await fetchCompetition(countryCode, updates.competitionId);
      if (!competition) throw new Error('Competition not found');
      updateData.competitionId = updates.competitionId;
      updateData.competitionName = competition.name;
      updateData.competitionLogo = competition.logo;
      updateData.competitionType = competition.type;
    }
    
    // Update season if provided
    if (updates.season && updates.season !== currentTrophy.season) {
      updateData.season = updates.season;
    }
    
    // Update country code if provided
    if (updates.countryCode && updates.countryCode !== currentTrophy.countryCode) {
      updateData.countryCode = updates.countryCode;
    }

    await updateDoc(trophyRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating trophy:', error);
    return false;
  }
}

export async function deleteTrophy(uid: string, saveId: string, trophyId: string): Promise<boolean> {
  try {
    const trophyRef = doc(db, 'users', uid, 'saves', saveId, 'trophies', trophyId);
    await deleteDoc(trophyRef);
    return true;
  } catch (error) {
    console.error('Error deleting trophy:', error);
    return false;
  }
}
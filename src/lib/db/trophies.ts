import { fetchCompetition } from './competitions';
import { fetchTeam } from './firebase/teams';
import { addChallengeForTrophy } from './challenges';
import { Trophy } from '../../../prisma/generated/client';
import { prisma } from './prisma';
import { FullTrophy } from '../types/prisma/Trophy';

export async function addTrophyToSave(
  { teamId, competitionId, uid, season, saveId, game }: 
  {
    teamId: number;
    competitionId: number;
    uid: string;
    season: string;
    saveId: string;
    game: string;
  }
): Promise<number | null> {
  try {
    // Check for existing trophy
    const existingTrophy = await prisma.trophy.findFirst({
      where: {
        competitionGroupId: competitionId,
        season: season,
        saveId: saveId,
      }
    });
    
    if (existingTrophy) {
      console.log('Trophy already exists for this competition and season');
      return null;
    }

    const competition = await fetchCompetition(competitionId);
    if (!competition) throw new Error('Competition not found');

    const team = await fetchTeam(teamId);
    if (!team) throw new Error('Team not found');
    
    // Add new trophy
    const trophy: Trophy = await prisma.trophy.create({
      data: {
        gameId: game,
        saveId: saveId,
        season: season,
        teamId: Number(teamId),
        competitionGroupId: competitionId,
      }
    });

    // Check if the trophy matches any existing challenges
    await addChallengeForTrophy(uid, saveId, trophy);

    // Return the ID of the newly created trophy
    return trophy.id;
  } 
  catch (error) {
    console.error('Error adding trophy to save:', error);
    return null;
  }
}

export async function getTrophyById(trophyId: number): Promise<Trophy | null> {
  return await prisma.trophy.findFirst({
    where: { id: trophyId }
  })
}

export async function getTrophiesForSave(saveId: string): Promise<Trophy[]> {
  return await prisma.trophy.findMany({
    where: { saveId },
  });
}

export async function getAllTrophiesForUser(userId: string): Promise<FullTrophy[]> {
  return await prisma.trophy.findMany({
    where: { save: { userId } },
    include: {
      team: true,
      competitionGroup: true,
    },
  });
}

  export async function updateTrophy(
  trophyId: number,
  updates: { teamId?: number; season?: string; competitionId?: number }
): Promise<boolean> {
  try {
    const trophy = await getTrophyById(trophyId);
    if (!trophy) throw new Error('Trophy not found');
    
    // Prepare updated data
    const updateData: Partial<Trophy> = {};
    
    // If team is being updated, fetch new team data
    if (updates.teamId && updates.teamId !== trophy.teamId) {
      updateData.teamId = updates.teamId;
    }
    
    // If competition is being updated, fetch new competition data
    if (updates.competitionId && updates.competitionId !== trophy.competitionGroupId) {
      updateData.competitionGroupId = updates.competitionId;
    }
    
    // Update season if provided
    if (updates.season && updates.season !== trophy.season) {
      updateData.season = updates.season;
    }
    
    const updateResponse = await prisma.trophy.update({
      where: { id: trophyId },
      data: updateData,
    });
    return !!updateResponse;
  } 
  catch (error) {
    console.error('Error updating trophy:', error);
    return false;
  }
}

export async function deleteTrophy(trophyId: number): Promise<boolean> {
  try {
    const deletedTrophy = await prisma.trophy.delete({
      where: { id: trophyId }
    });
    return !!deletedTrophy;
  } 
  catch (error) {
    console.error('Error deleting trophy:', error);
    return false;
  }
}
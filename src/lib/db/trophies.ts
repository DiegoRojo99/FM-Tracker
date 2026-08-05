import { fetchCompetition } from './competitions';
import { fetchTeam } from './teams';
import { addChallengeForTrophy } from './challenges';
import { evaluateAchievementsForUser } from './achievements';
import { Trophy } from '../../../prisma/generated/client';
import { prisma } from './prisma';
import { FullTrophy } from '../types/prisma/Trophy';

function isPrismaP2002(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

function hasUniqueIdTarget(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return false;
  const meta = (error as { meta?: { target?: unknown } }).meta;
  if (!meta || !Array.isArray(meta.target)) return false;
  return meta.target.includes('id');
}

async function repairTrophyIdSequence(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Trophy"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Trophy"), 0) + 1,
      false
    )
  `);
}

async function createTrophyWithIdSequenceRecovery(data: {
  gameId: string;
  saveId: string;
  season: string;
  teamId: number;
  competitionGroupId: number;
}): Promise<Trophy> {
  try {
    return await prisma.trophy.create({ data });
  } catch (error) {
    if (!isPrismaP2002(error) || !hasUniqueIdTarget(error)) {
      throw error;
    }

    console.warn('Detected Trophy.id sequence drift. Repairing sequence and retrying create once...');
    await repairTrophyIdSequence();
    return await prisma.trophy.create({ data });
  }
}

export async function addTrophyToSave(
  { teamId, competitionId, uid, season, saveId }: 
  {
    teamId: number;
    competitionId: number;
    uid: string;
    season: string;
    saveId: string;
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

    const save = await prisma.save.findUnique({ where: { id: saveId } });
    if (!save) throw new Error('Save not found');
    
    // Add new trophy
    const trophy: Trophy = await createTrophyWithIdSequenceRecovery({
      gameId: save.gameId,
      saveId: saveId,
      season: season,
      teamId: Number(teamId),
      competitionGroupId: competitionId,
    });

    // Check if the trophy matches any existing challenges
    await addChallengeForTrophy(uid, saveId, trophy, competition.countryCode);

    await evaluateAchievementsForUser({
      userId: uid,
      saveId,
      gameId: save.gameId,
      eventType: 'trophy.added',
      eventTimestamp: new Date(),
    });

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

export async function countAllTrophiesForUser(userId: string): Promise<number> {
  return await prisma.trophy.count({
    where: { save: { userId } }
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
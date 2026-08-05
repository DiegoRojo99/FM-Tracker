import { fetchCompetition } from './competitions';
import { addChallengeForTrophy } from './challenges';
import { evaluateAchievementsForUser } from './achievements';
import { Trophy } from '../../../prisma/generated/client';
import { prisma } from './prisma';
import { FullTrophy } from '../types/prisma/Trophy';
import { fetchTeam } from './teams';

function isPrismaP2002(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

function hasUniqueIdTarget(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return false;
  const meta = (error as { meta?: { target?: unknown } }).meta;
  if (!meta) return false;

  if (Array.isArray(meta.target)) {
    return meta.target.some((target) => {
      if (typeof target !== 'string') return false;
      const normalized = target.toLowerCase();
      return normalized === 'id' || normalized.includes('trophy_pkey');
    });
  }

  if (typeof meta.target === 'string') {
    const normalized = meta.target.toLowerCase();
    return normalized === 'id' || normalized.includes('trophy_pkey');
  }

  return false;
}

function getPrismaP2002Target(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return 'unknown';
  const meta = (error as { meta?: { target?: unknown } }).meta;
  if (!meta || !('target' in meta)) return 'unknown';

  const target = meta.target;
  if (Array.isArray(target)) return target.map(String).join(', ');
  if (typeof target === 'string') return target;
  return 'unknown';
}

function getPrismaMetaJson(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return 'unknown';
  const meta = (error as { meta?: unknown }).meta;
  if (!meta) return 'unknown';
  try {
    return JSON.stringify(meta);
  } catch {
    return 'unserializable-meta';
  }
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
  const findExistingByNaturalKey = async (): Promise<Trophy | null> => {
    return prisma.trophy.findFirst({
      where: {
        competitionGroupId: data.competitionGroupId,
        season: data.season,
        saveId: data.saveId,
      },
    });
  };

  try { return await prisma.trophy.create({ data }); } 
  catch (error) {
    if (!isPrismaP2002(error)) throw error;
    const existingByNaturalKey = await findExistingByNaturalKey();
    if (existingByNaturalKey) return existingByNaturalKey;

    if (!hasUniqueIdTarget(error)) {
      console.error('Trophy create failed with non-id P2002 target:', getPrismaP2002Target(error), 'meta:', getPrismaMetaJson(error));
      throw error;
    }

    console.warn('Detected Trophy.id sequence drift. Repairing sequence and retrying create once...');
    await repairTrophyIdSequence();
    try { return await prisma.trophy.create({ data }); } 
    catch (retryError) {
      if (!isPrismaP2002(retryError)) throw retryError;

      const existingAfterRetry = await findExistingByNaturalKey();
      
      if (existingAfterRetry) return existingAfterRetry;
      console.error('Trophy create still failing after sequence repair. P2002 target:', getPrismaP2002Target(retryError), 'meta:', getPrismaMetaJson(retryError));

      const maxIdResult = await prisma.trophy.aggregate({ _max: { id: true } });
      const nextId = (maxIdResult._max.id ?? 0) + 1;

      try {
        return await prisma.trophy.create({
          data: {
            id: nextId,
            ...data,
          },
        });
      }
      catch (manualIdError) {
        if (!isPrismaP2002(manualIdError)) throw manualIdError;

        const existingAfterManualInsert = await findExistingByNaturalKey();
        if (existingAfterManualInsert) return existingAfterManualInsert;
        console.error('Trophy create failed after explicit id fallback. P2002 target:', getPrismaP2002Target(manualIdError), 'meta:', getPrismaMetaJson(manualIdError));
        throw manualIdError;
      }
    }
  }
}

async function runTrophySideEffects(params: {
  uid: string;
  saveId: string;
  trophy: Trophy;
  gameId: string;
  competitionCountryCode?: string;
}): Promise<void> {
  const { uid, saveId, trophy, gameId, competitionCountryCode } = params;

  try {
    await addChallengeForTrophy(uid, saveId, trophy, competitionCountryCode);
  }
  catch (challengeError) {
    if (isPrismaP2002(challengeError)) {
      console.error('Challenge side-effect P2002 target:', getPrismaP2002Target(challengeError), 'meta:', getPrismaMetaJson(challengeError));
    }
    else {
      console.error('Challenge side-effect failed:', challengeError);
    }
  }

  try {
    await evaluateAchievementsForUser({
      userId: uid,
      saveId,
      gameId,
      eventType: 'trophy.added',
      eventTimestamp: new Date(),
    });
  }
  catch (achievementError) {
    if (isPrismaP2002(achievementError)) {
      console.error('Achievement side-effect P2002 target:', getPrismaP2002Target(achievementError), 'meta:', getPrismaMetaJson(achievementError));
    }
    else {
      console.error('Achievement side-effect failed:', achievementError);
    }
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
    const competition = await fetchCompetition(competitionId);
    if (!competition) throw new Error('Competition not found');

    const save = await prisma.save.findUnique({ where: { id: saveId } });
    if (!save) throw new Error('Save not found');

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
      if (existingTrophy.teamId !== Number(teamId)) {
        const updatedExistingTrophy = await prisma.trophy.update({
          where: { id: existingTrophy.id },
          data: { teamId: Number(teamId) },
        });

        await runTrophySideEffects({
          uid,
          saveId,
          trophy: updatedExistingTrophy,
          gameId: save.gameId,
          competitionCountryCode: competition.countryCode,
        });
        return updatedExistingTrophy.id;
      }

      await runTrophySideEffects({
        uid,
        saveId,
        trophy: existingTrophy,
        gameId: save.gameId,
        competitionCountryCode: competition.countryCode,
      });
      return existingTrophy.id;
    }

    const team = await fetchTeam(teamId);
    if (!team) throw new Error('Team not found');
    
    let trophy: Trophy;
    try {
      trophy = await createTrophyWithIdSequenceRecovery({
        gameId: save.gameId,
        saveId: saveId,
        season: season,
        teamId: Number(teamId),
        competitionGroupId: competitionId,
      });
    }
    catch (createError) {
      if (isPrismaP2002(createError)) {
        console.error('Trophy insert P2002 target:', getPrismaP2002Target(createError), 'meta:', getPrismaMetaJson(createError));
      }
      throw createError;
    }

    await runTrophySideEffects({
      uid,
      saveId,
      trophy,
      gameId: save.gameId,
      competitionCountryCode: competition.countryCode,
    });

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
  updates: { teamId?: number | string; season?: string; competitionId?: number | string }
): Promise<boolean> {
  try {
    const trophy = await getTrophyById(trophyId);
    if (!trophy) throw new Error('Trophy not found');

    const normalizedTeamId = updates.teamId !== undefined ? Number(updates.teamId) : undefined;
    const normalizedCompetitionId = updates.competitionId !== undefined ? Number(updates.competitionId) : undefined;

    if (updates.teamId !== undefined && Number.isNaN(normalizedTeamId)) {
      throw new Error('Invalid teamId for updateTrophy');
    }

    if (updates.competitionId !== undefined && Number.isNaN(normalizedCompetitionId)) {
      throw new Error('Invalid competitionId for updateTrophy');
    }
    
    // Prepare updated data
    const updateData: Partial<Trophy> = {};
    
    // If team is being updated, fetch new team data
    if (normalizedTeamId !== undefined && normalizedTeamId !== trophy.teamId) {
      updateData.teamId = normalizedTeamId;
    }
    
    // If competition is being updated, fetch new competition data
    if (normalizedCompetitionId !== undefined && normalizedCompetitionId !== trophy.competitionGroupId) {
      updateData.competitionGroupId = normalizedCompetitionId;
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
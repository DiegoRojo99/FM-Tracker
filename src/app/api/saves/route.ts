import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { fetchCompetition } from '@/lib/db/competitions';
import { addChallengeForCountry, addChallengeForTeam } from '@/lib/db/challenges';
import { getUserPreviewSaves, getUserPreviewSavesCacheKey, invalidateUserPreviewSavesCache } from '@/lib/db/saves';
import { Save } from '@/lib/types/prisma/Save';
import { fetchTeam } from '@/lib/db/teams';
import { prisma } from '@/lib/db/prisma';
import { CareerStint } from '@/lib/types/prisma/Career';
import { deleteCacheKey } from '@/lib/cache/redis';
import { readThroughCache } from '@/lib/cache/redis';
import { evaluateAchievementsForUser } from '@/lib/db/achievements';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: userSaves, cacheStatus } = await readThroughCache(
      getUserPreviewSavesCacheKey(uid),
      60 * 5,
      () => getUserPreviewSaves(uid)
    );

    if (!userSaves || userSaves.length === 0) {
      return new Response('No saves found', {
        status: 404,
        headers: { 'x-cache': cacheStatus }
      });
    }

    return new Response(JSON.stringify(userSaves), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'x-cache': cacheStatus,
      }
    });
  });
}

function getSeasonFromGameId(gameId: string): string {
  if (gameId.includes('fm24')) return '2023/24';
  if (gameId.includes('fm25')) return '2024/25';
  if (gameId.includes('fm26')) return '2025/26';
  return '2023/24';
}

function getStartDateFromGameId(gameId: string): string {
  if (gameId.includes('fm24')) return '2023-07-01';
  if (gameId.includes('fm25')) return '2024-07-01';
  if (gameId.includes('fm26')) return '2025-07-01';
  return '2023-07-01';
}

function isPrismaP2002(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

function getPrismaP2002Target(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return '';
  const meta = (error as { meta?: { target?: unknown } }).meta;
  const target = meta?.target;
  if (Array.isArray(target)) return target.join(',');
  if (typeof target === 'string') return target;
  return '';
}

function getPrismaP2002Model(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return '';
  const meta = (error as { meta?: { modelName?: unknown } }).meta;
  return typeof meta?.modelName === 'string' ? meta.modelName : '';
}

async function repairCareerStintSequence() {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"CareerStint"', 'id'),
      COALESCE((SELECT MAX(id) FROM "CareerStint"), 0),
      true
    )
  `);
}

function buildSaveId(): string {
  return randomUUID().replace(/-/g, '');
}

function normalizeRequestId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
  if (normalized.length < 8 || normalized.length > 128) return null;
  return normalized;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSaveSideEffectsWithBudget(
  sideEffects: Array<Promise<unknown>>,
  saveId: string,
  maxWaitMs = 1200
): Promise<void> {
  if (sideEffects.length === 0) return;

  const settledPromise = Promise.allSettled(sideEffects).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Optional save side effect ${index} failed for save ${saveId}:`, result.reason);
      }
    });
  });

  const timedOut = await Promise.race([
    settledPromise.then(() => false),
    delay(maxWaitMs).then(() => true),
  ]);

  if (timedOut) {
    console.warn(`Optional save side effects exceeded ${maxWaitMs}ms for save ${saveId}. Returning response while side effects continue.`);
  }
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    try {
      const body = await req.json();
      const { countryCode, leagueId, startingTeamId, gameId, requestId } = body;
      const isUnemployedStart = !startingTeamId;
      const requestIdFromHeader = req.headers.get('x-idempotency-key');
      const normalizedRequestId = normalizeRequestId(requestId) ?? normalizeRequestId(requestIdFromHeader);

      const startingTeam = isUnemployedStart ? null : await fetchTeam(Number(startingTeamId));
      if (!isUnemployedStart && !startingTeam) return new Response('Invalid starting team ID', { status: 400 });

      if (!isUnemployedStart) {
        if (!leagueId) return new Response('League is required for club starts', { status: 400 });
        const currentLeagueData = await fetchCompetition(Number(leagueId));
        if (!currentLeagueData) return new Response('Invalid league ID', { status: 400 });
      }

      const gameIdToUse = gameId || 'fm26';
      const currentClubId = startingTeam && !startingTeam.national ? startingTeam.id : null;
      const currentNTId = startingTeam && startingTeam.national ? startingTeam.id : null;
      let saveId = normalizedRequestId ?? buildSaveId();
      let wasIdempotentReplay = false;
      let createdNewSave = false;

      const createSaveWithStint = async (id: string): Promise<void> => {
        const saveInputData: Save = {
          id,
          userId: uid,
          gameId: gameIdToUse,
          countryCode: countryCode || null,
          currentClubId,
          currentNTId,
          currentLeagueId: Number(leagueId) || null,
          season: getSeasonFromGameId(gameIdToUse),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await prisma.$transaction(async (tx) => {
          await tx.save.create({ data: saveInputData });

          if (!isUnemployedStart && startingTeamId) {
            const careerStintInputData: Omit<CareerStint, 'id'> = {
              saveId: id,
              teamId: Number(startingTeamId),
              startDate: getStartDateFromGameId(gameIdToUse),
              endDate: null,
              isNational: startingTeam ? startingTeam.national : false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await tx.careerStint.create({ data: careerStintInputData });
          }
        });
      };

      let sequenceRepaired = false;
      let saveIdRegenerated = false;

      while (!createdNewSave && !wasIdempotentReplay) {
        try {
          await createSaveWithStint(saveId);
          createdNewSave = true;
          break;
        } catch (createError) {
          if (!isPrismaP2002(createError)) throw createError;

          const target = getPrismaP2002Target(createError);
          const model = getPrismaP2002Model(createError);
          const targetLower = target.toLowerCase();
          const modelLower = model.toLowerCase();

          console.error('Save create P2002 target/model:', target || '(unknown)', model || '(unknown)', createError);

          if (normalizedRequestId) {
            const existingSave = await prisma.save.findUnique({ where: { id: saveId } });
            if (existingSave && existingSave.userId === uid) {
              wasIdempotentReplay = true;
              break;
            }
          }

          const looksLikeCareerStintCollision =
            modelLower.includes('careerstint') || targetLower.includes('careerstint');
          const looksLikeSaveCollision =
            modelLower.includes('save') || targetLower.includes('save') || targetLower === 'id';

          if (!sequenceRepaired && (looksLikeCareerStintCollision || targetLower === 'id')) {
            await repairCareerStintSequence();
            sequenceRepaired = true;
            continue;
          }

          if (!saveIdRegenerated && !normalizedRequestId && looksLikeSaveCollision) {
            saveId = buildSaveId();
            saveIdRegenerated = true;
            continue;
          }

          throw createError;
        }
      }

      const persistedSave = await prisma.save.findUnique({ where: { id: saveId } });
      if (!persistedSave || persistedSave.userId !== uid) {
        throw new Error(`Save ${saveId} was not persisted correctly`);
      }

      if (createdNewSave) {
        // Keep cache consistency work in the critical path.
        await Promise.allSettled([
          deleteCacheKey('stats:global'),
          invalidateUserPreviewSavesCache(uid),
        ]);

        // Non-critical work should not delay save creation response.
        const optionalSideEffects = [
          !isUnemployedStart && startingTeamId
            ? addChallengeForTeam(saveId, Number(startingTeamId))
            : Promise.resolve(),
          countryCode
            ? addChallengeForCountry(saveId, countryCode)
            : Promise.resolve(),
          evaluateAchievementsForUser({
            userId: uid,
            saveId,
            gameId: gameIdToUse,
            eventType: 'save.created',
            eventTimestamp: new Date(),
          }),
        ];

        await runSaveSideEffectsWithBudget(optionalSideEffects, saveId);
      }

      return new Response(JSON.stringify(persistedSave), { status: wasIdempotentReplay ? 200 : 201 });
    }
    catch (error) {
      console.error('Error creating save:', error);
      if (isPrismaP2002(error)) {
        const target = getPrismaP2002Target(error);
        const model = getPrismaP2002Model(error);
        const details = [model, target].filter(Boolean).join(':');
        return new Response(`Failed to create save due to duplicate key${details ? ` (${details})` : ''}. Please retry.`, { status: 409 });
      }
      return new Response('Failed to create save', { status: 500 });
    }
  });
}

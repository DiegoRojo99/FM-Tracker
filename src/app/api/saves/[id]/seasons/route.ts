import { withAuth } from '@/lib/auth/withAuth';
import { updateSaveSeason } from '@/lib/db/saves';
import { addTrophyToSave } from '@/lib/db/trophies';
import { evaluateAchievementsForUser } from '@/lib/db/achievements';
import { SeasonInput, SeasonUpdateInput } from '@/lib/types/prisma/Season';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSaveSeasons, isCupWinningRound, SeasonValidationError, syncSeasonCompetitionData, validateLeagueInputShape } from '@/lib/db/seasons';
import { invalidateUserPreviewSavesCache } from '@/lib/db/saves';

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

function getPrismaErrorMetaTarget(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return null;
  const meta = (error as { meta?: { target?: unknown } }).meta;
  if (!meta || !('target' in meta)) return null;

  if (Array.isArray(meta.target)) return meta.target.join(',');
  if (typeof meta.target === 'string') return meta.target;
  return null;
}

function getPrismaErrorModelName(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return null;
  const meta = (error as { meta?: { modelName?: unknown } }).meta;
  if (!meta) return null;
  return typeof meta.modelName === 'string' ? meta.modelName : null;
}

function hasUniqueIdTarget(error: unknown): boolean {
  const target = (getPrismaErrorMetaTarget(error) ?? '').toLowerCase();
  return target === 'id' || target.includes('season_pkey') || target.includes('id');
}

function shouldTreatAsSeasonIdCollision(error: unknown): boolean {
  if (!isUniqueConstraintError(error)) return false;
  if (hasUniqueIdTarget(error)) return true;

  const model = (getPrismaErrorModelName(error) ?? '').toLowerCase();
  return model === 'season';
}

function shouldTreatAsSeasonCompetitionIdCollision(error: unknown): boolean {
  if (!isUniqueConstraintError(error)) return false;

  const target = (getPrismaErrorMetaTarget(error) ?? '').toLowerCase();
  const model = (getPrismaErrorModelName(error) ?? '').toLowerCase();

  if (target.includes('leagueresult_pkey') || target.includes('cupresult_pkey')) return true;
  if (model === 'leagueresult' || model === 'cupresult') return true;

  // Prisma sometimes only reports generic id target for PK collisions.
  return target === 'id' || target.includes('id');
}

async function repairSeasonIdSequence(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Season"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Season"), 0) + 1,
      false
    )
  `);
}

async function repairSeasonCompetitionSequences(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"LeagueResult"', 'id'),
      COALESCE((SELECT MAX(id) FROM "LeagueResult"), 0) + 1,
      false
    )
  `);

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"CupResult"', 'id'),
      COALESCE((SELECT MAX(id) FROM "CupResult"), 0) + 1,
      false
    )
  `);
}

async function runSeasonCompetitionSyncWithRecovery(
  seasonId: number,
  body: Pick<SeasonInput, 'leagueId' | 'leaguePosition' | 'promoted' | 'relegated' | 'cupResults'>
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        return syncSeasonCompetitionData(tx, seasonId, body);
      });
    }
    catch (error) {
      if (attempt === 1 || !shouldTreatAsSeasonCompetitionIdCollision(error)) {
        throw error;
      }

      console.warn('Detected LeagueResult/CupResult id sequence drift. Repairing sequences and retrying transaction once...');
      await repairSeasonCompetitionSequences();
    }
  }

  return [];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSideEffectsWithBudget(
  sideEffects: Array<Promise<unknown>>,
  context: 'create' | 'update',
  saveId: string,
  maxWaitMs = 1200
): Promise<void> {
  if (sideEffects.length === 0) return;

  const settledPromise = Promise.allSettled(sideEffects).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Season ${context} side effect ${index} failed for save ${saveId}:`, result.reason);
      }
    });
  });

  const timedOut = await Promise.race([
    settledPromise.then(() => false),
    delay(maxWaitMs).then(() => true),
  ]);

  if (timedOut) {
    console.warn(`Season ${context} side effects exceeded ${maxWaitMs}ms for save ${saveId}. Returning response while side effects continue.`);
  }
}

async function syncSeasonDataAndRunSideEffects(params: {
  uid: string;
  saveId: string;
  gameId: string;
  seasonId: number;
  body: SeasonInput;
}): Promise<void> {
  const { uid, saveId, gameId, seasonId, body } = params;

  const cups = await runSeasonCompetitionSyncWithRecovery(seasonId, body);

  // Core save state update must succeed.
  await updateSaveSeason(uid, saveId, body.season);
  await invalidateUserPreviewSavesCache(uid);

  // Side effects must never fail season creation response.
  const sideEffects: Array<Promise<unknown>> = [];

  if (body.leaguePosition === 1 && body.leagueId) {
    sideEffects.push(
      addTrophyToSave({
        uid,
        saveId,
        competitionId: Number(body.leagueId),
        teamId: Number(body.teamId),
        season: body.season,
      })
    );
  }

  for (const cup of cups) {
    if (!isCupWinningRound(cup.reachedRound)) continue;
    sideEffects.push(
      addTrophyToSave({
        uid,
        saveId,
        competitionId: Number(cup.competitionId),
        teamId: Number(body.teamId),
        season: body.season,
      })
    );
  }

  sideEffects.push(
    evaluateAchievementsForUser({
      userId: uid,
      saveId,
      gameId,
      eventType: 'season.created',
      eventTimestamp: new Date(),
    })
  );

  await runSideEffectsWithBudget(sideEffects, 'create', saveId);
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });    
    if (!saveId) return NextResponse.json({ error: 'Save ID is required' }, { status: 400 });
    
    // Check if save exists first
    const save = await prisma.save.findUnique({
      where: { id: saveId },
      select: { userId: true, gameId: true }
    });

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
    if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });
    
    // Validate required fields
    const body = await req.json() as SeasonInput;
    if (!body.teamId || !body.season) return NextResponse.json({ error: 'Missing required fields: teamId, season' }, { status: 400 });

    try { validateLeagueInputShape(body); } 
    catch (error) {
      if (error instanceof SeasonValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      throw error;
    }

    const hasLeagueId = Boolean(body.leagueId);
    const hasLeaguePosition = body.leaguePosition !== undefined && body.leaguePosition !== null;

    // Fetch team data
    const team = await prisma.team.findUnique({ where: { id: Number(body.teamId) } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    if (hasLeagueId && hasLeaguePosition) {
      const league = await prisma.competitionGroup.findUnique({ where: { id: Number(body.leagueId) } });
      if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const existingSeason = await prisma.season.findFirst({
      where: {
        saveId,
        season: body.season,
        teamId: Number(body.teamId),
      },
      select: {
        id: true,
        saveId: true,
        season: true,
        teamId: true,
        leagueResult: { select: { id: true } },
        cupResults: { select: { id: true } },
      },
    });

    if (existingSeason) {
      const requestHasCompetitionData =
        (hasLeagueId && hasLeaguePosition)
        || (Array.isArray(body.cupResults) && body.cupResults.length > 0);

      const looksLikePartialWrite = !existingSeason.leagueResult && existingSeason.cupResults.length === 0;

      if (requestHasCompetitionData && looksLikePartialWrite) {
        await syncSeasonDataAndRunSideEffects({
          uid,
          saveId,
          gameId: save.gameId,
          seasonId: existingSeason.id,
          body,
        });
      }

      return NextResponse.json(
        {
          id: existingSeason.id,
          saveId: existingSeason.saveId,
          season: existingSeason.season,
          teamId: existingSeason.teamId,
          duplicate: true,
          repaired: requestHasCompetitionData && looksLikePartialWrite,
        },
        { status: 200 }
      );
    }

    try {
      const seasonCreateData = {
        saveId: saveId,
        season: body.season,
        teamId: Number(body.teamId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let createdSeason;
      try {
        createdSeason = await prisma.season.create({ data: seasonCreateData });
      }
      catch (createError) {
        if (!shouldTreatAsSeasonIdCollision(createError)) {
          throw createError;
        }

        console.warn('Detected Season.id sequence drift. Repairing sequence and retrying season create once...');
        await repairSeasonIdSequence();

        try {
          createdSeason = await prisma.season.create({ data: seasonCreateData });
        }
        catch (retryError) {
          if (!isUniqueConstraintError(retryError)) {
            throw retryError;
          }

          const duplicatedAfterRetry = await prisma.season.findFirst({
            where: {
              saveId,
              season: body.season,
              teamId: Number(body.teamId),
            },
            select: { id: true, saveId: true, season: true, teamId: true },
          });

          if (duplicatedAfterRetry) {
            return NextResponse.json(
              {
                id: duplicatedAfterRetry.id,
                saveId: duplicatedAfterRetry.saveId,
                season: duplicatedAfterRetry.season,
                teamId: duplicatedAfterRetry.teamId,
                duplicate: true,
              },
              { status: 200 }
            );
          }

          if (!shouldTreatAsSeasonIdCollision(retryError)) {
            throw retryError;
          }

          let explicitCreateError: unknown = retryError;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const maxIdResult = await prisma.season.aggregate({ _max: { id: true } });
            const nextId = (maxIdResult._max.id ?? 0) + 1;
            console.warn(`Season.id collision persists after sequence repair. Retrying with explicit id=${nextId} (attempt ${attempt + 1}/3).`);

            try {
              createdSeason = await prisma.season.create({
                data: {
                  id: nextId,
                  ...seasonCreateData,
                },
              });
              explicitCreateError = null;
              break;
            } catch (explicitIdError) {
              explicitCreateError = explicitIdError;

              const duplicatedAfterExplicitRetry = await prisma.season.findFirst({
                where: {
                  saveId,
                  season: body.season,
                  teamId: Number(body.teamId),
                },
                select: { id: true, saveId: true, season: true, teamId: true },
              });

              if (duplicatedAfterExplicitRetry) {
                return NextResponse.json(
                  {
                    id: duplicatedAfterExplicitRetry.id,
                    saveId: duplicatedAfterExplicitRetry.saveId,
                    season: duplicatedAfterExplicitRetry.season,
                    teamId: duplicatedAfterExplicitRetry.teamId,
                    duplicate: true,
                  },
                  { status: 200 }
                );
              }

              if (!shouldTreatAsSeasonIdCollision(explicitIdError)) {
                throw explicitIdError;
              }
            }
          }

          if (explicitCreateError) {
            throw explicitCreateError;
          }
        }
      }

      if (!createdSeason) {
        throw new Error('Season creation failed before persistence step completed');
      }

      await syncSeasonDataAndRunSideEffects({
        uid,
        saveId,
        gameId: save.gameId,
        seasonId: createdSeason!.id,
        body,
      });

      return NextResponse.json(createdSeason!, { status: 201 });
    }
    catch (error) {
      if (error instanceof SeasonValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      if (isUniqueConstraintError(error)) {
        const target = getPrismaErrorMetaTarget(error);
        const modelName = getPrismaErrorModelName(error);

        const duplicatedSeason = await prisma.season.findFirst({
          where: {
            saveId,
            season: body.season,
            teamId: Number(body.teamId),
          },
          select: { id: true, saveId: true, season: true, teamId: true },
        });

        if (duplicatedSeason) {
          console.warn('Season create replay detected after P2002:', duplicatedSeason.id);
          return NextResponse.json(
            {
              id: duplicatedSeason.id,
              saveId: duplicatedSeason.saveId,
              season: duplicatedSeason.season,
              teamId: duplicatedSeason.teamId,
              duplicate: true,
            },
            { status: 200 }
          );
        }

        console.error('Unique constraint creating season:', modelName || '(unknown model)', target || error);
        return NextResponse.json(
          {
            error: 'A season with this team and season already exists, or cup competitions are duplicated',
            details: [modelName, target].filter(Boolean).join(':') || undefined,
          },
          { status: 409 }
        );
      }

      console.error('Error creating season:', error);
      return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
    }
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!saveId) return NextResponse.json({ error: 'Save ID is required' }, { status: 400 });

    const save = await prisma.save.findUnique({
      where: { id: saveId },
      select: { userId: true }
    });

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
    if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });

    const body = await req.json() as SeasonUpdateInput;
    if (!body.seasonId || !body.teamId || !body.season) {
      return NextResponse.json({ error: 'Missing required fields: seasonId, teamId, season' }, { status: 400 });
    }

    try { validateLeagueInputShape(body); } 
    catch (error) {
      if (error instanceof SeasonValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      throw error;
    }

    const hasLeagueId = Boolean(body.leagueId);
    const hasLeaguePosition = body.leaguePosition !== undefined && body.leaguePosition !== null;

    const existingSeason = await prisma.season.findFirst({
      where: {
        id: body.seasonId,
        saveId,
      },
      select: { id: true },
    });

    if (!existingSeason) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: Number(body.teamId) } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    if (hasLeagueId) {
      const league = await prisma.competitionGroup.findUnique({ where: { id: Number(body.leagueId) } });
      if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const duplicateSeason = await prisma.season.findFirst({
      where: {
        saveId,
        season: body.season,
        teamId: Number(body.teamId),
        id: { not: body.seasonId },
      },
      select: { id: true },
    });

    if (duplicateSeason) {
      return NextResponse.json(
        { error: 'A season with this team and season already exists' },
        { status: 409 }
      );
    }

    try {
      let updatedSeason;
      let cups;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const result = await prisma.$transaction(async (tx) => {
            const season = await tx.season.update({
              where: { id: body.seasonId },
              data: {
                season: body.season,
                teamId: Number(body.teamId),
              },
            });

            const syncedCups = await syncSeasonCompetitionData(tx, body.seasonId, body);
            return {
              updatedSeason: season,
              cups: syncedCups,
            };
          });

          updatedSeason = result.updatedSeason;
          cups = result.cups;
          break;
        }
        catch (error) {
          if (attempt === 1 || !shouldTreatAsSeasonCompetitionIdCollision(error)) {
            throw error;
          }

          console.warn('Detected LeagueResult/CupResult id sequence drift during season update. Repairing sequences and retrying transaction once...');
          await repairSeasonCompetitionSequences();
        }
      }

      if (!updatedSeason || !cups) {
        throw new Error('Season update transaction failed before persistence step completed');
      }

      await invalidateUserPreviewSavesCache(uid);

      const sideEffects: Array<Promise<unknown>> = [];
      const leagueWin = hasLeagueId && hasLeaguePosition && Number(body.leaguePosition) === 1 && body.leagueId;
      if (leagueWin) {
        sideEffects.push(
          addTrophyToSave({
            uid,
            saveId,
            competitionId: Number(body.leagueId),
            teamId: Number(body.teamId),
            season: body.season,
          })
        );
      }

      for (const cup of cups) {
        if (!isCupWinningRound(cup.reachedRound)) continue;
        sideEffects.push(
          addTrophyToSave({
            uid,
            saveId,
            competitionId: Number(cup.competitionId),
            teamId: Number(body.teamId),
            season: body.season,
          })
        );
      }

      await runSideEffectsWithBudget(sideEffects, 'update', saveId);

      return NextResponse.json(updatedSeason, { status: 200 });
    }
    catch (error) {
      if (error instanceof SeasonValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      if (isUniqueConstraintError(error)) {
        const target = getPrismaErrorMetaTarget(error);
        const modelName = getPrismaErrorModelName(error);
        console.error('Unique constraint updating season:', modelName || '(unknown model)', target || error);
        return NextResponse.json(
          {
            error: 'A season with this team and season already exists, or cup competitions are duplicated',
            details: [modelName, target].filter(Boolean).join(':') || undefined,
          },
          { status: 409 }
        );
      }

      console.error('Error updating season:', error);
      return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });
    }
  });
}

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!saveId) return NextResponse.json({ error: 'Save ID is required' }, { status: 400 });

    // Check if save exists
    const save = await prisma.save.findUnique({
      where: { id: saveId }
    });

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });

    const seasons = await getSaveSeasons(saveId);
    return NextResponse.json(seasons);
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });    
    if (!saveId) return NextResponse.json({ error: 'Save ID is required' }, { status: 400 });

    // Check if save exists and user owns it
    const save = await prisma.save.findUnique({
      where: { id: saveId },
      select: { userId: true }
    });

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
    if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });
    
    // Validate required fields
    const body = await req.json() as { season: string; teamId: string };
    if (!body.season || !body.teamId) {
      return NextResponse.json({ error: 'Missing required fields: season, teamId' }, { status: 400 });
    }

    try {
      // Delete season
      await prisma.season.deleteMany({
        where: {
          saveId: saveId,
          season: body.season,
          teamId: Number(body.teamId),
        },
      });

      await invalidateUserPreviewSavesCache(save.userId);
      return NextResponse.json({ message: 'Season deleted successfully' }, { status: 200 });
    } 
    catch (error) {
      console.error('Error deleting season:', error);
      return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
    }
  });
}
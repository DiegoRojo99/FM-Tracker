import { withAuth } from '@/lib/auth/withAuth';
import { updateSaveSeason } from '@/lib/db/saves';
import { addTrophyToSave } from '@/lib/db/trophies';
import { evaluateAchievementsForUser } from '@/lib/db/achievements';
import { SeasonInput, SeasonUpdateInput } from '@/lib/types/prisma/Season';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSaveSeasons, SeasonValidationError, syncSeasonCompetitionData, validateLeagueInputShape } from '@/lib/db/seasons';
import { invalidateUserPreviewSavesCache } from '@/lib/db/saves';

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

function getPrismaErrorMetaTarget(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return null;
  const meta = (error as { meta?: { target?: unknown } }).meta;
  if (!meta || !Array.isArray(meta.target)) return null;
  return meta.target.join(',');
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

    try {
      const createdSeason = await prisma.season.create({
        data: {
          saveId: saveId,
          season: body.season,
          teamId: Number(body.teamId),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const cups = await prisma.$transaction(async (tx) => {
        return syncSeasonCompetitionData(tx, createdSeason.id, body);
      });

    if (body.leaguePosition === 1 && body.leagueId) {
      await addTrophyToSave({
        uid,
        saveId,
        competitionId: Number(body.leagueId),
        teamId: Number(body.teamId),
        season: body.season
      });
    }

    // If the season is a cup win, add the trophy
    for (const cup of cups) {
      if (cup.reachedRound === 'Winners') {
        await addTrophyToSave({
          uid,
          saveId,
          competitionId: Number(cup.competitionId),
          teamId: Number(body.teamId),
          season: body.season
        });
      }
    }

    // Update the season in the save
    await updateSaveSeason(uid, saveId, body.season);
    await evaluateAchievementsForUser({
      userId: uid,
      saveId,
      gameId: save.gameId,
      eventType: 'season.created',
      eventTimestamp: new Date(),
    });

    await invalidateUserPreviewSavesCache(uid);
    return NextResponse.json(createdSeason, { status: 201 });
    }
    catch (error) {
      if (error instanceof SeasonValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      if (isUniqueConstraintError(error)) {
        const target = getPrismaErrorMetaTarget(error);
        console.error('Unique constraint creating season:', target || error);
        return NextResponse.json(
          {
            error: 'A season with this team and season already exists, or cup competitions are duplicated',
            details: target ? `Unique target: ${target}` : undefined,
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
      const { updatedSeason, cups } = await prisma.$transaction(async (tx) => {
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

      const leagueWin = hasLeagueId && hasLeaguePosition && Number(body.leaguePosition) === 1 && body.leagueId;
      if (leagueWin) {
        await addTrophyToSave({
          uid,
          saveId,
          competitionId: Number(body.leagueId),
          teamId: Number(body.teamId),
          season: body.season,
        });
      }

      for (const cup of cups) {
        if (cup.reachedRound !== 'Winners') continue;
        await addTrophyToSave({
          uid,
          saveId,
          competitionId: Number(cup.competitionId),
          teamId: Number(body.teamId),
          season: body.season,
        });
      }

      await invalidateUserPreviewSavesCache(uid);
      return NextResponse.json(updatedSeason, { status: 200 });
    }
    catch (error) {
      if (error instanceof SeasonValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      if (isUniqueConstraintError(error)) {
        const target = getPrismaErrorMetaTarget(error);
        console.error('Unique constraint updating season:', target || error);
        return NextResponse.json(
          {
            error: 'A season with this team and season already exists, or cup competitions are duplicated',
            details: target ? `Unique target: ${target}` : undefined,
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
import { withAuth } from '@/lib/auth/withAuth';
import { updateSaveSeason } from '@/lib/db/saves';
import { addTrophyToSave } from '@/lib/db/trophies';
import { SeasonInput } from '@/lib/types/prisma/Season';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSaveSeasons } from '@/lib/db/seasons';

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }
    
    // Validate required fields
    const body = await req.json() as SeasonInput;
    if (!body.teamId || !body.leagueId || !body.leaguePosition || !body.season) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Get save data to extract game information
    const save = await prisma.save.findUnique({ where: { id: saveId } });
    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
    const game = save.gameId || 'FM26'; // Default fallback

    // Fetch team data
    const team = await prisma.team.findUnique({ where: { id: Number(body.teamId) } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    
    const createdSeason = await prisma.season.create({
      data: {
        saveId: saveId,
        season: body.season,
        teamId: Number(body.teamId),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const league = await prisma.competitionGroup.findUnique({ where: { id: Number(body.leagueId) } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    await prisma.leagueResult.create({
      data: {
        seasonId: createdSeason.id,
        competitionId: Number(body.leagueId),
        position: body.leaguePosition,
        promoted: body.promoted || false,
        relegated: body.relegated || false,
      },
    });

    const cups = body.cupResults || [];
    const cupResults = cups.map(cupInput => ({
      seasonId: createdSeason.id,
      competitionId: Number(cupInput.competitionId),
      reachedRound: cupInput.reachedRound || 'Group Stage',
    }));

    await prisma.cupResult.createMany({ data: cupResults });

    if (body.leaguePosition === 1) {
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
    return NextResponse.json(createdSeason, { status: 201 });
  });
}

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }

    const seasons = await getSaveSeasons(saveId);
    return NextResponse.json(seasons);
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }
    
    const body = await req.json() as { season: string; teamId: string };
    
    // Validate required fields
    if (!body.season || !body.teamId) {
      return new Response('Missing season or teamId', { status: 400 });
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

      return NextResponse.json({ message: 'Season deleted successfully' }, { status: 200 });
    } 
    catch (error) {
      console.error('Error deleting season:', error);
      return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
    }
  });
}
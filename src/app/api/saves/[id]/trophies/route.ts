import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { addTrophyToSave } from '@/lib/db/trophies';
import { FullTrophy, TrophyGroup } from '@/lib/types/prisma/Trophy';
import { NextRequest, NextResponse } from 'next/server';

// Auto-season inference if missing
function getSeasonFromDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return month > 6
    ? `${year}/${(year + 1).toString().slice(-2)}`
    : `${year - 1}/${year.toString().slice(-2)}`;
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
      select: { userId: true }
    });

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
    
    // Check if user owns the save
    if (save.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });
    }
    
    // Validate required fields
    const body = await req.json();
    if (!body.teamId || !body.competitionId || !body.dateWon || !body.countryCode) {
      return NextResponse.json({ error: 'Missing required fields: teamId, competitionId, dateWon, countryCode' }, { status: 400 });
    }

    // Fetch team data
    const team = await prisma.team.findUnique({ where: { id: Number(body.teamId) } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Fetch competition data
    const competition = await prisma.competitionGroup.findUnique({ where: { id: Number(body.competitionId) } });
    if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

    // Add trophy to save
    const season = getSeasonFromDate(body.dateWon);
    const newTrophyId = await addTrophyToSave({
      teamId: Number(body.teamId), 
      competitionId: Number(body.competitionId), 
      uid, 
      season, 
      saveId
    });

    if (!newTrophyId) return NextResponse.json({ error: 'Failed to add trophy' }, { status: 500 });
    return NextResponse.json({ id: newTrophyId }, { status: 201 });
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
      where: { id: saveId },
      select: { userId: true }
    });

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });

    const trophiesData: FullTrophy[] = await prisma.trophy.findMany({
      where: { saveId: saveId },
      orderBy: { season: 'desc' },
      include: {
        team: true,
        competitionGroup: true,
      },
    });

    const competitionGroups = await prisma.competitionGroup.findMany();
    const groupedTrophies: TrophyGroup[] = [];
    trophiesData.forEach((trophy) => {
      const group = groupedTrophies.find((g) => g.competitionGroup.id === trophy.competitionGroupId);
      if (group) group.trophies.push(trophy);
      else {
        const competition = competitionGroups.find(cg => cg.id === trophy.competitionGroupId);
        if (!competition) return;
        groupedTrophies.push({
          competitionGroup: competition,
          trophies: [trophy],
        });
      }
    });

    return NextResponse.json(groupedTrophies);
  });
}
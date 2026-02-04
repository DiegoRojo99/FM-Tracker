import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest, NextResponse } from 'next/server';
import { fetchTeam } from '@/lib/db/teams';
import { addChallengeForCountry, addChallengeForTeam } from '@/lib/db/challenges';
import { prisma } from '@/lib/db/prisma';
import { CareerStintInput } from '@/lib/types/prisma/Career';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (uid) => {
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Save ID is required' }, { status: 400 });

    try {
      // Verify save belongs to user
      const save = await prisma.save.findFirst({
        where: {
          id,
          userId: uid,
        },
      });

      if (!save) {
        return NextResponse.json({ error: 'Save not found or unauthorized' }, { status: 404 });
      }

      const body = await req.json() as CareerStintInput & { leagueId?: string };
      if (!body.teamId || !body.startDate) {
        return NextResponse.json({ error: 'Missing required fields: teamId, startDate' }, { status: 400 });
      }

      // Validate teamId is a number
      const teamIdNumber = parseInt(String(body.teamId));
      if (isNaN(teamIdNumber)) {
        return NextResponse.json({ error: 'teamId must be a valid number' }, { status: 400 });
      }

      const startDate = new Date(body.startDate);
      const formattedStartDate = formatDate(startDate);

      const teamData = await fetchTeam(teamIdNumber);
      if (!teamData) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

      const isNational = teamData.national ?? false;

      // Find latest stint of the same type (club/national) with no endDate
      const lastStint = await prisma.careerStint.findFirst({
        where: {
          saveId: id,
          isNational: isNational,
          endDate: null,
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      // If found, update its endDate to the new stint's startDate
      if (lastStint) {
        await prisma.careerStint.update({
          where: { id: lastStint.id },
          data: { endDate: formattedStartDate },
        });
      }

      const newStint: CareerStintInput = {
        teamId: teamData.id,
        saveId: id,
        startDate: formattedStartDate,
        endDate: body.endDate ? formatDate(new Date(body.endDate)) : null,
        isNational,
      };

      // Create new stint
      const docRef = await prisma.careerStint.create({ data: newStint });

      // Update save doc with current team
      const saveUpdateField = isNational ? 'currentNTId' : 'currentClubId';
      const competitionId = !isNational && body.leagueId ? Number(body.leagueId) : null;
      
      const updateData: {
        currentNTId?: number;
        currentClubId?: number;
        currentLeagueId?: number | null;
        updatedAt: Date;
      } = {
        [saveUpdateField]: teamData.id,
        updatedAt: new Date()
      };

      if (!isNational) {
        updateData.currentLeagueId = competitionId;
      }

      // Check if the team has any matching challenges
      await addChallengeForTeam(id, teamIdNumber);
      await addChallengeForCountry(id, teamData.countryCode);

      // Update the save document
      await prisma.save.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(docRef, { status: 201 });
    } catch (error) {
      console.error('Error creating career stint:', error);
      return NextResponse.json({ error: 'Failed to create career stint' }, { status: 500 });
    }
  });
}
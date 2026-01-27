import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest } from 'next/server';
import { fetchTeam } from '@/lib/db/prisma/teams';
import { fetchCompetition } from '@/lib/db/competitions';
import { addChallengeForCountry, addChallengeForTeam } from '@/lib/db/challenges';
import { prisma } from '@/lib/db/prisma';
import { CareerStintInput } from '@/lib/types/prisma/Career';
import { Save } from '@/lib/types/prisma/Save';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const { id } = await context.params;
    if (!id) return new Response('Save ID is required', { status: 400 });

    const body = await req.json() as CareerStintInput;
    if (!body.teamId || !body.startDate) {
      return new Response('Missing required fields', { status: 400 });
    }

    const startDate = new Date(body.startDate);
    const formattedStartDate = formatDate(startDate);

    const teamData = await fetchTeam(Number(body.teamId));
    if (!teamData) return new Response('Team not found', { status: 404 });

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
    const saveUpdateField = isNational ? 'currentNT' : 'currentClub';
    const competitionId = !isNational ? Number(body.leagueId) : null;
    
    const updateData = {
      [saveUpdateField]: {
        id: teamData.id,
      },
      currentLeagueId: competitionId,
      updatedAt: new Date()
    };

    // Check if the team has any matching challenges
    await addChallengeForTeam(id, body.teamId);
    await addChallengeForCountry(id, teamData.countryCode);

    // Update the save document
    const updateResponse = await prisma.save.update({
      where: { id },
      data: updateData,
    });

    if (!updateResponse) return new Response('Failed to update save with current team', { status: 500 });
    return new Response(JSON.stringify(docRef), { status: 200 });
  });
}
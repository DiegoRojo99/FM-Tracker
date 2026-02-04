import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

export async function PUT(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const careerStintId = pathParts[5];

    if (!uid || !saveId || !careerStintId) {
      return NextResponse.json({ error: 'Unauthorized or missing IDs' }, { status: 401 });
    }

    try {
      const body = await req.json();
      
      // Validate required fields
      const { teamId, startDate, endDate, isNational, leagueId } = body;
      if (!teamId || !startDate) {
        return NextResponse.json(
          { error: 'Missing required fields: teamId, startDate' }, 
          { status: 400 }
        );
      }

      // Validate teamId is a number
      const teamIdNumber = parseInt(teamId);
      if (isNaN(teamIdNumber)) {
        return NextResponse.json(
          { error: 'teamId must be a valid number' }, 
          { status: 400 }
        );
      }

      // Check if career stint exists and belongs to the user's save
      const careerStint = await prisma.careerStint.findFirst({
        where: { 
          id: Number(careerStintId),
          save: {
            id: saveId,
            userId: uid
          }
        }
      });
      
      if (!careerStint) {
        return NextResponse.json({ error: 'Career stint not found or unauthorized' }, { status: 404 });
      }

      // Update the career stint
      const updatedCareerStint = await prisma.careerStint.update({
        where: { id: Number(careerStintId) },
        data: {
          teamId: teamIdNumber,
          startDate,
          endDate: endDate || null,
          isNational: Boolean(isNational),
          updatedAt: new Date(),
        },
      });

      // Update save doc with current team if this is the most recent stint
      if (leagueId !== undefined) {
        const saveUpdateField = Boolean(isNational) ? 'currentNTId' : 'currentClubId';
        const competitionId = !Boolean(isNational) ? Number(leagueId) : null;
        
        const updateData: {
          currentNTId?: number;
          currentClubId?: number;
          currentLeagueId?: number;
          updatedAt: Date;
        } = {
          [saveUpdateField]: teamIdNumber,
          updatedAt: new Date()
        };

        if (competitionId) updateData.currentLeagueId = competitionId;

        await prisma.save.update({
          where: { id: saveId },
          data: updateData,
        });
      }

      return NextResponse.json(updatedCareerStint, { status: 200 });
    } 
    catch (error) {
      console.error('Error updating career stint:', error);
      return NextResponse.json({ error: 'Failed to update career stint' }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const careerStintId = pathParts[5];

    if (!uid || !saveId || !careerStintId) {
      return NextResponse.json({ error: 'Unauthorized or missing IDs' }, { status: 401 });
    }

    try {
      // Check if career stint exists and belongs to the user's save
      const careerStint = await prisma.careerStint.findFirst({
        where: { 
          id: Number(careerStintId),
          save: {
            id: saveId,
            userId: uid
          }
        }
      });
      
      if (!careerStint) {
        return NextResponse.json({ error: 'Career stint not found or unauthorized' }, { status: 404 });
      }

      // Delete the career stint
      await prisma.careerStint.delete({
        where: { id: Number(careerStintId) }
      });

      return NextResponse.json({ message: 'Career stint deleted successfully' }, { status: 200 });
    } 
    catch (error) {
      console.error('Error deleting career stint:', error);
      return NextResponse.json({ error: 'Failed to delete career stint' }, { status: 500 });
    }
  });
}
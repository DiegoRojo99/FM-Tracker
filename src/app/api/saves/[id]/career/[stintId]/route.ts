import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

export async function PUT(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const careerStintId = pathParts[5];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });    
    if (!saveId || !careerStintId) return NextResponse.json({ error: 'Save ID and Career Stint ID are required' }, { status: 400 });

    try {
      // Check if save exists and user owns it
      const save = await prisma.save.findUnique({
        where: { id: saveId },
        select: { userId: true }
      });

      if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
      if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });

      // Validate required fields
      const body = await req.json();
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

      // Check if career stint exists and belongs to this save
      const careerStint = await prisma.careerStint.findFirst({
        where: { 
          id: Number(careerStintId),
          saveId: saveId
        }
      });
      
      if (!careerStint) return NextResponse.json({ error: 'Career stint not found' }, { status: 404 });

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

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });    
    if (!saveId || !careerStintId) return NextResponse.json({ error: 'Save ID and Career Stint ID are required' }, { status: 400 });

    try {
      // Check if save exists and user owns it
      const save = await prisma.save.findUnique({
        where: { id: saveId },
        select: { userId: true }
      });

      if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });      
      if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });

      // Check if career stint exists and belongs to this save
      const careerStint = await prisma.careerStint.findFirst({
        where: { 
          id: Number(careerStintId),
          saveId: saveId
        }
      });
      
      if (!careerStint) return NextResponse.json({ error: 'Career stint not found' }, { status: 404 });

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
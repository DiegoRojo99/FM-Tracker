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
      const { teamId, startDate, endDate, isNational } = body;
      if (!teamId || !startDate) {
        return NextResponse.json(
          { error: 'Missing required fields: teamId, startDate' }, 
          { status: 400 }
        );
      }

      // Check if career stint exists
      const careerStint = await prisma.careerStint.findUnique({
        where: { id: Number(careerStintId) }
      });
      
      if (!careerStint) return NextResponse.json({ error: 'Career stint not found' }, { status: 404 });

      // Update the career stint
      const updatedCareerStint = await prisma.careerStint.update({
        where: { id: Number(careerStintId) },
        data: {
          saveId: saveId,
          teamId: teamId,
          startDate,
          endDate: endDate || null,
          isNational: Boolean(isNational),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

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
      // Check if career stint exists
      const careerStint = await prisma.careerStint.findUnique({
        where: { id: Number(careerStintId) }
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
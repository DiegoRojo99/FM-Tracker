import { withAuth } from '@/lib/auth/withAuth';
import { updateTrophy, deleteTrophy } from '@/lib/db/trophies';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const trophyId = pathParts[5];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });    
    if (!saveId || !trophyId) return NextResponse.json({ error: 'Save ID and Trophy ID are required' }, { status: 400 });

    try {
      // Check if save exists and user owns it
      const save = await prisma.save.findUnique({
        where: { id: saveId },
        select: { userId: true }
      });

      if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });      
      if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });

      // Check if trophy exists and belongs to this save
      const trophy = await prisma.trophy.findFirst({
        where: {
          id: Number(trophyId),
          saveId: saveId
        }
      });

      if (!trophy) return NextResponse.json({ error: 'Trophy not found' }, { status: 404 });

      // Validate at least one field is provided
      const body = await req.json();
      if (!body.teamId && !body.season && !body.countryCode && !body.competitionId) {
        return NextResponse.json({ error: 'At least one field must be provided for update' }, { status: 400 });
      }

      const success = await updateTrophy(Number(trophyId), body);
      if (!success) return NextResponse.json({ error: 'Failed to update trophy' }, { status: 500 });
      return NextResponse.json({ message: 'Trophy updated successfully' }, { status: 200 });
    } 
    catch (error) {
      console.error('Error updating trophy:', error);
      return NextResponse.json({ error: 'Failed to update trophy' }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const trophyId = pathParts[5];

    if (!uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });    
    if (!saveId || !trophyId) return NextResponse.json({ error: 'Save ID and Trophy ID are required' }, { status: 400 });

    try {
      // Check if save exists and user owns it
      const save = await prisma.save.findUnique({
        where: { id: saveId },
        select: { userId: true }
      });

      if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });      
      if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only modify your own saves' }, { status: 403 });

      // Check if trophy exists and belongs to this save
      const trophy = await prisma.trophy.findFirst({
        where: {
          id: Number(trophyId),
          saveId: saveId
        }
      });

      if (!trophy) return NextResponse.json({ error: 'Trophy not found' }, { status: 404 });

      const success = await deleteTrophy(Number(trophyId));
      if (!success) return NextResponse.json({ error: 'Failed to delete trophy' }, { status: 500 });
      return NextResponse.json({ message: 'Trophy deleted successfully' }, { status: 200 });
    } 
    catch (error) {
      console.error('Error deleting trophy:', error);
      return NextResponse.json({ error: 'Failed to delete trophy' }, { status: 500 });
    }
  });
}

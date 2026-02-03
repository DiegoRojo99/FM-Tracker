import { withAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { getFullSave } from '@/lib/db/saves';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];
    if (!saveId) return new Response('Save ID is required', { status: 400 });

    const save: FullDetailsSave | null = await getFullSave(saveId);
    if (!save) return new Response('Save not found', { status: 404 });

    return new Response(JSON.stringify(save), { status: 200 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];
    if (!saveId) return new Response('Save ID is required', { status: 400 });

    try {
      await prisma.save.delete({
        where: { id: saveId },
      });
      return new Response('Save and all associated data deleted successfully', { status: 200 });
    } catch (error) {
      console.error('Error deleting save:', error);
      return new Response('Failed to delete save', { status: 500 });
    }
  });
}
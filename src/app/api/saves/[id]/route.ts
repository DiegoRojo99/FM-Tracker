import { withAuth, withOptionalAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { getFullSave } from '@/lib/db/saves';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  return withOptionalAuth(req, async (uid) => {
    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];
    
    if (!saveId) {
      return new Response(JSON.stringify({ error: 'Save ID is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const save: FullDetailsSave | null = await getFullSave(saveId);
    if (!save) {
      return new Response(JSON.stringify({ error: 'Save not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Add ownership information to the response
    const responseData = {
      ...save,
      isOwner: uid === save.userId
    };

    return new Response(JSON.stringify(responseData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];
    
    if (!saveId) {
      return new Response(JSON.stringify({ error: 'Save ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if save exists first
    const save = await prisma.save.findUnique({
      where: { id: saveId },
      select: { userId: true }
    });

    if (!save) {
      return new Response(JSON.stringify({ error: 'Save not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user owns the save
    if (save.userId !== uid) {
      return new Response(JSON.stringify({ error: 'Forbidden: You can only delete your own saves' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      await prisma.save.delete({
        where: { id: saveId },
      });
      return new Response(JSON.stringify({ message: 'Save and all associated data deleted successfully' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error deleting save:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete save' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
}
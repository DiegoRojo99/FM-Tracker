import { withAuth, withOptionalAuth } from '@/lib/auth/withAuth';
import type { NextRequest } from 'next/server';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { getFullSave, invalidateUserPreviewSavesCache } from '@/lib/db/saves';
import { prisma } from '@/lib/db/prisma';
import { deleteCacheKey } from '@/lib/cache/redis';
import { apiError, badRequest, forbidden, notFound, ok, success } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withOptionalAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];
    if (!saveId) return badRequest('Save ID is required');

    const save: FullDetailsSave | null = await getFullSave(saveId);
    if (!save) return notFound('Save not found');

    // Add ownership information to the response
    const responseData = {
      ...save,
      isOwner: uid === save.userId
    };

    return ok(responseData);
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return apiError('Authentication required', 401);

    // Extract the save ID from the URL
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];
    if (!saveId) return badRequest('Save ID is required');

    // Check if save exists first
    const save = await prisma.save.findUnique({
      where: { id: saveId },
      select: { userId: true }
    });

    // Check if user owns the save
    if (!save) return notFound('Save not found');
    if (save.userId !== uid) return forbidden('Forbidden: You can only delete your own saves');

    try {
      await prisma.save.delete({
        where: { id: saveId },
      });

      await Promise.all([
        deleteCacheKey('stats:global'),
        invalidateUserPreviewSavesCache(save.userId),
      ]);

      return success({ message: 'Save and all associated data deleted successfully' });
    } 
    catch (error) {
      console.error('Error deleting save:', error);
      return apiError('Failed to delete save', 500);
    }
  });
}
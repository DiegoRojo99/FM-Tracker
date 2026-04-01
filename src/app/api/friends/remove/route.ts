import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

// DELETE /api/friends/remove - Remove a friendship
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const body = await request.json();
      const { friendId } = body;

      if (!friendId) {
        return NextResponse.json(
          { error: 'Friend ID is required' },
          { status: 400 }
        );
      }

      // Find the friendship (check both directions since we store with consistent ordering)
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: uid, user2Id: friendId },
            { user1Id: friendId, user2Id: uid }
          ]
        },
        include: {
          user1: true,
          user2: true
        }
      });

      if (!friendship) {
        return NextResponse.json(
          { error: 'Friendship not found' },
          { status: 404 }
        );
      }

      // Delete the friendship
      await prisma.friendship.delete({
        where: {
          id: friendship.id
        }
      });

      const removedFriend = friendship.user1Id === uid 
        ? friendship.user2 
        : friendship.user1;

      return NextResponse.json({
        success: true,
        message: 'Friendship removed successfully',
        removedFriend
      });

    } catch (error) {
      console.error('Error removing friendship:', error);
      return NextResponse.json(
        { error: 'Failed to remove friendship' },
        { status: 500 }
      );
    }
  });
}
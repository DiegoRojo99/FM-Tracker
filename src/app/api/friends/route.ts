import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

// GET /api/friends - Get all friends for the authenticated user
export async function GET(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      // Get all friendships where the user is either user1 or user2
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: uid },
            { user2Id: uid }
          ]
        },
        include: {
          user1: true,
          user2: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform to return only the friend (not the current user)
      const friends = friendships.map(friendship => {
        const friend = friendship.user1Id === uid ? friendship.user2 : friendship.user1;
        return {
          ...friend,
          friendshipDate: friendship.createdAt
        };
      });

      return NextResponse.json({
        friends,
        count: friends.length
      });

    } catch (error) {
      console.error('Error fetching friends:', error);
      return NextResponse.json(
        { error: 'Failed to fetch friends' },
        { status: 500 }
      );
    }
  });
}
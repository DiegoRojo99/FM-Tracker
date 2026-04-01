import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

// GET /api/friends/search?q=query - Search for users to add as friends
export async function GET(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');

      if (!query || query.length < 2) {
        return NextResponse.json(
          { error: 'Query must be at least 2 characters long' },
          { status: 400 }
        );
      }

      // Search for users by display name or email
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              uid: {
                not: uid // Exclude the searching user
              }
            },
            {
              OR: [
                {
                  displayName: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  email: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        },
        take: 20 // Limit results
      });

      // For each user, check their relationship status with the current user
      const usersWithStatus = await Promise.all(
        users.map(async (user) => {
          // Check if already friends
          const friendship = await prisma.friendship.findFirst({
            where: {
              OR: [
                { user1Id: uid, user2Id: user.uid },
                { user1Id: user.uid, user2Id: uid }
              ]
            }
          });

          if (friendship) {
            return {
              ...user,
              relationshipStatus: 'friend',
              canSendRequest: false
            };
          }

          // Check for existing friend requests
          const existingRequest = await prisma.friendRequest.findFirst({
            where: {
              OR: [
                { requesterId: uid, receiverId: user.uid },
                { requesterId: user.uid, receiverId: uid }
              ]
            },
            orderBy: {
              requestedAt: 'desc'
            }
          });

          if (existingRequest) {
            if (existingRequest.requesterId === uid) {
              return {
                ...user,
                relationshipStatus: `request_sent_${existingRequest.status.toLowerCase()}`,
                canSendRequest: false
              };
            } 
            else {
              return {
                ...user,
                relationshipStatus: `request_received_${existingRequest.status.toLowerCase()}`,
                canSendRequest: false,
                pendingRequestId: existingRequest.id
              };
            }
          }

          // No relationship exists, can send request
          return {
            ...user,
            relationshipStatus: 'none',
            canSendRequest: true
          };
        })
      );

      return NextResponse.json({
        users: usersWithStatus,
        query,
        count: usersWithStatus.length
      });

    } 
    catch (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }
  });
}
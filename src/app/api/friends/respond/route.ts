import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { FriendRequestStatus, FriendRequestWithRequester } from '@/lib/types/prisma/Friends';

// POST /api/friends/respond - Accept or reject a friend request
export async function POST(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const body = await request.json();
      const { requestId, action } = body;

      if (!requestId || !action) {
        return NextResponse.json(
          { error: 'Request ID and action are required' },
          { status: 400 }
        );
      }

      if (!['accept', 'reject', 'block'].includes(action)) {
        return NextResponse.json(
          { error: 'Action must be accept, reject, or block' },
          { status: 400 }
        );
      }

      // Find the friend request
      const friendRequest: FriendRequestWithRequester | null = await prisma.friendRequest.findFirst({
        where: {
          id: requestId,
          receiverId: uid, // Only the receiver can respond
          status: 'PENDING'
        },
        include: {
          requester: true
        }
      });

      if (!friendRequest) {
        return NextResponse.json(
          { error: 'Friend request not found or already responded to' },
          { status: 404 }
        );
      }

      if (action === 'accept') {
        // Create friendship with consistent user ID ordering (smaller UID first)
        const user1Id = friendRequest.requesterId < uid ? friendRequest.requesterId : uid;
        const user2Id = friendRequest.requesterId < uid ? uid : friendRequest.requesterId;

        // Start a transaction to create friendship and update request
        const result = await prisma.$transaction(async (tx) => {
          // Create the friendship
          const friendship = await tx.friendship.create({
            data: {
              user1Id,
              user2Id
            },
            include: {
              user1: true,
              user2: true
            }
          });

          // Update the friend request to mark as accepted (though we'll delete it)
          const updatedRequest = await tx.friendRequest.update({
            where: { id: requestId },
            data: {
              respondedAt: new Date()
            }
          });

          // Delete the friend request since it's now a friendship
          await tx.friendRequest.delete({
            where: { id: requestId }
          });

          return { friendship, updatedRequest };
        });

        const friend = result.friendship.user1Id === uid 
          ? result.friendship.user2 
          : result.friendship.user1;

        return NextResponse.json({
          success: true,
          action: 'accepted',
          friendship: result.friendship,
          friend
        });
      } 
      else {
        // Reject or block
        const status: FriendRequestStatus = action === 'block' ? 'BLOCKED' : 'REJECTED';
        
        const updatedRequest = await prisma.friendRequest.update({
          where: { id: requestId },
          data: {
            status,
            respondedAt: new Date()
          },
          include: {
            requester: true
          }
        });

        return NextResponse.json({
          success: true,
          action: action,
          request: updatedRequest
        });
      }
    } 
    catch (error) {
      console.error('Error responding to friend request:', error);
      return NextResponse.json(
        { error: 'Failed to respond to friend request' },
        { status: 500 }
      );
    }
  });
}
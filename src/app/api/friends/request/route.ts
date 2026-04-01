import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

// POST /api/friends/request - Send a friend request
export async function POST(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const body = await request.json();
      const { receiverEmail, message } = body;

      if (!receiverEmail) {
        return NextResponse.json(
          { error: 'Receiver email is required' },
          { status: 400 }
        );
      }

      // Find the receiver by email
      const receiver = await prisma.user.findUnique({
        where: { email: receiverEmail }
      });

      if (!receiver) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user is trying to send request to themselves
      if (receiver.uid === uid) {
        return NextResponse.json(
          { error: 'Cannot send friend request to yourself' },
          { status: 400 }
        );
      }

      // Check if friendship already exists
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: uid, user2Id: receiver.uid },
            { user1Id: receiver.uid, user2Id: uid }
          ]
        }
      });

      if (existingFriendship) {
        return NextResponse.json(
          { error: 'Users are already friends' },
          { status: 400 }
        );
      }

      // Check if a friend request already exists (in either direction)
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { requesterId: uid, receiverId: receiver.uid },
            { requesterId: receiver.uid, receiverId: uid }
          ],
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        if (existingRequest.requesterId === uid) {
          return NextResponse.json(
            { error: 'Friend request already sent to this user' },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: 'This user has already sent you a friend request' },
            { status: 400 }
          );
        }
      }

      // Check if user has blocked the requester or vice versa
      const blockedRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { requesterId: uid, receiverId: receiver.uid, status: 'BLOCKED' },
            { requesterId: receiver.uid, receiverId: uid, status: 'BLOCKED' }
          ]
        }
      });

      if (blockedRequest) {
        return NextResponse.json(
          { error: 'Cannot send friend request to this user' },
          { status: 403 }
        );
      }

      // Create the friend request
      const friendRequest = await prisma.friendRequest.create({
        data: {
          requesterId: uid,
          receiverId: receiver.uid,
          message: message || null,
        },
        include: {
          receiver: true
        }
      });

      return NextResponse.json({
        success: true,
        request: friendRequest
      });

    } catch (error) {
      console.error('Error sending friend request:', error);
      return NextResponse.json(
        { error: 'Failed to send friend request' },
        { status: 500 }
      );
    }
  });
}
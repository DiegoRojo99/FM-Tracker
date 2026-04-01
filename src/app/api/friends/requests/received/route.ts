import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { FriendRequestWithRequester, FriendsRequestReceivedResponse } from '@/lib/types/prisma/Friends';

// GET /api/friends/requests/received - Get all friend requests received by the user
export async function GET(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get('status'); // Optional filter by status

      const where: any = {
        receiverId: uid
      };

      // Add status filter if provided
      if (status && ['PENDING', 'REJECTED', 'BLOCKED'].includes(status)) {
        where.status = status;
      }

      const receivedRequests: FriendRequestWithRequester[] = await prisma.friendRequest.findMany({
        where,
        include: {
          requester: true
        },
        orderBy: {
          requestedAt: 'desc'
        }
      });

      // Separate pending requests for easy access (these need action)
      const pendingRequests = receivedRequests.filter(req => req.status === 'PENDING');
      const processedRequests = receivedRequests.filter(req => req.status !== 'PENDING');

      // Group by status for easy consumption
      const grouped = receivedRequests.reduce((acc, request) => {
        const status = request.status.toLowerCase();
        if (!acc[status]) acc[status] = [];
        acc[status].push(request);
        return acc;
      }, {} as Record<string, FriendRequestWithRequester[]>);

      const responseData: FriendsRequestReceivedResponse = {
        requests: receivedRequests,
        pendingRequests,
        processedRequests,
        grouped,
        count: receivedRequests.length,
        pendingCount: pendingRequests.length
      };

      return NextResponse.json(responseData);

    } 
    catch (error) {
      console.error('Error fetching received friend requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch received friend requests' },
        { status: 500 }
      );
    }
  });
}
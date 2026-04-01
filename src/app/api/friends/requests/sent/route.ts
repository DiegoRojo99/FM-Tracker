import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { FriendRequestWithReceiver, FriendsRequestSentResponse } from '@/lib/types/prisma/Friends';

// GET /api/friends/requests/sent - Get all friend requests sent by the user
export async function GET(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');

      // Build the where clause based on the presence of status filter
      const where: Record<string, any> = { requesterId: uid };
      if (status && ['PENDING', 'REJECTED', 'BLOCKED'].includes(status)) where.status = status;
      console.log('Querying with where clause:', where);

      const sentRequests: FriendRequestWithReceiver[] = await prisma.friendRequest.findMany({
        where: where,
        include: {
          receiver: true
        },
        orderBy: {
          requestedAt: 'desc'
        }
      });

      // Group by status for easy consumption
      const grouped = sentRequests.reduce((acc, request) => {
        const status = request.status.toLowerCase();
        if (!acc[status]) acc[status] = [];
        acc[status].push(request);
        return acc;
      }, {} as Record<string, FriendRequestWithReceiver[]>);

      const responseData: FriendsRequestSentResponse = {
        requests: sentRequests,
        grouped,
        count: sentRequests.length
      };
      
      return NextResponse.json(responseData);

    } 
    catch (error) {
      console.error('Error fetching sent friend requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sent friend requests' },
        { status: 500 }
      );
    }
  });
}
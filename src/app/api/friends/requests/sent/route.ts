import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

// GET /api/friends/requests/sent - Get all friend requests sent by the user
export async function GET(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get('status'); // Optional filter by status

      const where: any = {
        requesterId: uid
      };

      // Add status filter if provided
      if (status && ['PENDING', 'REJECTED', 'BLOCKED'].includes(status)) {
        where.status = status;
      }

      const sentRequests = await prisma.friendRequest.findMany({
        where,
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
      }, {} as Record<string, typeof sentRequests>);

      return NextResponse.json({
        requests: sentRequests,
        grouped,
        count: sentRequests.length
      });

    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sent friend requests' },
        { status: 500 }
      );
    }
  });
}
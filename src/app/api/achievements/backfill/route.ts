import { withAuth } from '@/lib/auth/withAuth';
import { evaluateAchievementsForUser } from '@/lib/db/achievements';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    try {
      const body = await req.json().catch(() => ({}));
      const saveId = body?.saveId as string | undefined;

      let gameId: string | undefined;
      if (saveId) {
        const save = await prisma.save.findUnique({
          where: { id: saveId },
          select: { userId: true, gameId: true },
        });

        if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 });
        if (save.userId !== uid) return NextResponse.json({ error: 'Forbidden: You can only backfill your own saves' }, { status: 403 });
        gameId = save.gameId;
      }

      const result = await evaluateAchievementsForUser({
        userId: uid,
        saveId,
        gameId,
        eventType: 'season.created',
        evaluateAll: true,
        eventTimestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        evaluatedCount: result.evaluatedCount,
        unlockedNow: result.unlockedNow,
      });
    } catch (error) {
      console.error('Error running achievements backfill:', error);
      return NextResponse.json({ error: 'Failed to run achievements backfill' }, { status: 500 });
    }
  });
}

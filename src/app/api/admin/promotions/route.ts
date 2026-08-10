import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { ok } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') ?? undefined;

    const rows = await prisma.leagueResult.findMany({
      where: {
        promoted: true,
        ...(userId ? { season: { save: { userId } } } : {}),
      },
      include: {
        competition: { select: { name: true, tier: true, countryCode: true } },
        season: {
          include: {
            save: { select: { id: true, userId: true } },
            team: { select: { name: true } },
          },
        },
      },
      orderBy: [{ season: { save: { userId: 'asc' } } }, { id: 'asc' }],
    });

    return ok(rows.map(r => ({
      leagueResultId: r.id,
      seasonId: r.seasonId,
      position: r.position,
      team: r.season.team?.name ?? '?',
      competition: r.competition.name,
      competitionTier: r.competition.tier,
      countryCode: r.competition.countryCode,
      saveId: r.season.save?.id ?? '?',
      userId: r.season.save?.userId ?? '?',
    })));
  }, { requireAdmin: true });
}

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { ok, badRequest } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') ?? undefined;
    const search = searchParams.get('q') ?? undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const competitions = await prisma.competitionGroup.findMany({
      where: {
        ...(country ? { countryCode: country } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      select: { id: true, name: true, displayName: true, countryCode: true, type: true, tier: true, isActive: true },
      orderBy: [{ countryCode: 'asc' }, { tier: 'asc' }, { name: 'asc' }],
      take: 200,
    });

    return ok(competitions);
  }, { requireAdmin: true });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async () => {
    const body = await req.json();
    const { id, tier } = body;

    if (typeof id !== 'number') return badRequest('id required');
    if (tier !== null && (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 1)) {
      return badRequest('tier must be a positive integer or null');
    }

    const updated = await prisma.competitionGroup.update({
      where: { id },
      data: { tier: tier ?? null },
      select: { id: true, name: true, tier: true },
    });

    return ok(updated);
  }, { requireAdmin: true });
}

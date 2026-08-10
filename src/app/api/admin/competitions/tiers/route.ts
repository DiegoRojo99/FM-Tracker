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
      take: 2000,
    });

    return ok(competitions);
  }, { requireAdmin: true });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async () => {
    const body = await req.json();
    const { id, tier, type } = body;

    if (typeof id !== 'number') return badRequest('id required');
    if (tier !== undefined && tier !== null && (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 1)) {
      return badRequest('tier must be a positive integer or null');
    }
    const VALID_TYPES = ['DOMESTIC_LEAGUE', 'DOMESTIC_CUP', 'CONTINENTAL_CLUB', 'INTERNATIONAL_NT', 'SUPER_CUP', 'Other'];
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return badRequest(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const data: Record<string, unknown> = {};
    if (tier !== undefined) data.tier = tier ?? null;
    if (type !== undefined) data.type = type;

    const updated = await prisma.competitionGroup.update({
      where: { id },
      data,
      select: { id: true, name: true, tier: true, type: true },
    });

    return ok(updated);
  }, { requireAdmin: true });
}

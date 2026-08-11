import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/withAuth';
import { apiError, badRequest, conflict, notFound, ok } from '@/lib/api/response';
import { fetchFromApi } from '@/lib/apiFootball';
import type { ApiLeague } from '@/lib/types/FootballAPI';

const VALID_TYPES = ['DOMESTIC_LEAGUE', 'DOMESTIC_CUP', 'CONTINENTAL_CLUB', 'INTERNATIONAL_NT', 'SUPER_CUP', 'Other'];

function normalizeTypeFromApi(apiType: string | null | undefined): string {
  const normalized = (apiType ?? '').trim().toLowerCase();
  if (normalized === 'league') return 'DOMESTIC_LEAGUE';
  if (normalized === 'cup') return 'DOMESTIC_CUP';
  if (normalized === 'super cup') return 'SUPER_CUP';
  return 'Other';
}

function normalizeTypeInput(type: string | null | undefined): string | null {
  if (!type) return null;

  const raw = type.trim();
  if (raw.length === 0) return null;
  if (VALID_TYPES.includes(raw)) return raw;

  const normalized = raw.toLowerCase();
  if (normalized === 'league' || normalized === 'domestic league' || normalized === 'domestic_league') return 'DOMESTIC_LEAGUE';
  if (normalized === 'cup' || normalized === 'domestic cup' || normalized === 'domestic_cup') return 'DOMESTIC_CUP';
  if (normalized === 'continental club' || normalized === 'continental_club') return 'CONTINENTAL_CLUB';
  if (normalized === 'international nt' || normalized === 'international_nt') return 'INTERNATIONAL_NT';
  if (normalized === 'super cup' || normalized === 'super_cup' || normalized === 'supercup') return 'SUPER_CUP';
  if (normalized === 'other') return 'Other';

  return null;
}

function inferIsFemale(name: string): boolean | null {
  if (/women|womens|femenino|femenina|feminine|feminin|frauen|damen|ladies|wsl|nwsl|we league/i.test(name)) {
    return true;
  }
  return null;
}

async function resolveCountryCode(countryCode: string | null, countryName: string | null): Promise<string | null> {
  if (countryCode) {
    const byCode = await prisma.country.findUnique({ where: { code: countryCode }, select: { code: true } });
    if (byCode) return byCode.code;
  }

  if (countryName) {
    const byName = await prisma.country.findFirst({
      where: { name: { equals: countryName, mode: 'insensitive' } },
      select: { code: true },
    });
    if (byName) return byName.code;
  }

  return null;
}

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('q') ?? undefined;
      const country = searchParams.get('country') ?? undefined;
      const type = normalizeTypeInput(searchParams.get('type')) ?? undefined;
      const activeOnly = searchParams.get('activeOnly') === 'true';
      const isFemaleParam = searchParams.get('isFemale');
      const isFemale = isFemaleParam === 'true' ? true : isFemaleParam === 'false' ? false : undefined;

      const rows = await prisma.apiCompetition.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { countryCode: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
          ...(country ? { countryCode: country } : {}),
          ...(type ? { type } : {}),
          ...(activeOnly ? { isActive: true } : {}),
          ...(isFemale !== undefined ? { isFemale } : {}),
        },
        select: {
          id: true,
          name: true,
          countryCode: true,
          type: true,
          tier: true,
          isFemale: true,
          isActive: true,
          logoUrl: true,
          updatedAt: true,
          _count: {
            select: {
              groups: true,
              teamSeasons: true,
            },
          },
        },
        orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
        take: 4000,
      });

      return ok(rows);
    } catch (error) {
      console.error('Admin API competitions GET failed:', error);
      return apiError(error instanceof Error ? error.message : 'Failed to load API competitions', 500);
    }
  }, { requireAdmin: true });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const body = await req.json();
      const { id, isActive, tier, type, isFemale } = body as {
        id: number;
        isActive?: boolean;
        tier?: number | null;
        type?: string;
        isFemale?: boolean | null;
      };
      const normalizedType = type === undefined ? undefined : normalizeTypeInput(type);

      if (typeof id !== 'number' || !Number.isInteger(id)) return badRequest('id must be an integer');
      if (isActive !== undefined && typeof isActive !== 'boolean') return badRequest('isActive must be a boolean');
      if (tier !== undefined && tier !== null && (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 1)) {
        return badRequest('tier must be a positive integer or null');
      }
      if (type !== undefined && normalizedType === null) {
        return badRequest(`type must be one of: ${VALID_TYPES.join(', ')}`);
      }
      if (isFemale !== undefined && isFemale !== null && typeof isFemale !== 'boolean') {
        return badRequest('isFemale must be boolean or null');
      }

      const existing = await prisma.apiCompetition.findUnique({ where: { id }, select: { id: true } });
      if (!existing) return notFound(`ApiCompetition id=${id} not found`);

      const data: {
        isActive?: boolean;
        tier?: number | null;
        type?: string;
        isFemale?: boolean | null;
      } = {};

      if (isActive !== undefined) data.isActive = isActive;
      if (tier !== undefined) data.tier = tier;
      if (normalizedType !== undefined) data.type = normalizedType;
      if (isFemale !== undefined) data.isFemale = isFemale;

      const updated = await prisma.apiCompetition.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          countryCode: true,
          type: true,
          tier: true,
          isFemale: true,
          isActive: true,
          logoUrl: true,
          updatedAt: true,
          _count: { select: { groups: true, teamSeasons: true } },
        },
      });

      return ok(updated);
    } catch (error) {
      console.error('Admin API competitions PATCH failed:', error);
      return apiError(error instanceof Error ? error.message : 'Failed to update API competition', 500);
    }
  }, { requireAdmin: true });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const body = await req.json();
      const { id } = body as { id: number };
      if (typeof id !== 'number' || !Number.isInteger(id)) return badRequest('id must be an integer');

      const existing = await prisma.apiCompetition.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          _count: { select: { groups: true, teamSeasons: true } },
        },
      });

      if (!existing) return notFound(`ApiCompetition id=${id} not found`);

      const result = await prisma.$transaction(async (tx) => {
        const groupsDeleted = await tx.competitionGroupApiCompetition.deleteMany({ where: { apiCompetitionId: id } });
        const teamSeasonsDeleted = await tx.teamSeason.deleteMany({ where: { apiCompetitionId: id } });
        await tx.apiCompetition.delete({ where: { id } });
        return {
          groupsDeleted: groupsDeleted.count,
          teamSeasonsDeleted: teamSeasonsDeleted.count,
        };
      });

      return ok({
        deleted: true,
        id,
        name: existing.name,
        ...result,
      });
    } catch (error) {
      console.error('Admin API competitions DELETE failed:', error);
      return apiError(error instanceof Error ? error.message : 'Failed to delete API competition', 500);
    }
  }, { requireAdmin: true });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const body = await req.json();
      const { apiId, isActive, tier, type, isFemale } = body as {
        apiId: number;
        isActive?: boolean;
        tier?: number | null;
        type?: string;
        isFemale?: boolean | null;
      };
      const normalizedType = type === undefined ? undefined : normalizeTypeInput(type);

      if (typeof apiId !== 'number' || !Number.isInteger(apiId) || apiId <= 0) {
        return badRequest('apiId must be a positive integer');
      }
      if (isActive !== undefined && typeof isActive !== 'boolean') return badRequest('isActive must be a boolean');
      if (tier !== undefined && tier !== null && (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 1)) {
        return badRequest('tier must be a positive integer or null');
      }
      if (type !== undefined && normalizedType === null) {
        return badRequest(`type must be one of: ${VALID_TYPES.join(', ')}`);
      }
      if (isFemale !== undefined && isFemale !== null && typeof isFemale !== 'boolean') {
        return badRequest('isFemale must be boolean or null');
      }

      const leagues = await fetchFromApi(`/leagues?id=${apiId}`) as ApiLeague[];
      const league = leagues[0];
      if (!league) return notFound(`No API league found for id=${apiId}`);

      const resolvedCountryCode = await resolveCountryCode(league.country.code, league.country.name);
      if (!resolvedCountryCode) {
        return badRequest(
          `Cannot resolve country code for API league id=${apiId}. Country=${league.country.name}, code=${league.country.code}`
        );
      }

      const existingByNameCountry = await prisma.apiCompetition.findFirst({
        where: {
          id: { not: apiId },
          name: { equals: league.league.name, mode: 'insensitive' },
          countryCode: resolvedCountryCode,
        },
        select: { id: true },
      });

      if (existingByNameCountry) {
        return conflict(
          `Another ApiCompetition already uses this name+country (${league.league.name} / ${resolvedCountryCode}) as id=${existingByNameCountry.id}`
        );
      }

      const createdOrUpdated = await prisma.apiCompetition.upsert({
        where: { id: apiId },
        create: {
          id: apiId,
          name: league.league.name,
          countryCode: resolvedCountryCode,
          type: normalizedType ?? normalizeTypeFromApi(league.league.type),
          logoUrl: league.league.logo,
          tier: tier ?? null,
          isFemale: isFemale ?? inferIsFemale(league.league.name),
          isActive: isActive ?? true,
        },
        update: {
          name: league.league.name,
          countryCode: resolvedCountryCode,
          type: normalizedType ?? normalizeTypeFromApi(league.league.type),
          logoUrl: league.league.logo,
          ...(tier !== undefined ? { tier } : {}),
          ...(isFemale !== undefined ? { isFemale } : { isFemale: inferIsFemale(league.league.name) }),
          ...(isActive !== undefined ? { isActive } : {}),
        },
        select: {
          id: true,
          name: true,
          countryCode: true,
          type: true,
          tier: true,
          isFemale: true,
          isActive: true,
          logoUrl: true,
          updatedAt: true,
          _count: { select: { groups: true, teamSeasons: true } },
        },
      });

      return ok(createdOrUpdated);
    } catch (error) {
      console.error('Admin API competitions POST failed:', error);
      return apiError(error instanceof Error ? error.message : 'Failed to create API competition', 500);
    }
  }, { requireAdmin: true });
}

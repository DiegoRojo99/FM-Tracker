import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { readThroughCache } from '@/lib/cache/redis';

function isTruthy(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fmOnly = isTruthy(url.searchParams.get('fmOnly'));
  const format = url.searchParams.get('format');
  const cacheKey = fmOnly ? 'countries:fm-only' : 'countries:all';

  const { data: countries, cacheStatus } = await readThroughCache(
    cacheKey,
    60 * 60 * 24,
    () => prisma.country.findMany({
      where: fmOnly ? { inFootballManager: true } : undefined,
      orderBy: { name: 'asc' },
    })
  );

  if (format === 'map') {
    const countryMap = Object.fromEntries(
      countries.map((country) => [
        country.name,
        {
          code: country.code,
          inFootballManager: country.inFootballManager,
        },
      ])
    );

    return NextResponse.json(
      {
        count: countries.length,
        fmOnly,
        map: countryMap,
      },
      {
        status: 200,
        headers: { 'x-cache': cacheStatus },
      }
    );
  }

  return NextResponse.json(countries, {
    status: 200,
    headers: { 'x-cache': cacheStatus }
  });
}

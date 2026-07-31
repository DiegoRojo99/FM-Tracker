import { NextRequest } from 'next/server';
import { readThroughCache } from '@/lib/cache/redis';
import { getActiveCompetitions, normalizeCompetitionType } from '@/lib/db/competitions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countries = searchParams.getAll('country');
  const compType = searchParams.get('type');
  const normalizedType = normalizeCompetitionType(compType) ?? 'all';

  const normalizedCountries = countries.length > 0
    ? [...countries].sort().join(',')
    : 'all';

  const cacheKey = `competitions:${normalizedType}:${normalizedCountries}`;
  const { data: competitions, cacheStatus } = await readThroughCache(
    cacheKey,
    60 * 30,
    () => getActiveCompetitions({ countries, type: compType })
  );

  return new Response(JSON.stringify(competitions), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'x-cache': cacheStatus,
    }
  });
}

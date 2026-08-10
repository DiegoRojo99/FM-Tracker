import { NextRequest } from 'next/server';
import { readThroughCache } from '@/lib/cache/redis';
import { getActiveCompetitions, normalizeCompetitionType } from '@/lib/db/competitions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countries = searchParams.getAll('country');
  const compType = searchParams.get('type');
  const types = compType ? compType.split(',').map(t => normalizeCompetitionType(t.trim())).filter(Boolean) as string[] : [];
  const normalizedType = types.length > 0 ? types.join(',') : 'all';

  const normalizedCountries = countries.length > 0
    ? [...countries].sort().join(',')
    : 'all';

  const cacheKey = `competitions:${normalizedType}:${normalizedCountries}`;
  const { data: competitions, cacheStatus } = await readThroughCache(
    cacheKey,
    60 * 30,
    () => getActiveCompetitions({ countries, types: types.length > 0 ? types : undefined })
  );

  return new Response(JSON.stringify(competitions), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'x-cache': cacheStatus,
    }
  });
}

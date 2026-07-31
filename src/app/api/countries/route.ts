import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';
import { readThroughCache } from '@/lib/cache/redis';

export async function GET() {
  const { data: countries, cacheStatus } = await readThroughCache(
    'countries:all',
    60 * 60 * 24,
    () => prisma.country.findMany({})
  );

  return NextResponse.json(countries, {
    status: 200,
    headers: { 'x-cache': cacheStatus }
  });
}

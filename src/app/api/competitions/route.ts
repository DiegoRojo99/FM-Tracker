import { NextRequest } from 'next/server';
import { CompetitionGroup } from '../../../../prisma/generated/client';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countries = searchParams.getAll('country');
  const compType = searchParams.get('type');
  let countriesToQuery: string[] = [];

  if (countries) countriesToQuery = countries
  else {
    // Fetch all country codes
    const countries = await prisma.country.findMany({
      where: { inFootballManager: true },
      select: { code: true }
    });
    countriesToQuery = countries.map(c => c.code);
  }

  const competitions: CompetitionGroup[] = await prisma.competitionGroup.findMany({
    where: {
      countryCode: { in: countriesToQuery },
      ...(compType ? { type: compType.charAt(0).toUpperCase() + compType.slice(1).toLowerCase() } : {})
    }
  });

  return new Response(JSON.stringify(competitions), { status: 200 });
}

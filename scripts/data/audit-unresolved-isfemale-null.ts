import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const [
    teamNullCount,
    competitionGroupNullCount,
    apiCompetitionNullCount,
    teamNullSample,
    competitionGroupNullSample,
    apiCompetitionNullSample,
  ] = await Promise.all([
    prisma.team.count({ where: { isFemale: null } }),
    prisma.competitionGroup.count({ where: { isFemale: null } }),
    prisma.apiCompetition.count({ where: { isFemale: null } }),
    prisma.team.findMany({
      where: { isFemale: null },
      select: { id: true, name: true, countryCode: true },
      orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
      take: 20,
    }),
    prisma.competitionGroup.findMany({
      where: { isFemale: null },
      select: { id: true, name: true, countryCode: true, type: true, isActive: true },
      orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
      take: 20,
    }),
    prisma.apiCompetition.findMany({
      where: { isFemale: null },
      select: { id: true, name: true, countryCode: true, type: true, isActive: true },
      orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
      take: 20,
    }),
  ]);

  const result = {
    generatedAt: new Date().toISOString(),
    counts: {
      teamNullCount,
      competitionGroupNullCount,
      apiCompetitionNullCount,
    },
    samples: {
      teamNullSample,
      competitionGroupNullSample,
      apiCompetitionNullSample,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  // Find every LeagueResult where promoted=true but the competition is top-flight (tier=1).
  const badRows = await prisma.leagueResult.findMany({
    where: {
      promoted: true,
      competition: { tier: 1 },
    },
    include: {
      competition: { select: { name: true, tier: true } },
      season: {
        include: {
          save: { select: { id: true, userId: true } },
          team: { select: { name: true } },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  if (badRows.length === 0) {
    console.log('No incorrect promotions found. Nothing to fix.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${badRows.length} LeagueResult row(s) with promoted=true in a tier-1 competition:\n`);
  for (const row of badRows) {
    console.log(
      `  id=${row.id}  season=${row.seasonId}  team=${row.season.team?.name ?? '?'}` +
      `  competition=${row.competition.name} (tier ${row.competition.tier})` +
      `  save=${row.season.save?.id ?? '?'}  user=${row.season.save?.userId ?? '?'}`
    );
  }

  const ids = badRows.map(r => r.id);
  const { count } = await prisma.leagueResult.updateMany({
    where: { id: { in: ids } },
    data: { promoted: false },
  });

  console.log(`\nFixed ${count} record(s). promoted set to false.`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error('Failed to fix promotions:', error);
  process.exit(1);
});

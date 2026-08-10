import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const leagueResult = await prisma.competitionGroup.updateMany({
    where: { type: 'League' },
    data: { type: 'DOMESTIC_LEAGUE' },
  });

  const cupResult = await prisma.competitionGroup.updateMany({
    where: { type: 'Cup' },
    data: { type: 'DOMESTIC_CUP' },
  });

  console.log(`Normalised types: League→DOMESTIC_LEAGUE: ${leagueResult.count}, Cup→DOMESTIC_CUP: ${cupResult.count}`);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });

import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  // Show distinct country codes that actually exist in the DB
  const codes = await prisma.competitionGroup.findMany({
    select: { countryCode: true },
    distinct: ['countryCode'],
    orderBy: { countryCode: 'asc' },
    where: { type: { in: ['DOMESTIC_LEAGUE', 'League'] }, isActive: true },
  });
  console.log('Country codes in DB (active domestic leagues):');
  console.log(codes.map(c => c.countryCode).join(', '));

  // Show sample names for a few key countries to calibrate patterns
  const samples = await prisma.competitionGroup.findMany({
    where: {
      type: { in: ['DOMESTIC_LEAGUE', 'League'] },
      isActive: true,
      countryCode: { in: codes.slice(0, 20).map(c => c.countryCode) },
    },
    select: { countryCode: true, name: true, tier: true },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
    take: 80,
  });
  console.log('\nSample competitions:');
  for (const s of samples) console.log(`  [${s.countryCode}] tier=${s.tier ?? '—'}  ${s.name}`);

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });

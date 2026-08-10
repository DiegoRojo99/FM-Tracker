import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  // Step 1: Rename legacy raw import values.
  const [leagueResult, cupResult, superCupLegacy, internationalLegacy] = await Promise.all([
    prisma.competitionGroup.updateMany({ where: { type: 'League' }, data: { type: 'DOMESTIC_LEAGUE' } }),
    prisma.competitionGroup.updateMany({ where: { type: 'Cup' }, data: { type: 'DOMESTIC_CUP' } }),
    prisma.competitionGroup.updateMany({ where: { type: { in: ['Super Cup', 'SuperCup', 'Supercup'] } }, data: { type: 'SUPER_CUP' } }),
    prisma.competitionGroup.updateMany({ where: { type: 'International' }, data: { type: 'INTERNATIONAL_NT' } }),
  ]);

  // Step 2: Reclassify by name — only touch competitions still at DOMESTIC_* types.
  // Competitions already set via admin UI to any other type are left alone.
  const domesticFilter = { type: { in: ['DOMESTIC_LEAGUE', 'DOMESTIC_CUP'] } } as const;
  const CONTINENTAL_PATTERNS = [
    'champions league', 'europa league', 'conference league',
    'copa libertadores', 'libertadores', 'copa sudamericana', 'sudamericana',
    'concacaf champions', 'caf champions', 'afc champions', 'ofc champions',
    'club world cup', 'intercontinental',
  ];
  const INTERNATIONAL_PATTERNS = [
    'world cup', 'euro ', 'european championship', 'copa america', 'copa américa',
    'africa cup', 'asian cup', 'gold cup', 'nations league', 'nations cup',
    'olympic', 'u-21', 'u-20', 'u-19', 'u-17',
  ];
  const SUPER_CUP_PATTERNS = [
    'super cup', 'supercup', 'supercopa', 'super coupe', 'supercoppa',
    'community shield', 'charity shield', 'trophée des champions',
  ];

  const buildNameFilter = (patterns: string[]) =>
    patterns.map(p => ({ name: { contains: p, mode: 'insensitive' as const } }));

  const [continental, international, superCup] = await Promise.all([
    prisma.competitionGroup.updateMany({
      where: { ...domesticFilter, OR: buildNameFilter(CONTINENTAL_PATTERNS) },
      data: { type: 'CONTINENTAL_CLUB' },
    }),
    prisma.competitionGroup.updateMany({
      where: { ...domesticFilter, OR: buildNameFilter(INTERNATIONAL_PATTERNS) },
      data: { type: 'INTERNATIONAL_NT' },
    }),
    prisma.competitionGroup.updateMany({
      where: { ...domesticFilter, OR: buildNameFilter(SUPER_CUP_PATTERNS) },
      data: { type: 'SUPER_CUP' },
    }),
  ]);

  console.log('Normalised types:');
  console.log(`  League → DOMESTIC_LEAGUE: ${leagueResult.count}`);
  console.log(`  Cup → DOMESTIC_CUP: ${cupResult.count}`);
  console.log(`  Super Cup (legacy) → SUPER_CUP: ${superCupLegacy.count}`);
  console.log(`  International (legacy) → INTERNATIONAL_NT: ${internationalLegacy.count}`);
  console.log(`  → CONTINENTAL_CLUB (by name): ${continental.count}`);
  console.log(`  → INTERNATIONAL_NT (by name): ${international.count}`);
  console.log(`  → SUPER_CUP (by name): ${superCup.count}`);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });

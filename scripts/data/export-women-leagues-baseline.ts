import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const [
    totalTeams,
    femaleTeams,
    maleTeams,
    unknownGenderTeams,
    activeCompetitionGroups,
    competitionGroupLinks,
    activeLeagueRows,
  ] = await Promise.all([
    prisma.team.count(),
    prisma.team.count({ where: { isFemale: true } }),
    prisma.team.count({ where: { isFemale: false } }),
    prisma.team.count({ where: { isFemale: null } }),
    prisma.competitionGroup.count({ where: { isActive: true } }),
    prisma.competitionGroupApiCompetition.count(),
    prisma.competitionGroup.findMany({
      where: { isActive: true },
      select: { id: true, name: true, countryCode: true, type: true, tier: true },
      orderBy: [{ countryCode: 'asc' }, { type: 'asc' }, { tier: 'asc' }, { name: 'asc' }],
    }),
  ]);

  const generatedAt = new Date().toISOString();

  const baseline = {
    generatedAt,
    totals: {
      teams: {
        total: totalTeams,
        female: femaleTeams,
        male: maleTeams,
        unknown: unknownGenderTeams,
      },
      competitions: {
        activeCompetitionGroups,
        competitionGroupApiCompetitionLinks: competitionGroupLinks,
      },
    },
  };

  const activeLeagueIds = {
    generatedAt,
    count: activeLeagueRows.length,
    leagues: activeLeagueRows,
  };

  const baselinePath = resolve(process.cwd(), 'scripts/data/women-leagues-baseline.json');
  const activeIdsPath = resolve(process.cwd(), 'scripts/data/active-competition-groups-snapshot.json');

  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  writeFileSync(activeIdsPath, JSON.stringify(activeLeagueIds, null, 2));

  console.log(`Exported baseline -> scripts/data/women-leagues-baseline.json`);
  console.log(`Exported active groups -> scripts/data/active-competition-groups-snapshot.json`);
  console.log(`Team totals: ${totalTeams} total, ${femaleTeams} female, ${maleTeams} male, ${unknownGenderTeams} unknown`);
  console.log(`Competition totals: ${activeCompetitionGroups} active groups, ${competitionGroupLinks} group links`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

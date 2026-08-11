import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type CompetitionGroupSnapshotEntry = {
  name: string;
  displayName: string;
  countryCode: string;
  type: string;
  tier: number | null;
  isActive: boolean;
  isFemale: boolean | null;
  logoUrl: string | null;
};

type ApiCompetitionSnapshotEntry = {
  id: number;
  name: string;
  countryCode: string;
  type: string;
  tier: number | null;
  isActive: boolean;
  isFemale: boolean | null;
  logoUrl: string | null;
};

type CompetitionLinkSnapshotEntry = {
  groupName: string;
  groupCountryCode: string;
  apiCompetitionId: number;
};

type UnifiedSnapshot = {
  meta: {
    generatedAt: string;
    version: 1;
  };
  competitionGroups: CompetitionGroupSnapshotEntry[];
  apiCompetitions: ApiCompetitionSnapshotEntry[];
  links: CompetitionLinkSnapshotEntry[];
};

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const [groups, apiCompetitions, links] = await Promise.all([
    prisma.competitionGroup.findMany({
      select: {
        name: true,
        displayName: true,
        countryCode: true,
        type: true,
        tier: true,
        isActive: true,
        isFemale: true,
        logoUrl: true,
      },
      orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
    }),
    prisma.apiCompetition.findMany({
      select: {
        id: true,
        name: true,
        countryCode: true,
        type: true,
        tier: true,
        isActive: true,
        isFemale: true,
        logoUrl: true,
      },
      orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
    }),
    prisma.competitionGroupApiCompetition.findMany({
      select: {
        apiCompetitionId: true,
        competitionGroup: {
          select: {
            name: true,
            countryCode: true,
          },
        },
      },
      orderBy: [{ competitionGroupId: 'asc' }, { apiCompetitionId: 'asc' }],
    }),
  ]);

  const snapshot: UnifiedSnapshot = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: 1,
    },
    competitionGroups: groups.map((group) => ({
      name: group.name,
      displayName: group.displayName,
      countryCode: group.countryCode,
      type: group.type,
      tier: group.tier,
      isActive: group.isActive,
      isFemale: group.isFemale,
      logoUrl: group.logoUrl,
    })),
    apiCompetitions: apiCompetitions.map((competition) => ({
      id: competition.id,
      name: competition.name,
      countryCode: competition.countryCode,
      type: competition.type,
      tier: competition.tier,
      isActive: competition.isActive,
      isFemale: competition.isFemale,
      logoUrl: competition.logoUrl,
    })),
    links: links
      .filter((link) => Boolean(link.competitionGroup))
      .map((link) => ({
        groupName: link.competitionGroup.name,
        groupCountryCode: link.competitionGroup.countryCode,
        apiCompetitionId: link.apiCompetitionId,
      })),
  };

  const outPath = resolve(process.cwd(), 'scripts/data/competitions-unified-snapshot.json');
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

  console.log(`Exported unified snapshot to scripts/data/competitions-unified-snapshot.json`);
  console.log(`Competition groups: ${snapshot.competitionGroups.length}`);
  console.log(`API competitions: ${snapshot.apiCompetitions.length}`);
  console.log(`Group-API links: ${snapshot.links.length}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

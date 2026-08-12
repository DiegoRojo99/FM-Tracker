import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { existsSync, readFileSync } from 'node:fs';
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
    version: number;
  };
  competitionGroups: CompetitionGroupSnapshotEntry[];
  apiCompetitions: ApiCompetitionSnapshotEntry[];
  links: CompetitionLinkSnapshotEntry[];
};

type ApplySummary = {
  dryRun: boolean;
  groupsCreated: number;
  groupsUpdated: number;
  groupsUnchanged: number;
  groupsUnmatched: number;
  apiCreated: number;
  apiUpdated: number;
  apiUnchanged: number;
  linksCreated: number;
  linksExisting: number;
  linksUnmatched: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    preserveApiIsFemaleNonNull: args.includes('--preserve-api-isfemale-non-null'),
  };
}

async function run() {
  const { dryRun, preserveApiIsFemaleNonNull } = parseArgs();
  const snapshotPath = resolve(process.cwd(), 'scripts/data/competitions-unified-snapshot.json');

  if (!existsSync(snapshotPath)) {
    throw new Error('Missing scripts/data/competitions-unified-snapshot.json. Run unified export first.');
  }

  const snapshotRaw = readFileSync(snapshotPath, 'utf-8');
  const snapshot = JSON.parse(snapshotRaw) as UnifiedSnapshot;

  const { prisma } = await import('../../src/lib/db/prisma');

  const summary: ApplySummary = {
    dryRun,
    groupsCreated: 0,
    groupsUpdated: 0,
    groupsUnchanged: 0,
    groupsUnmatched: 0,
    apiCreated: 0,
    apiUpdated: 0,
    apiUnchanged: 0,
    linksCreated: 0,
    linksExisting: 0,
    linksUnmatched: 0,
  };
  let apiIsFemaleNullPreserved = 0;

  const groupIdByKey = new Map<string, number>();

  for (const group of snapshot.competitionGroups) {
    const existing = await prisma.competitionGroup.findFirst({
      where: {
        countryCode: group.countryCode,
        name: { equals: group.name, mode: 'insensitive' },
      },
      select: {
        id: true,
        displayName: true,
        type: true,
        tier: true,
        isActive: true,
        isFemale: true,
        logoUrl: true,
      },
    });

    if (!existing) {
      summary.groupsCreated += 1;
      if (!dryRun) {
        const created = await prisma.competitionGroup.create({
          data: {
            name: group.name,
            displayName: group.displayName,
            countryCode: group.countryCode,
            type: group.type,
            tier: group.tier,
            isActive: group.isActive,
            isFemale: group.isFemale,
            logoUrl: group.logoUrl,
          },
          select: { id: true },
        });
        groupIdByKey.set(`${group.countryCode}::${group.name.toLowerCase()}`, created.id);
      }
      continue;
    }

    const changed =
      existing.displayName !== group.displayName ||
      existing.type !== group.type ||
      existing.tier !== group.tier ||
      existing.isActive !== group.isActive ||
      existing.isFemale !== group.isFemale ||
      existing.logoUrl !== group.logoUrl;

    if (!changed) {
      summary.groupsUnchanged += 1;
    } else {
      summary.groupsUpdated += 1;
      if (!dryRun) {
        await prisma.competitionGroup.update({
          where: { id: existing.id },
          data: {
            displayName: group.displayName,
            type: group.type,
            tier: group.tier,
            isActive: group.isActive,
            isFemale: group.isFemale,
            logoUrl: group.logoUrl,
          },
        });
      }
    }

    groupIdByKey.set(`${group.countryCode}::${group.name.toLowerCase()}`, existing.id);
  }

  for (const api of snapshot.apiCompetitions) {
    const existing = await prisma.apiCompetition.findUnique({
      where: { id: api.id },
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
    });

    if (!existing) {
      summary.apiCreated += 1;
      if (!dryRun) {
        await prisma.apiCompetition.create({
          data: {
            id: api.id,
            name: api.name,
            countryCode: api.countryCode,
            type: api.type,
            tier: api.tier,
            isActive: api.isActive,
            isFemale: api.isFemale,
            logoUrl: api.logoUrl,
          },
        });
      }
      continue;
    }

    const nextIsFemale =
      preserveApiIsFemaleNonNull && api.isFemale === null && existing.isFemale !== null
        ? existing.isFemale
        : api.isFemale;

    if (nextIsFemale !== api.isFemale) {
      apiIsFemaleNullPreserved += 1;
    }

    const changed =
      existing.name !== api.name ||
      existing.countryCode !== api.countryCode ||
      existing.type !== api.type ||
      existing.tier !== api.tier ||
      existing.isActive !== api.isActive ||
      existing.isFemale !== nextIsFemale ||
      existing.logoUrl !== api.logoUrl;

    if (!changed) {
      summary.apiUnchanged += 1;
      continue;
    }

    summary.apiUpdated += 1;
    if (!dryRun) {
      await prisma.apiCompetition.update({
        where: { id: api.id },
        data: {
          name: api.name,
          countryCode: api.countryCode,
          type: api.type,
          tier: api.tier,
          isActive: api.isActive,
          isFemale: nextIsFemale,
          logoUrl: api.logoUrl,
        },
      });
    }
  }

  if (!dryRun) {
    const allGroups = await prisma.competitionGroup.findMany({
      select: { id: true, name: true, countryCode: true },
    });
    for (const group of allGroups) {
      groupIdByKey.set(`${group.countryCode}::${group.name.toLowerCase()}`, group.id);
    }
  }

  const apiIds = [...new Set(snapshot.links.map((link) => link.apiCompetitionId))];
  const existingApis = await prisma.apiCompetition.findMany({
    where: { id: { in: apiIds } },
    select: { id: true },
  });
  const existingApiSet = new Set(existingApis.map((api) => api.id));

  for (const link of snapshot.links) {
    const groupId = groupIdByKey.get(`${link.groupCountryCode}::${link.groupName.toLowerCase()}`);
    if (!groupId || !existingApiSet.has(link.apiCompetitionId)) {
      summary.linksUnmatched += 1;
      continue;
    }

    const existingLink = await prisma.competitionGroupApiCompetition.findFirst({
      where: {
        competitionGroupId: groupId,
        apiCompetitionId: link.apiCompetitionId,
      },
      select: { id: true },
    });

    if (existingLink) {
      summary.linksExisting += 1;
      continue;
    }

    summary.linksCreated += 1;
    if (!dryRun) {
      await prisma.competitionGroupApiCompetition.create({
        data: {
          competitionGroupId: groupId,
          apiCompetitionId: link.apiCompetitionId,
        },
      });
    }
  }

  console.log(dryRun ? 'Unified apply dry run complete.' : 'Unified apply complete.');
  console.log(`Mode preserve-api-isfemale-non-null: ${preserveApiIsFemaleNonNull ? 'enabled' : 'disabled'}`);
  console.log(`Snapshot version: ${snapshot.meta?.version ?? 'unknown'}`);
  console.log(`Snapshot generatedAt: ${snapshot.meta?.generatedAt ?? 'unknown'}`);
  console.log(`Groups created/updated/unchanged: ${summary.groupsCreated}/${summary.groupsUpdated}/${summary.groupsUnchanged}`);
  console.log(`API created/updated/unchanged: ${summary.apiCreated}/${summary.apiUpdated}/${summary.apiUnchanged}`);
  console.log(`API null isFemale values preserved from DB: ${apiIsFemaleNullPreserved}`);
  console.log(`Links created/existing/unmatched: ${summary.linksCreated}/${summary.linksExisting}/${summary.linksUnmatched}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

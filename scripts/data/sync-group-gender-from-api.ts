import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

type ScriptOptions = {
  dryRun: boolean;
};

type Summary = {
  mode: 'dry-run' | 'execute';
  groupsScanned: number;
  groupsWithLinks: number;
  groupsWithoutLinks: number;
  groupsUpdated: number;
  groupsUnchanged: number;
  derivedTrue: number;
  derivedFalse: number;
  derivedNull: number;
};

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: !args.includes('--execute'),
  };
}

async function run() {
  const options = parseArgs();
  const { prisma } = await import('../../src/lib/db/prisma');

  const groups = await prisma.competitionGroup.findMany({
    select: {
      id: true,
      isFemale: true,
      apiCompetitions: {
        select: {
          apiCompetition: {
            select: {
              isFemale: true,
            },
          },
        },
      },
    },
  });

  const summary: Summary = {
    mode: options.dryRun ? 'dry-run' : 'execute',
    groupsScanned: groups.length,
    groupsWithLinks: 0,
    groupsWithoutLinks: 0,
    groupsUpdated: 0,
    groupsUnchanged: 0,
    derivedTrue: 0,
    derivedFalse: 0,
    derivedNull: 0,
  };

  for (const group of groups) {
    const linkedStatuses = group.apiCompetitions
      .map((entry) => entry.apiCompetition?.isFemale)
      .filter((value): value is boolean | null => value !== undefined);

    if (linkedStatuses.length === 0) {
      summary.groupsWithoutLinks += 1;
      continue;
    }

    summary.groupsWithLinks += 1;

    let derived: boolean | null;

    if (linkedStatuses.some((value) => value === null)) {
      derived = null;
    } else if (linkedStatuses.every((value) => value === true)) {
      derived = true;
    } else if (linkedStatuses.every((value) => value === false)) {
      derived = false;
    } else {
      derived = null;
    }

    if (derived === true) summary.derivedTrue += 1;
    else if (derived === false) summary.derivedFalse += 1;
    else summary.derivedNull += 1;

    if (group.isFemale === derived) {
      summary.groupsUnchanged += 1;
      continue;
    }

    summary.groupsUpdated += 1;

    if (!options.dryRun) {
      await prisma.competitionGroup.update({
        where: { id: group.id },
        data: { isFemale: derived },
      });
    }
  }

  console.log('CompetitionGroup gender sync from linked ApiCompetition values:');
  console.log(`- Mode: ${summary.mode}`);
  console.log(`- Groups scanned: ${summary.groupsScanned}`);
  console.log(`- Groups with links: ${summary.groupsWithLinks}`);
  console.log(`- Groups without links: ${summary.groupsWithoutLinks}`);
  console.log(`- Groups updated: ${summary.groupsUpdated}`);
  console.log(`- Groups unchanged: ${summary.groupsUnchanged}`);
  console.log(`- Derived true/false/null: ${summary.derivedTrue}/${summary.derivedFalse}/${summary.derivedNull}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

type Summary = {
  apiCompetitionsTotal: number;
  apiCompetitionsUpdated: number;
  apiCompetitionsFemale: number;
  apiCompetitionsMale: number;
  apiCompetitionsNull: number;
  dryRun: boolean;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
  };
}

async function run() {
  const { dryRun } = parseArgs();
  const { prisma } = await import('../../src/lib/db/prisma');

  const apiCompetitions = await prisma.apiCompetition.findMany({
    select: {
      id: true,
      isFemale: true,
      groups: {
        select: {
          competitionGroup: {
            select: {
              isActive: true,
              type: true,
              isFemale: true,
            },
          },
        },
      },
    },
  });

  const summary: Summary = {
    apiCompetitionsTotal: apiCompetitions.length,
    apiCompetitionsUpdated: 0,
    apiCompetitionsFemale: 0,
    apiCompetitionsMale: 0,
    apiCompetitionsNull: 0,
    dryRun,
  };

  for (const competition of apiCompetitions) {
    const groupStatuses = competition.groups
      .map((entry) => entry.competitionGroup)
      .filter((group): group is NonNullable<typeof group> => Boolean(group) && group.isActive && group.type === 'DOMESTIC_LEAGUE')
      .map((group) => group.isFemale);

    const derived = groupStatuses.some((value) => value === true)
      ? true
      : groupStatuses.some((value) => value === false)
        ? false
        : null;

    if (derived === true) summary.apiCompetitionsFemale += 1;
    else if (derived === false) summary.apiCompetitionsMale += 1;
    else summary.apiCompetitionsNull += 1;

    if (competition.isFemale !== derived) {
      summary.apiCompetitionsUpdated += 1;
      if (!dryRun) {
        await prisma.apiCompetition.update({
          where: { id: competition.id },
          data: { isFemale: derived },
        });
      }
    }
  }

  console.log('API competition gender sync summary:');
  console.log(`- Mode: ${dryRun ? 'dry-run' : 'execute'}`);
  console.log(`- Total API competitions: ${summary.apiCompetitionsTotal}`);
  console.log(`- Updated API competitions: ${summary.apiCompetitionsUpdated}`);
  console.log(`- Derived women/male/null: ${summary.apiCompetitionsFemale}/${summary.apiCompetitionsMale}/${summary.apiCompetitionsNull}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
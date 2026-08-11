import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { fetchFromApi } from '../../src/lib/apiFootball';
import type { ApiLeague, ApiLeagueSeason, ApiTeam } from '../../src/lib/types/FootballAPI';

type ScriptOptions = {
  dryRun: boolean;
  seasons: number[];
  limit?: number;
  refreshExisting: boolean;
  refreshMetadata: boolean;
};

type Summary = {
  activeCompetitionGroups: number;
  mappedApiCompetitions: number;
  processedApiCompetitions: number;
  missingLeagueMetadata: number;
  seasonsRequested: number[];
  seasonsProcessed: number;
  seasonsSkippedUnavailable: number;
  seasonsSkippedAlreadySeeded: number;
  seasonApiErrors: number;
  leagueMetadataCalls: number;
  competitionsSkippedAlreadySeeded: number;
  teamsFetched: number;
  teamsCreated: number;
  teamsUpdated: number;
  teamsMarkedFemale: number;
  teamsMarkedMale: number;
  teamSeasonsInserted: number;
};

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const argText = args.join(' ');
  const executeFromArgs = /(^|\s)--execute(\s|$)/.test(argText);
  const executeFromEnv = process.env.SEED_EXECUTE === '1' || process.env.npm_config_execute === 'true' || process.env.npm_config_execute === '1';
  const execute = executeFromArgs || executeFromEnv;
  const dryRun = !execute;
  const refreshExisting = /(^|\s)--refresh-existing(\s|$)/.test(argText)
    || process.env.SEED_REFRESH_EXISTING === '1'
    || process.env.npm_config_refresh_existing === 'true'
    || process.env.npm_config_refresh_existing === '1';
  const refreshMetadata = /(^|\s)--refresh-metadata(\s|$)/.test(argText)
    || process.env.SEED_REFRESH_METADATA === '1'
    || process.env.npm_config_refresh_metadata === 'true'
    || process.env.npm_config_refresh_metadata === '1';

  const seasonsMatch = argText.match(/--seasons=([^\s]+)/);
  const seasonsSource = seasonsMatch?.[1] ?? process.env.SEED_SEASONS ?? process.env.npm_config_seasons;
  const seasons = seasonsSource
    ? seasonsSource
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isInteger(n) && n > 2000)
    : [2025, 2026];

  const limitMatch = argText.match(/--limit=(\d+)/);
  const limitRaw = limitMatch?.[1] ?? process.env.SEED_LIMIT ?? process.env.npm_config_limit;
  const limitValue = limitRaw ? Number(limitRaw) : undefined;
  const limit = Number.isInteger(limitValue) && (limitValue as number) > 0 ? (limitValue as number) : undefined;

  return { dryRun, seasons, limit, refreshExisting, refreshMetadata };
}

function normalizeCountryKey(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function isWomenCompetitionName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /women|womens|wsl|femenino|femenina|femenil|feminine|féminin|femminile|ladies|frauen|damen|damallsvenskan|f\.?league\s*women/i.test(name);
}

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');
  const options = parseArgs();

  if (!options.dryRun && !process.env.API_FOOTBALL_KEY) {
    throw new Error('API_FOOTBALL_KEY is required when running with --execute.');
  }

  const summary: Summary = {
    activeCompetitionGroups: 0,
    mappedApiCompetitions: 0,
    processedApiCompetitions: 0,
    missingLeagueMetadata: 0,
    seasonsRequested: options.seasons,
    seasonsProcessed: 0,
    seasonsSkippedUnavailable: 0,
    seasonsSkippedAlreadySeeded: 0,
    seasonApiErrors: 0,
    leagueMetadataCalls: 0,
    competitionsSkippedAlreadySeeded: 0,
    teamsFetched: 0,
    teamsCreated: 0,
    teamsUpdated: 0,
    teamsMarkedFemale: 0,
    teamsMarkedMale: 0,
    teamSeasonsInserted: 0,
  };

  const [activeGroups, countries] = await Promise.all([
    prisma.competitionGroup.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        countryCode: true,
        apiCompetitions: {
          select: {
            apiCompetitionId: true,
            apiCompetition: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                type: true,
                isFemale: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.country.findMany({
      select: { code: true, name: true },
    }),
  ]);

  summary.activeCompetitionGroups = activeGroups.length;

  const countryCodeByKey = new Map<string, string>();
  for (const country of countries) {
    countryCodeByKey.set(normalizeCountryKey(country.name), country.code);
    countryCodeByKey.set(normalizeCountryKey(country.code), country.code);
  }

  const competitionMap = new Map<number, {
    id: number;
    name: string;
    countryCode: string;
    type: string;
    isFemale: boolean | null;
    logoUrl: string | null;
  }>();

  for (const group of activeGroups) {
    for (const mapping of group.apiCompetitions) {
      const apiCompetition = mapping.apiCompetition;
      if (!apiCompetition) continue;
      competitionMap.set(apiCompetition.id, {
        id: apiCompetition.id,
        name: apiCompetition.name,
        countryCode: apiCompetition.countryCode,
        type: apiCompetition.type,
        isFemale: apiCompetition.isFemale,
        logoUrl: apiCompetition.logoUrl,
      });
    }
  }

  const mappedCompetitions = Array.from(competitionMap.values());
  summary.mappedApiCompetitions = mappedCompetitions.length;

  const competitionsToProcess = options.limit
    ? mappedCompetitions.slice(0, options.limit)
    : mappedCompetitions;

  const seasonLabels = options.seasons.map((year) => `${year}/${year + 1}`);
  const competitionIds = competitionsToProcess.map((competition) => competition.id);
  const existingSeasonPairs = await prisma.teamSeason.findMany({
    where: {
      apiCompetitionId: { in: competitionIds },
      season: { in: seasonLabels },
    },
    select: {
      apiCompetitionId: true,
      season: true,
    },
  });

  const seededPairSet = new Set(
    existingSeasonPairs.map((row) => `${row.apiCompetitionId}::${row.season}`)
  );

  console.log(`Active groups: ${summary.activeCompetitionGroups}`);
  console.log(`Mapped API competitions: ${summary.mappedApiCompetitions}`);
  console.log(`Mode: ${options.dryRun ? 'dry-run' : 'execute'}`);
  console.log(`Requested seasons: ${options.seasons.join(', ')}`);
  console.log(`Refresh existing season data: ${options.refreshExisting ? 'yes' : 'no'}`);
  console.log(`Refresh league metadata: ${options.refreshMetadata ? 'yes' : 'no'}`);
  if (options.limit) console.log(`Limit: ${options.limit}`);
  if (options.dryRun) {
    console.log('Dry run mode enabled. Use --execute to perform API fetch + database writes.');
  }

  for (const competition of competitionsToProcess) {
    summary.processedApiCompetitions += 1;

    if (options.dryRun) continue;

    const seasonsToFetch = options.seasons.filter((year) => {
      if (options.refreshExisting) return true;
      const seasonLabel = `${year}/${year + 1}`;
      const alreadySeeded = seededPairSet.has(`${competition.id}::${seasonLabel}`);
      if (alreadySeeded) {
        summary.seasonsSkippedAlreadySeeded += 1;
        return false;
      }
      return true;
    });

    if (seasonsToFetch.length === 0) {
      summary.competitionsSkippedAlreadySeeded += 1;
      if (!options.refreshMetadata) continue;
    }

    let availableYears: Set<number> | null = null;
    let inferredIsFemale = competition.isFemale === true;

    const shouldFetchLeagueMeta = options.refreshMetadata || seasonsToFetch.length > 0;
    if (shouldFetchLeagueMeta) {
      summary.leagueMetadataCalls += 1;
      try {
        const leagueMetaResponse = await fetchFromApi(`/leagues?id=${competition.id}`) as ApiLeague[];
        const leagueMeta = leagueMetaResponse[0];

        if (!leagueMeta) {
          summary.missingLeagueMetadata += 1;
        } else {
          availableYears = new Set(
            leagueMeta.seasons
              .map((season: ApiLeagueSeason) => Number(season.year))
              .filter((year) => Number.isInteger(year))
          );

          inferredIsFemale = isWomenCompetitionName(leagueMeta.league.name) || competition.isFemale === true;

          await prisma.apiCompetition.update({
            where: { id: competition.id },
            data: {
              name: leagueMeta.league.name,
              logoUrl: leagueMeta.league.logo,
              countryCode: leagueMeta.country.code ?? competition.countryCode,
              isFemale: inferredIsFemale,
            },
          });
        }
      } catch {
        summary.missingLeagueMetadata += 1;
      }
    }

    for (const year of seasonsToFetch) {
      if (availableYears && !availableYears.has(year)) {
        summary.seasonsSkippedUnavailable += 1;
        continue;
      }

      let teamResponse: ApiTeam[] = [];
      try {
        teamResponse = await fetchFromApi(`/teams?league=${competition.id}&season=${year}`) as ApiTeam[];
      } catch {
        summary.seasonApiErrors += 1;
        continue;
      }

      summary.seasonsProcessed += 1;
      summary.teamsFetched += teamResponse.length;

      if (teamResponse.length === 0) continue;

      const teamIds = teamResponse.map((entry) => entry.team.id);
      const existingTeams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, isFemale: true },
      });
      const existingById = new Map(existingTeams.map((team) => [team.id, team]));

      for (const teamEntry of teamResponse) {
        const existing = existingById.get(teamEntry.team.id);

        const resolvedCountryCode =
          countryCodeByKey.get(normalizeCountryKey(teamEntry.team.country)) ??
          competition.countryCode;

        const createIsFemale = inferredIsFemale ? true : false;

        const updateGenderData = inferredIsFemale
          ? { isFemale: true }
          : existing?.isFemale === null
            ? { isFemale: false }
            : {};

        await prisma.team.upsert({
          where: { id: teamEntry.team.id },
          create: {
            id: teamEntry.team.id,
            name: teamEntry.team.name,
            logo: teamEntry.team.logo,
            national: teamEntry.team.national || false,
            countryCode: resolvedCountryCode,
            lat: teamEntry.venue?.lat ?? null,
            lng: teamEntry.venue?.lng ?? null,
            isFemale: createIsFemale,
          },
          update: {
            name: teamEntry.team.name,
            logo: teamEntry.team.logo,
            national: teamEntry.team.national || false,
            countryCode: resolvedCountryCode,
            lat: teamEntry.venue?.lat ?? null,
            lng: teamEntry.venue?.lng ?? null,
            ...updateGenderData,
          },
        });

        if (existing) summary.teamsUpdated += 1;
        else summary.teamsCreated += 1;

        if (createIsFemale) summary.teamsMarkedFemale += 1;
        else if (!existing || existing.isFemale === null) summary.teamsMarkedMale += 1;
      }

      const seasonLabel = `${year}/${year + 1}`;
      const createManyResult = await prisma.teamSeason.createMany({
        data: teamResponse.map((entry) => ({
          teamId: entry.team.id,
          apiCompetitionId: competition.id,
          season: seasonLabel,
        })),
        skipDuplicates: true,
      });
      summary.teamSeasonsInserted += createManyResult.count;
      seededPairSet.add(`${competition.id}::${seasonLabel}`);
    }

    if (summary.processedApiCompetitions % 20 === 0) {
      console.log(`Processed ${summary.processedApiCompetitions}/${competitionsToProcess.length} competitions...`);
    }
  }

  const unknownGenderRemaining = await prisma.team.count({ where: { isFemale: null } });

  console.log('\nSeed summary:');
  console.log(`- Active competition groups: ${summary.activeCompetitionGroups}`);
  console.log(`- Mapped API competitions: ${summary.mappedApiCompetitions}`);
  console.log(`- Processed API competitions: ${summary.processedApiCompetitions}`);
  console.log(`- Missing league metadata: ${summary.missingLeagueMetadata}`);
  console.log(`- Seasons requested: ${summary.seasonsRequested.join(', ')}`);
  console.log(`- Seasons processed: ${summary.seasonsProcessed}`);
  console.log(`- Seasons skipped (unavailable): ${summary.seasonsSkippedUnavailable}`);
  console.log(`- Seasons skipped (already seeded): ${summary.seasonsSkippedAlreadySeeded}`);
  console.log(`- Season API errors: ${summary.seasonApiErrors}`);
  console.log(`- League metadata API calls: ${summary.leagueMetadataCalls}`);
  console.log(`- Competitions fully skipped (already seeded): ${summary.competitionsSkippedAlreadySeeded}`);
  console.log(`- Teams fetched: ${summary.teamsFetched}`);
  console.log(`- Teams created: ${summary.teamsCreated}`);
  console.log(`- Teams updated: ${summary.teamsUpdated}`);
  console.log(`- Team gender marks (female): ${summary.teamsMarkedFemale}`);
  console.log(`- Team gender marks (male/default): ${summary.teamsMarkedMale}`);
  console.log(`- TeamSeason rows inserted: ${summary.teamSeasonsInserted}`);
  console.log(`- Unknown team gender remaining: ${unknownGenderRemaining}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

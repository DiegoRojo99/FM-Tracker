import { ChallengeGoalLogic, ChallengeStatus } from '../../../prisma/generated/client';
import { CHALLENGE_COUNTRY_CODES } from '../data/countryReference';

export type ChallengeRuleCatalogEntry = {
  kind: string;
  subjectType?: string;
  operator: string;
  config: Record<string, unknown>;
  weight?: number;
};

export type ChallengeGoalCatalogEntry = {
  position: number;
  title?: string;
  description: string;
  logic?: ChallengeGoalLogic;
  metadata?: Record<string, unknown>;
  rules: ChallengeRuleCatalogEntry[];
};

export type ChallengeCatalogEntry = {
  key: string;
  title: string;
  description: string;
  summary?: string;
  status?: ChallengeStatus;
  sortOrder: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  goals: ChallengeGoalCatalogEntry[];
};

export const CHALLENGE_CATALOG: ChallengeCatalogEntry[] = [
  {
    key: 'starter.domestic-double',
    title: 'Domestic Double Dash',
    description: 'Win both your domestic top division and domestic cup with the same club in one save.',
    summary: 'League plus cup in the same country.',
    status: 'PUBLISHED',
    sortOrder: 10,
    tags: ['starter', 'domestic', 'trophy'],
    goals: [
      {
        position: 1,
        description: 'Win a domestic league title in any country',
        logic: 'ALL',
        rules: [
          {
            kind: 'domestic.league.any-country',
            subjectType: 'competition',
            operator: 'achieved',
            config: { minimum: 1 },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a domestic cup in the same country as one of your league titles',
        logic: 'ALL',
        rules: [
          {
            kind: 'domestic.double.same-country',
            subjectType: 'competition',
            operator: 'achieved',
            config: { minimum: 1 },
          },
        ],
      },
    ],
  },
  {
    key: 'journeyman.cross-border',
    title: 'Cross-Border Collector',
    description: 'Win titles in three different countries with your managed clubs.',
    summary: 'Show continental versatility.',
    status: 'PUBLISHED',
    sortOrder: 30,
    tags: ['journeyman', 'countries', 'long-run'],
    goals: [
      {
        position: 1,
        description: 'Win titles in at least 1 country',
        rules: [
          {
            kind: 'country.distinct-titles-min',
            subjectType: 'country',
            operator: 'gte',
            config: { minCountries: 1 },
          },
        ],
      },
      {
        position: 2,
        description: 'Win titles in at least 2 different countries',
        rules: [
          {
            kind: 'country.distinct-titles-min',
            subjectType: 'country',
            operator: 'gte',
            config: { minCountries: 2 },
          },
        ],
      },
      {
        position: 3,
        description: 'Win titles in at least 3 different countries',
        rules: [
          {
            kind: 'country.distinct-titles-min',
            subjectType: 'country',
            operator: 'gte',
            config: { minCountries: 3 },
          },
        ],
      },
    ],
  },
  {
    key: 'group.red-bull-world-tour',
    title: 'Red Bull World Tour',
    description: 'Win at least one trophy with each key club in the Red Bull network.',
    summary: 'Salzburg, Leipzig, New York, Bragantino.',
    status: 'PUBLISHED',
    sortOrder: 40,
    tags: ['club-group', 'red-bull', 'multi-club'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Red Bull Salzburg',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'redbull.salzburg' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a trophy with RB Leipzig',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'redbull.leipzig' },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a trophy with New York Red Bulls',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'redbull.new-york-red-bulls' },
          },
        ],
      },
      {
        position: 4,
        description: 'Win a trophy with Red Bull Bragantino',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'redbull.bragantino' },
          },
        ],
      },
    ],
  },
  {
    key: 'group.city-football-global',
    title: 'City Football Global',
    description: 'Win at least one trophy with core clubs in the City Football Group network.',
    summary: 'Manchester, Girona, New York City, Melbourne.',
    status: 'PUBLISHED',
    sortOrder: 50,
    tags: ['club-group', 'city-group', 'multi-club'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Manchester City',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'city.manchester-city' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a trophy with Girona',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'city.girona' },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a trophy with New York City FC',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'city.new-york-city' },
          },
        ],
      },
      {
        position: 4,
        description: 'Win a trophy with Melbourne City',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'city.melbourne-city' },
          },
        ],
      },
      {
        position: 5,
        description: 'Win a trophy with Troyes',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'city.troyes' },
          },
        ],
      },
    ],
  },
  {
    key: 'group.blueco-circuit',
    title: 'BlueCo Circuit',
    description: 'Win a trophy with both major BlueCo clubs.',
    summary: 'Chelsea and Strasbourg.',
    status: 'PUBLISHED',
    sortOrder: 60,
    tags: ['club-group', 'blueco', 'multi-club'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Chelsea',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'blueco.chelsea' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a trophy with Strasbourg',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'blueco.strasbourg' },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.scandinavian-sweep',
    title: 'Scandinavian Sweep',
    description: 'Win domestic titles across Scandinavia.',
    summary: 'Denmark, Sweden, Norway.',
    status: 'PUBLISHED',
    sortOrder: 70,
    tags: ['regions', 'scandinavia', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in Denmark',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.DENMARK },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Sweden',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SWEDEN },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in Norway',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.NORWAY },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.north-america-top-3',
    title: 'North America Top 3',
    description: 'Win domestic titles in the top three North American football countries.',
    summary: 'USA, Mexico, Canada.',
    status: 'PUBLISHED',
    sortOrder: 80,
    tags: ['regions', 'north-america', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in the United States',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.UNITED_STATES },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Mexico',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.MEXICO },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in Canada',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.CANADA },
          },
        ],
      },
    ],
  },
  {
    key: 'veteran.european-ladder',
    title: 'European Ladder',
    description: 'Complete Europe by lifting Conference League, Europa League, and Champions League titles.',
    summary: 'Climb every UEFA tier.',
    status: 'PUBLISHED',
    sortOrder: 50,
    tags: ['veteran', 'europe', 'uefa'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Conference League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'uefa.conference-league' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win UEFA Europa League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'uefa.europa-league' },
          },
        ],
      },
      {
        position: 3,
        description: 'Win UEFA Champions League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'uefa.champions-league' },
          },
        ],
      },
    ],
  },
  {
    key: 'veteran.continental-royalty',
    title: 'Continental Royalty',
    description: 'Lift every major continental club title across world football.',
    summary: 'UEFA, CONMEBOL, CONCACAF, CAF, AFC, OFC.',
    status: 'PUBLISHED',
    sortOrder: 90,
    tags: ['veteran', 'continental', 'global'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'uefa.champions-league' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win CONMEBOL Copa Libertadores',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'conmebol.libertadores' },
          },
        ],
      },
      {
        position: 3,
        description: 'Win CONCACAF Champions Cup',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'concacaf.champions-cup' },
          },
        ],
      },
      {
        position: 4,
        description: 'Win CAF Champions League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'caf.champions-league' },
          },
        ],
      },
      {
        position: 5,
        description: 'Win AFC Champions League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'afc.champions-league' },
          },
        ],
      },
      {
        position: 6,
        description: 'Win OFC Champions League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'ofc.champions-league' },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.british-isles-circuit',
    title: 'British Isles Circuit',
    description: 'Win domestic titles across the British Isles.',
    summary: 'England, Scotland, Wales, Ireland, Northern Ireland.',
    status: 'PUBLISHED',
    sortOrder: 100,
    tags: ['regions', 'british-isles', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in England',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.ENGLAND },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Scotland',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SCOTLAND },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in Wales',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.WALES },
          },
        ],
      },
      {
        position: 4,
        description: 'Win a title in Ireland',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.IRELAND },
          },
        ],
      },
      {
        position: 5,
        description: 'Win a title in Northern Ireland',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.NORTHERN_IRELAND },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.iberian-peninsula',
    title: 'Iberian Peninsula',
    description: 'Win domestic titles across Iberia.',
    summary: 'Spain and Portugal.',
    status: 'PUBLISHED',
    sortOrder: 110,
    tags: ['regions', 'iberia', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in Spain',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SPAIN },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Portugal',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.PORTUGAL },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.benelux-tour',
    title: 'Benelux Tour',
    description: 'Win across the core Benelux path available in-game.',
    summary: 'Netherlands, Belgium, and a trophy with Vaduz.',
    status: 'PUBLISHED',
    sortOrder: 120,
    tags: ['regions', 'benelux', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in the Netherlands',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.NETHERLANDS },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Belgium',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.BELGIUM },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a trophy with Vaduz',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'vaduz' },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.balkans-sweep',
    title: 'Balkans Sweep',
    description: 'Win domestic titles across a Balkan trio.',
    summary: 'Croatia, Serbia, Slovenia.',
    status: 'PUBLISHED',
    sortOrder: 130,
    tags: ['regions', 'balkans', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in Croatia',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.CROATIA },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Serbia',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SERBIA },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in Slovenia',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SLOVENIA },
          },
        ],
      },
    ],
  },
  {
    key: 'regions.central-european-climb',
    title: 'Central European Climb',
    description: 'Win domestic titles across Central Europe.',
    summary: 'Austria, Switzerland, Czech Republic, Poland.',
    status: 'PUBLISHED',
    sortOrder: 140,
    tags: ['regions', 'central-europe', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in Austria',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.AUSTRIA },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Switzerland',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SWITZERLAND },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in the Czech Republic',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.CZECH_REPUBLIC },
          },
        ],
      },
      {
        position: 4,
        description: 'Win a title in Poland',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.POLAND },
          },
        ],
      },
    ],
  },
  {
    key: 'continents.south-america-big-3',
    title: 'South America Big 3',
    description: 'Win domestic titles in South America\'s heavyweight trio.',
    summary: 'Brazil, Argentina, Uruguay.',
    status: 'PUBLISHED',
    sortOrder: 150,
    tags: ['continents', 'south-america', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in Brazil',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.BRAZIL },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Argentina',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.ARGENTINA },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in Uruguay',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.URUGUAY },
          },
        ],
      },
    ],
  },
  {
    key: 'continents.africa-north-south',
    title: 'Africa North to South',
    description: 'Win domestic titles at both ends of the African continent.',
    summary: 'Egypt and South Africa.',
    status: 'PUBLISHED',
    sortOrder: 160,
    tags: ['continents', 'africa', 'journeyman'],
    goals: [
      {
        position: 1,
        description: 'Win a title in Egypt',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.EGYPT },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in South Africa',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: CHALLENGE_COUNTRY_CODES.SOUTH_AFRICA },
          },
        ],
      },
    ],
  },
];

export const CHALLENGE_CATALOG_BY_KEY = new Map(CHALLENGE_CATALOG.map((entry) => [entry.key, entry]));

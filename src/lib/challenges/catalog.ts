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
  {
    key: 'legends.forest-european-return',
    title: 'Forest, Back On Top',
    description: 'Win the UEFA Champions League with Nottingham Forest.',
    summary: 'Bring European glory back to the City Ground.',
    status: 'PUBLISHED',
    sortOrder: 170,
    tags: ['team-specific', 'legends', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Nottingham Forest',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'nottingham-forest' },
          },
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
    key: 'legends.arsenal-europe-missing-piece',
    title: 'The Missing Piece',
    description: 'Win the UEFA Champions League with Arsenal.',
    summary: 'Deliver the one major trophy missing in modern Arsenal history.',
    status: 'PUBLISHED',
    sortOrder: 180,
    tags: ['team-specific', 'legends', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Arsenal',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'arsenal' },
          },
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
    key: 'legends.atletico-european-crown',
    title: 'Final Step in Madrid',
    description: 'Win the UEFA Champions League with Atletico Madrid.',
    summary: 'Complete Atleti\'s European dream.',
    status: 'PUBLISHED',
    sortOrder: 190,
    tags: ['team-specific', 'legends', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Atletico Madrid',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'atletico-madrid' },
          },
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
    key: 'legends.roma-european-summit',
    title: 'Roman Summit',
    description: 'Win the UEFA Champions League with Roma.',
    summary: 'Take Roma to the top of Europe.',
    status: 'PUBLISHED',
    sortOrder: 200,
    tags: ['team-specific', 'legends', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Roma',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'roma' },
          },
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
    key: 'giants.benfica-modern-crown',
    title: 'Lisbon Renaissance',
    description: 'Win the UEFA Champions League with Benfica.',
    summary: 'Bring Europe\'s top prize back to Benfica in the modern era.',
    status: 'PUBLISHED',
    sortOrder: 210,
    tags: ['team-specific', 'giants', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Benfica',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'benfica' },
          },
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
    key: 'giants.ajax-modern-crown',
    title: 'Amsterdam Reawakened',
    description: 'Win the UEFA Champions League with Ajax.',
    summary: 'Restore Ajax to European supremacy.',
    status: 'PUBLISHED',
    sortOrder: 220,
    tags: ['team-specific', 'giants', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Ajax',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'ajax' },
          },
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
    key: 'giants.celtic-continental-return',
    title: 'Celtic Continental Return',
    description: 'Win the UEFA Champions League with Celtic.',
    summary: 'Bring a European crown back to Celtic Park.',
    status: 'PUBLISHED',
    sortOrder: 230,
    tags: ['team-specific', 'giants', 'europe'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Champions League with Celtic',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'celtic' },
          },
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
    key: 'underdogs.fulham-first-trophy',
    title: 'Fulham First Silver',
    description: 'Win a trophy with Fulham.',
    summary: 'Deliver a first major piece of silverware for the Cottagers.',
    status: 'PUBLISHED',
    sortOrder: 240,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Fulham',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'fulham' },
          },
        ],
      },
    ],
  },
  {
    key: 'underdogs.freiburg-first-trophy',
    title: 'Breisgau Breakthrough',
    description: 'Win a trophy with Freiburg.',
    summary: 'Write the first silver chapter in Freiburg history.',
    status: 'PUBLISHED',
    sortOrder: 250,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Freiburg',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'freiburg' },
          },
        ],
      },
    ],
  },
  {
    key: 'underdogs.brighton-first-trophy',
    title: 'Seagulls First Crown',
    description: 'Win a trophy with Brighton.',
    summary: 'Bring silverware to the Amex.',
    status: 'PUBLISHED',
    sortOrder: 260,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Brighton',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'brighton' },
          },
        ],
      },
    ],
  },
  {
    key: 'underdogs.union-berlin-first-trophy',
    title: 'Eisern Silver Day',
    description: 'Win a trophy with Union Berlin.',
    summary: 'Land Union Berlin\'s first modern-era silverware moment.',
    status: 'PUBLISHED',
    sortOrder: 270,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Union Berlin',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'union-berlin' },
          },
        ],
      },
    ],
  },
  {
    key: 'underdogs.watford-first-trophy',
    title: 'Hornets Historic Win',
    description: 'Win a trophy with Watford.',
    summary: 'Give Watford their breakthrough silverware moment.',
    status: 'PUBLISHED',
    sortOrder: 280,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with Watford',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'watford' },
          },
        ],
      },
    ],
  },
  {
    key: 'underdogs.new-york-red-bulls-first-trophy',
    title: 'Red Bulls, At Last',
    description: 'Win a trophy with New York Red Bulls.',
    summary: 'Secure long-awaited silverware for NY Red Bulls.',
    status: 'PUBLISHED',
    sortOrder: 290,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
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
    ],
  },
  {
    key: 'underdogs.cd-maldonado-first-trophy',
    title: 'Maldonado Milestone',
    description: 'Win a trophy with CD Maldonado.',
    summary: 'Capture the first silverware chapter for Deportivo Maldonado.',
    status: 'PUBLISHED',
    sortOrder: 300,
    tags: ['team-specific', 'underdogs', 'history'],
    goals: [
      {
        position: 1,
        description: 'Win a trophy with CD Maldonado',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'cd-maldonado' },
          },
        ],
      },
    ],
  },
  {
    key: 'cross-border.andorra-spanish-crown',
    title: 'Pyrenees To The Summit',
    description: 'Win LaLiga with FC Andorra.',
    summary: 'Take Andorra\'s project all the way to the Spanish top-flight crown.',
    status: 'PUBLISHED',
    sortOrder: 310,
    tags: ['team-specific', 'cross-border', 'domestic-league'],
    goals: [
      {
        position: 1,
        description: 'Win LaLiga with FC Andorra',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'fc-andorra' },
          },
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'spain.laliga' },
          },
        ],
      },
    ],
  },
  {
    key: 'cross-border.ceuta-spanish-crown',
    title: 'Across The Strait',
    description: 'Win LaLiga with AD Ceuta FC.',
    summary: 'Lead Ceuta from the North African coast to Spain\'s highest title.',
    status: 'PUBLISHED',
    sortOrder: 320,
    tags: ['team-specific', 'cross-border', 'domestic-league'],
    goals: [
      {
        position: 1,
        description: 'Win LaLiga with AD Ceuta FC',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'ad-ceuta' },
          },
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'spain.laliga' },
          },
        ],
      },
    ],
  },
  {
    key: 'cross-border.cardiff-english-crown',
    title: 'Dragon On The Throne',
    description: 'Win the Premier League with Cardiff City.',
    summary: 'Bring the English title across the Severn to Cardiff.',
    status: 'PUBLISHED',
    sortOrder: 330,
    tags: ['team-specific', 'cross-border', 'domestic-league'],
    goals: [
      {
        position: 1,
        description: 'Win the Premier League with Cardiff City',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'cardiff-city' },
          },
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'england.premier-league' },
          },
        ],
      },
    ],
  },
  {
    key: 'cross-border.swansea-english-crown',
    title: 'Swansea Sea Change',
    description: 'Win the Premier League with Swansea City.',
    summary: 'Turn Welsh momentum into an English top-flight crown.',
    status: 'PUBLISHED',
    sortOrder: 340,
    tags: ['team-specific', 'cross-border', 'domestic-league'],
    goals: [
      {
        position: 1,
        description: 'Win the Premier League with Swansea City',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'swansea-city' },
          },
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'england.premier-league' },
          },
        ],
      },
    ],
  },
  {
    key: 'cross-border.wrexham-english-crown',
    title: 'From Racecourse To Royalty',
    description: 'Win the Premier League with Wrexham.',
    summary: 'Complete the Hollywood dream with an English league title.',
    status: 'PUBLISHED',
    sortOrder: 350,
    tags: ['team-specific', 'cross-border', 'domestic-league'],
    goals: [
      {
        position: 1,
        description: 'Win the Premier League with Wrexham',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'wrexham' },
          },
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'england.premier-league' },
          },
        ],
      },
    ],
  },
  {
    key: 'cross-border.vaduz-swiss-crown',
    title: 'Liechtenstein Lightning Strike',
    description: 'Win the Swiss Super League with FC Vaduz.',
    summary: 'Break the ceiling and claim the Swiss title with Vaduz.',
    status: 'PUBLISHED',
    sortOrder: 360,
    tags: ['team-specific', 'cross-border', 'domestic-league'],
    goals: [
      {
        position: 1,
        description: 'Win the Swiss Super League with FC Vaduz',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamKey: 'vaduz' },
          },
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionKey: 'switzerland.super-league' },
          },
        ],
      },
    ],
  },
];

export const CHALLENGE_CATALOG_BY_KEY = new Map(CHALLENGE_CATALOG.map((entry) => [entry.key, entry]));

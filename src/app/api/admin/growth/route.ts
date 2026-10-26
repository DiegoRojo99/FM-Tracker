import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';
import { ok } from '@/lib/api/response';
import { Prisma } from '../../../../../prisma/generated/client';

const WINDOW_DAYS = 30;
const RETENTION_LAG_DAYS = 7;

type CountRow = { count: bigint };
type CohortRow = { cohort_size: bigint; retained: bigint };
type FeatureRow = { event: string; total_events: bigint; distinct_users: bigint };

function toNumber(value: bigint): number {
  return Number(value);
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10; // percentage, 1 decimal
}

// Growth & Engagement Roadmap, Phase 0: funnel + retention view computed
// entirely from the first-party AnalyticsEvent table, since Vercel's Hobby
// plan can't visualize custom events. See docs/roadmap/Growth-Engagement-Roadmap.md.
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const windowStart = Prisma.sql`now() - interval '${Prisma.raw(String(WINDOW_DAYS))} days'`;
    const retentionLag = Prisma.sql`interval '${Prisma.raw(String(RETENTION_LAG_DAYS))} days'`;

    const [landingVisitorsRows, funnelVisitorsRows, signupRows, activationRows, wauRows, mauRows, cohortRows, featureRows] = await Promise.all([
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(DISTINCT COALESCE("userId", "visitorId")) AS count
        FROM "AnalyticsEvent"
        WHERE event = 'page_view' AND payload ->> 'path' = '/' AND "createdAt" >= ${windowStart}
      `),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(DISTINCT COALESCE("userId", "visitorId")) AS count
        FROM "AnalyticsEvent"
        WHERE event = 'page_view' AND payload ->> 'path' IN ('/login', '/add-save') AND "createdAt" >= ${windowStart}
      `),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(DISTINCT "userId") AS count
        FROM "AnalyticsEvent"
        WHERE event = 'signup_completed' AND "createdAt" >= ${windowStart}
      `),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(*) AS count
        FROM (
          SELECT DISTINCT "userId" FROM "AnalyticsEvent"
          WHERE event = 'signup_completed' AND "createdAt" >= ${windowStart} AND "userId" IS NOT NULL
        ) signups
        WHERE EXISTS (
          SELECT 1 FROM "AnalyticsEvent" ae
          WHERE ae.event = 'save_created' AND ae."userId" = signups."userId"
        )
      `),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(DISTINCT "userId") AS count
        FROM "AnalyticsEvent"
        WHERE "userId" IS NOT NULL AND "createdAt" >= now() - interval '7 days'
      `),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(DISTINCT "userId") AS count
        FROM "AnalyticsEvent"
        WHERE "userId" IS NOT NULL AND "createdAt" >= ${windowStart}
      `),
      prisma.$queryRaw<CohortRow[]>(Prisma.sql`
        WITH cohort AS (
          SELECT "userId", "createdAt" AS signup_at
          FROM "AnalyticsEvent"
          WHERE event = 'signup_completed'
            AND "userId" IS NOT NULL
            AND "createdAt" <= now() - ${retentionLag}
            AND "createdAt" >= ${windowStart}
        )
        SELECT
          count(*) AS cohort_size,
          count(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM "AnalyticsEvent" ae
              WHERE ae."userId" = cohort."userId"
                AND ae.event != 'signup_completed'
                AND ae."createdAt" >= cohort.signup_at + ${retentionLag}
            )
          ) AS retained
        FROM cohort
      `),
      prisma.$queryRaw<FeatureRow[]>(Prisma.sql`
        SELECT event, count(*) AS total_events, count(DISTINCT "userId") AS distinct_users
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${windowStart} AND event != 'page_view'
        GROUP BY event
        ORDER BY total_events DESC
      `),
    ]);

    const landingVisitors = toNumber(landingVisitorsRows[0]?.count ?? BigInt(0));
    const funnelVisitors = toNumber(funnelVisitorsRows[0]?.count ?? BigInt(0));
    const signups = toNumber(signupRows[0]?.count ?? BigInt(0));
    const signupsWithFirstSave = toNumber(activationRows[0]?.count ?? BigInt(0));
    const wau = toNumber(wauRows[0]?.count ?? BigInt(0));
    const mau = toNumber(mauRows[0]?.count ?? BigInt(0));
    const cohortSize = toNumber(cohortRows[0]?.cohort_size ?? BigInt(0));
    const retained = toNumber(cohortRows[0]?.retained ?? BigInt(0));

    return ok({
      windowDays: WINDOW_DAYS,
      generatedAt: new Date().toISOString(),
      topOfFunnel: {
        landingVisitors,
        loginOrAddSaveVisitors: funnelVisitors,
        signups,
        landingToLoginRate: rate(funnelVisitors, landingVisitors),
        loginToSignupRate: rate(signups, funnelVisitors),
      },
      activation: {
        totalSignups: signups,
        signupsWithFirstSave,
        activationRate: rate(signupsWithFirstSave, signups),
      },
      retention: {
        wau,
        mau,
        d7EligibleCohortSize: cohortSize,
        d7RetainedCount: retained,
        d7RetentionRate: rate(retained, cohortSize),
      },
      perFeature: featureRows.map((row) => ({
        event: row.event,
        totalEvents: toNumber(row.total_events),
        distinctUsers: toNumber(row.distinct_users),
      })),
    });
  }, { requireAdmin: true });
}

// One-off, read-only script to compute the Growth & Engagement Roadmap
// Phase 0 "Diagnosis Success Metrics" baseline directly against the
// production AnalyticsEvent table. Mirrors the queries in
// src/app/api/admin/growth/route.ts. Safe: SELECT-only, no writes.
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import pkg from 'pg';

const { Pool } = pkg;

const WINDOW_DAYS = 30;
const RETENTION_LAG_DAYS = 7;

function loadProdUrl(): string {
  const root = process.cwd();
  const prodPath = resolve(root, '.env.production.local');
  const prodEnv = existsSync(prodPath) ? (config({ path: prodPath }).parsed ?? {}) : {};
  const url = process.env.PROD_DATABASE_URL ?? prodEnv.DATABASE_URL;
  if (!url) throw new Error('Missing PROD_DATABASE_URL / DATABASE_URL in .env.production.local');
  return url;
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

async function main() {
  const connectionString = loadProdUrl();
  const pool = new Pool({ connectionString, max: 1 });

  try {
    const windowStart = `now() - interval '${WINDOW_DAYS} days'`;
    const retentionLag = `interval '${RETENTION_LAG_DAYS} days'`;

    const [
      totalEvents,
      landingVisitors,
      funnelVisitors,
      signups,
      activation,
      wau,
      mau,
      cohort,
      perFeature,
      oldestEvent,
    ] = await Promise.all([
      pool.query(`SELECT count(*) AS count FROM "AnalyticsEvent"`),
      pool.query(`
        SELECT count(DISTINCT COALESCE("userId", "visitorId")) AS count
        FROM "AnalyticsEvent"
        WHERE event = 'page_view' AND payload ->> 'path' = '/' AND "createdAt" >= ${windowStart}
      `),
      pool.query(`
        SELECT count(DISTINCT COALESCE("userId", "visitorId")) AS count
        FROM "AnalyticsEvent"
        WHERE event = 'page_view' AND payload ->> 'path' IN ('/login', '/add-save') AND "createdAt" >= ${windowStart}
      `),
      pool.query(`
        SELECT count(DISTINCT "userId") AS count
        FROM "AnalyticsEvent"
        WHERE event = 'signup_completed' AND "createdAt" >= ${windowStart}
      `),
      pool.query(`
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
      pool.query(`
        SELECT count(DISTINCT "userId") AS count
        FROM "AnalyticsEvent"
        WHERE "userId" IS NOT NULL AND "createdAt" >= now() - interval '7 days'
      `),
      pool.query(`
        SELECT count(DISTINCT "userId") AS count
        FROM "AnalyticsEvent"
        WHERE "userId" IS NOT NULL AND "createdAt" >= ${windowStart}
      `),
      pool.query(`
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
      pool.query(`
        SELECT event, count(*) AS total_events, count(DISTINCT "userId") AS distinct_users
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${windowStart} AND event != 'page_view'
        GROUP BY event
        ORDER BY total_events DESC
      `),
      pool.query(`SELECT min("createdAt") AS oldest FROM "AnalyticsEvent"`),
    ]);

    const n = (v: unknown) => Number(v ?? 0);

    const landing = n(landingVisitors.rows[0]?.count);
    const funnel = n(funnelVisitors.rows[0]?.count);
    const signupCount = n(signups.rows[0]?.count);
    const activated = n(activation.rows[0]?.count);
    const cohortSize = n(cohort.rows[0]?.cohort_size);
    const retained = n(cohort.rows[0]?.retained);

    console.log('=== Growth & Engagement Phase 0 Baseline (production) ===');
    console.log('Data collected since:', oldestEvent.rows[0]?.oldest ?? 'n/a');
    console.log('Total AnalyticsEvent rows:', n(totalEvents.rows[0]?.count));
    console.log(`Window: last ${WINDOW_DAYS} days\n`);

    console.log('-- Top of funnel --');
    console.log('Landing (/) visitors:', landing);
    console.log('/login or /add-save visitors:', funnel);
    console.log('Signups:', signupCount);
    console.log('Landing -> login/add-save rate:', rate(funnel, landing), '%');
    console.log('login/add-save -> signup rate:', rate(signupCount, funnel), '%\n');

    console.log('-- Activation --');
    console.log('Signups with first save:', activated, '/', signupCount);
    console.log('Activation rate:', rate(activated, signupCount), '%\n');

    console.log('-- Retention --');
    console.log('WAU:', n(wau.rows[0]?.count));
    console.log('MAU:', n(mau.rows[0]?.count));
    console.log('D7-eligible cohort size:', cohortSize);
    console.log('D7 retained:', retained);
    console.log('D7 retention rate:', rate(retained, cohortSize), '%\n');

    console.log('-- Per-feature (last 30 days) --');
    for (const row of perFeature.rows) {
      console.log(`${row.event}: ${row.total_events} events, ${row.distinct_users} distinct users`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

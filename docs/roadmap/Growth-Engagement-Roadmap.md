# Growth & Engagement Roadmap

## Problem Statement

Signups are healthy but activity after signup is low: users create an account and then don't come back often enough. This roadmap prioritizes two things over everything else:

1. **Instrumentation first** — the only analytics in place today is Vercel's **Hobby-tier basic analytics** (anonymous, site-wide: ~127 visitors/month, 296 page views, 72% bounce rate) plus 3 ad-hoc client events in `src/lib/analytics/events.ts` (`login_success/failed`, `save_created/deleted`, `friend_request_sent`) that go through `@vercel/analytics`. On the Hobby plan, **custom events are not visualized at all** — Vercel's event breakdown/funnel UI is a Pro-plan feature, so those 3 events are currently being sent but are effectively invisible. We have zero visibility into logged-in behavior: no funnel, no retention cohorts, no way to see where a signed-up user drops off. We should not guess at which content features will move the needle — we should measure first, then build.
2. **Content depth** — once we can see the funnel, the biggest lever for "give users a reason to keep opening the app" is deepening what already exists (achievements, stats/insights, challenges, social feed) rather than inventing new product surfaces.

**What the page-level breakdown actually tells us (and doesn't):** The Vercel "Pages" view for the same period shows: `/` 56% of visitors (120), `/saves` 14% (30), `/trophies` 8% (17), `/add-save` 5% (11), `/login` 5% (10), `/challenges` 3% (7), `/achievements` 2% (5), plus a long tail of individual `/saves/<id>` detail pages at 1 visitor each. Two distinct problems are visible here, not one:

- **Landing-page conversion is weak.** 94% of visitors land on `/`, and only ~8% of all visitors ever reach `/login` (10) or `/add-save` (11). Most of the 72% bounce is plausibly happening right at `/`, before anyone even attempts to sign up or log in — this is a top-of-funnel problem, separate from "signed-up users don't return."
- **`/saves` (30 visitors) outnumbers `/login` (10 visitors).** Since the app uses persistent Firebase sessions, a returning authenticated user can land on `/saves` without ever hitting `/login` in the same window, and the long tail of distinct `/saves/<id>` pages (1 visitor each) looks like individual shared-save links being opened, not fresh signups browsing around. This means a meaningful share of the "activity" we can see is either existing users or link-shared traffic, not necessarily new signups activating.
- **This still doesn't tell us about habitual return.** Vercel's basic analytics is anonymous and page-level only — it can't tie page views to a specific user across sessions, so we still can't answer "do signed-up users come back in week 2" from this view alone. Phase 0 exists to answer that with first-party, per-user data.

Net: don't treat this purely as a post-signup retention problem. Phase 0's funnel should explicitly separate **landing → signup conversion** from **signup → habitual return**, since the page-level data suggests the first stage may be the bigger leak.

## How To Use

- Check items as they are completed.
- Phase 0 is a hard dependency for everything else — do not reprioritize Phases 2+ based on intuition once Phase 0 ships; reprioritize based on the data it produces.
- Every feature shipped from Phase 1 onward must emit at least one new analytics event (defined in Phase 0's event taxonomy) before it is considered done.

## Phase 0: Instrumentation & Diagnosis (Do This First)

Because the Hobby plan can't visualize custom events, this phase builds **first-party, self-hosted** tracking rather than depending on Vercel Analytics for anything beyond raw anonymous page views. The existing `@vercel/analytics` calls can stay (they're free and harmless) but should not be relied on to answer funnel/retention questions.

### 1) Event Taxonomy & First-Party Storage
- [ ] Define a versioned event taxonomy covering the full lifecycle: `signup_completed`, `onboarding_step_completed`, `save_created`, `season_logged`, `trophy_recorded`, `achievement_unlocked`, `challenge_started`, `challenge_completed`, `friend_request_sent/accepted`, `session_start`
  - Files: `src/lib/analytics/events.ts`
- [ ] Add a dedicated `AnalyticsEvent` Prisma table (`userId`, `event`, `payload` (Json), `createdAt`) — this is the only option that gives queryable funnels/cohorts given the Vercel Hobby constraint; it's also effectively free since it reuses the existing Postgres instance
  - Files: `prisma/schema.prisma`, new `src/lib/analytics/server.ts`
- [ ] Add a thin server-side tracking helper so API routes can log events directly to that table (not just client-side), since several key actions (season logged, achievement unlocked) happen server-side in `src/app/api/*`
- [ ] Keep the client-side `trackEvent()` helper, but have it write to the first-party table (via a lightweight `/api/analytics/track` endpoint) instead of/in addition to `@vercel/analytics`, so events are actually visible somewhere
- [ ] Respect existing opt-out/exclusion logic in `src/lib/analytics/controls.ts` for any new tracking path
- [ ] If budget allows later, evaluate a free-tier hosted alternative (e.g. PostHog's free tier) as a replacement for the hand-rolled dashboard below — but don't block on this; the Prisma-table approach is zero-cost and ships faster

### 2) Funnel & Retention Visibility
- [ ] Add an internal "Growth" view under `src/app/admin` showing two separate, chained funnels rather than one blended one:
  - **Top-of-funnel (anonymous):** landing page view → `/login` or `/add-save` view → `signup_completed` — track this even for anonymous visitors so it's comparable with the Vercel page-level numbers (`/` 120 visitors → `/login` 10 → `/add-save` 11 today)
  - **Post-signup (per-user):** `signup_completed` → first save → first season logged → first achievement/trophy → day-7 return
- [ ] Add weekly/monthly active user (WAU/MAU) and D1/D7/D30 retention cohort views, scoped only to the post-signup funnel
- [ ] Add per-feature engagement breakdown (saves, challenges, friends, achievements) to identify which existing feature already retains users best
- [ ] Tag traffic to individual `/saves/<id>` detail pages as "shared link views" vs. authenticated owner views, since the current page breakdown can't distinguish the two and it skews any read of `/saves` engagement
- [ ] Add a scheduled summary (weekly email or Slack/webhook) so drop-off trends are visible without manually opening the dashboard
- [ ] Keep using Vercel's basic analytics (visitors/page views/bounce rate) as a free, rough cross-check on the top-of-funnel numbers above, not as a source of post-signup behavior insight

### Diagnosis Success Metrics
- [ ] Baseline landing → signup conversion rate is documented (today's page-level proxy: only ~8% of visitors even reach `/login` or `/add-save`)
- [ ] Baseline activation rate (signup → first save created) is documented from first-party data
- [ ] Baseline D1/D7/D30 retention is documented from first-party data
- [ ] It's determined whether `/saves` traffic volume is driven mainly by returning authenticated users, shared-link viewers, or new signups, since today's numbers can't distinguish them
- [ ] The single biggest drop-off step — top-of-funnel (landing → signup) or post-signup (signup → habitual return) — is identified and written down before Phase 1 work is prioritized

## Phase 1: Content Depth — Achievements System Expansion

The schema already supports categories (`TROPHIES`, `PROMOTIONS`, `CHALLENGES`, `CAREER`, `SEASONS_CONSISTENCY`) and rarity tiers (`COMMON`/`RARE`/`EPIC`/`LEGENDARY`) via `AchievementDefinition`/`UserAchievement` — this is under-used today (see `docs/achievements-mvp-spec.md`).

- [ ] Expand the seed catalog (`scripts/data/seed-achievements.ts`) with a meaningfully larger set of achievements across all five categories, including some only reachable through sustained play (long saves, consistent seasons)
- [ ] Add in-app unlock notifications/toasts with rarity-based visual treatment
- [ ] Add a public-ish "showcase" of recently unlocked achievements on the profile (`src/app/profile`) that friends can see
- [ ] Add an achievement points leaderboard (global and friends-only) reusing the friends leaderboard pattern in `src/app/friends/components/FriendsLeaderboard.tsx`
- [ ] Add seasonal/limited-time achievements to give recurring reasons to check in

## Phase 2: Content Depth — Stats & Insights

Rich historical data already exists (`CareerStint`, `Season`, `LeagueResult`, `CupResult`, `Trophy`) but there's no dedicated insights surface to make it feel rewarding.

- [ ] Add a per-save career timeline view (clubs managed, promotions/relegations, trophies won, win-rate trend over seasons)
- [ ] Add an auto-generated "season recap" card after a season is logged (position, trophies, promotion/relegation, notable stats)
- [ ] Add simple friend-vs-friend stat comparisons (trophies, longest save, promotions) built on top of existing `/api/stats` and `/api/social` routes
- [ ] Add a personal records view (longest save, fastest promotion, biggest trophy haul in one season)

## Phase 3: Content Depth — Challenges Expansion

- [ ] Expand the challenge template catalog (`scripts/data/seed-challenges.ts`, `ChallengeDefinition`/`ChallengeGoal`/`ChallengeRule`) with more variety and difficulty tiers
- [ ] Add challenge progress indicators (on track / at risk / behind) surfaced on `src/app/challenges`
- [ ] Add a challenge leaderboard (fastest completion, most concurrent challenge runs) reusing `ChallengeRun`/`ChallengeRunGoal`
- [ ] Add a "challenge a friend" flow that creates a shared/comparable `ChallengeRun` pair

## Phase 4: Content Depth — Social Feed Expansion

A feed already exists under `src/app/api/social/feed` — deepen it rather than replacing it.

- [ ] Add more feed event types (achievement unlocked, trophy won, challenge completed, new save started)
- [ ] Add lightweight reactions on feed items
- [ ] Add a "suggested friends" module based on shared competitions/leagues or similar activity
- [ ] Add friend activity digest shown on login after an absence (informed by Phase 0 retention data)

## Phase 5: Re-Engagement Triggers

Only build this phase using the drop-off step identified in Phase 0 — do not build generic reminders speculatively.

- [ ] Add a "since you were away" summary screen for returning users (friend activity, unseen achievements, paused saves)
- [ ] Add opt-in email/notification nudges tied to the specific drop-off point found in Phase 0 (e.g. no save created in 48h, no season logged in 2 weeks)
- [ ] Add streak tracking for consistent season logging

### Re-Engagement Success Metrics
- [ ] Activation rate (signup → first save) improves versus the Phase 0 baseline
- [ ] D7/D30 retention improves versus the Phase 0 baseline
- [ ] At least one Phase 1–4 feature shows a measurable retention lift for the users who engaged with it vs. those who didn't

## Working Rule for Future Prioritization

- Don't ship a new engagement feature without a way to measure whether it worked (Phase 0 infra).
- Prefer deepening an existing feature (achievements, stats, challenges, social feed) over building a brand-new product surface — there is already unused structural depth in the data model to mine first.
- Re-run the Phase 0 funnel after each phase and use it to decide whether to continue, pivot, or stop a given content track.

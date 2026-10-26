# Mobile App (React Native) Roadmap

## Goal

Ship native iOS and Android apps with full feature parity to the web app, reusing the existing backend as-is: Next.js API routes (`src/app/api/*`) backed by Prisma/Postgres, with no separate mobile backend. This is viable today because:

- API routes already authenticate via a `Bearer <Firebase ID token>` header rather than web session cookies (`src/lib/auth/withAuth.ts` → `withAuth`/`withOptionalAuth`), which is exactly the pattern a native app needs — no cookie/session bridging required.
- Core domain data (saves, career stints, seasons, trophies, achievements, challenges, friends/social) is already exposed via REST endpoints under `src/app/api/*`.

## How To Use

- Check items as they are completed.
- "Full parity" phases are ordered to ship the highest-value flows first (saves/career tracking) and the most complex ones last (search/Algolia, admin).
- Each phase should end with the equivalent web flow still matching 1:1 in behavior, to avoid the two clients drifting apart.

## Phase 0: Architecture & Project Setup

- [ ] Decide and document: Expo (managed) vs bare React Native — recommend **Expo** for faster iteration, OTA updates, and simpler native module management given no existing native code to migrate
- [ ] Scaffold a new repo/package (e.g. `fm-tracker-mobile` or an `apps/mobile` workspace if moving to a monorepo) with Expo Router for file-based navigation, mirroring the web app's route structure (saves, challenges, trophies, achievements, friends, profile)
- [ ] Set up a shared TypeScript types package (or copy/sync) for DTOs already defined in `src/lib/dto` and `src/lib/types` so API response shapes stay in sync between web and mobile
- [ ] Define API base URL config per environment (dev/staging/prod) pointing at the existing Next.js deployment
- [ ] Set up CI (lint, typecheck, test) and EAS Build for iOS/Android

## Phase 1: Authentication

- [ ] Integrate Firebase Auth for React Native (Expo: `@react-native-firebase` or Firebase JS SDK with Expo's Auth session support) mirroring `src/app/components/AuthProvider.tsx` and `src/app/login/page.tsx`
- [ ] Implement sign-in (email/password and any provider supported on web — check `src/lib/db/firebase.ts` for configured providers) and sign-up flows
- [ ] Implement secure ID token storage/refresh and attach `Authorization: Bearer <token>` to all API calls, matching `withAuth`/`withOptionalAuth` expectations
- [ ] Implement session persistence (stay logged in across app restarts) and logout
- [ ] Reuse/port the `login_success` / `login_failed` analytics events from `src/lib/analytics/events.ts` (see the companion [Growth & Engagement Roadmap](/d:/Proyectos/git/fm-tracker/docs/roadmap/Growth-Engagement-Roadmap.md) for the broader event taxonomy this should plug into)

## Phase 2: Core Save & Career Tracking (Highest-Value Flow First)

- [ ] Saves list + save detail screens, calling `/api/saves` (list/create/update/delete), mirroring `src/app/saves` and `src/app/add-save`
- [ ] Career stint tracking (club/national team history) UI, mirroring the `CareerStint` flows
- [ ] Season logging flow (league position, promotion/relegation, cup results), mirroring `Season`/`LeagueResult`/`CupResult` creation flows
- [ ] Game/competition/team pickers, calling `/api/games`, `/api/competitions`, `/api/teams`, `/api/countries`
- [ ] Offline-tolerant UX: optimistic UI or clear pending/error states for season logging and save edits, since this is the most frequent action users take

## Phase 3: Trophies & Achievements

- [ ] Trophies view (grouped by country/competition), mirroring `src/app/trophies`
- [ ] Achievements view with progress, rarity, and unlock state, mirroring `src/app/achievements`
- [ ] Native push notification for achievement unlocks (requires push infra — see Phase 7)

## Phase 4: Challenges

- [ ] Challenge catalog browsing, mirroring `src/app/challenges`
- [ ] Start/track/complete a challenge run, calling the `ChallengeRun`/`ChallengeRunGoal` endpoints
- [ ] Challenge progress indicators matching the web experience

## Phase 5: Social & Friends

- [ ] Friends list, friend requests (send/accept/reject), mirroring `src/app/friends` and `/api/social`
- [ ] Friend search — evaluate whether to call the existing Algolia-backed search (`react-instantsearch`/`algoliasearch` deps) via a thin API passthrough, or hit `/api/users` search directly
- [ ] Friends leaderboard, mirroring `FriendsLeaderboard.tsx`
- [ ] Activity/social feed, mirroring `/api/social/feed`

## Phase 6: Profile & Account

- [ ] Profile view/edit (avatar, display name), mirroring `src/app/profile`
- [ ] Account settings (email, password reset, delete account, analytics opt-out — mirror `src/lib/analytics/controls.ts` opt-out behavior)

## Phase 7: Mobile-Specific Capabilities (Beyond Parity)

These aren't on the web app and are the main reason to justify a native app beyond "same thing on a phone":

- [ ] Push notifications (Firebase Cloud Messaging/Expo Notifications) for friend requests, achievement unlocks, and re-engagement nudges — directly reusable by the [Growth & Engagement Roadmap](/d:/Proyectos/git/fm-tracker/docs/roadmap/Growth-Engagement-Roadmap.md)'s Phase 5 re-engagement triggers
- [ ] Home screen widget / quick-log shortcut for logging a season result in one tap
- [ ] Biometric unlock for returning sessions

## Phase 8: Hardening & Release

- [ ] API compatibility review: confirm no existing route assumes a browser context (cookies, `Referer`, CORS-only access) that would block native requests; add/adjust CORS or headers only where actually needed for native fetch
- [ ] Error/retry handling and offline banners across all screens
- [ ] Accessibility pass (screen reader labels, dynamic type/font scaling)
- [ ] App Store / Play Store listing, privacy nutrition labels, and compliance review (data collected mirrors existing privacy posture of the web app)
- [ ] Beta rollout via TestFlight / Play internal testing, then phased production rollout

## Open Decisions To Confirm Before Phase 0 Starts

- [ ] Monorepo vs. separate repo for the mobile app
- [ ] Whether shared DTO/type definitions are published as a package or synced manually
- [ ] Minimum supported OS versions and device baseline
- [ ] Whether push notification infra is built now (Phase 7) or deferred to a later release

## Working Rule for Future Prioritization

- Ship in parity order (saves/career → trophies/achievements → challenges → social → profile) since that matches how central each feature is to the core loop on web.
- Any new web feature added while mobile is in development should be mirrored on mobile before the next mobile release, to avoid permanent drift.
- Mobile-only capabilities (Phase 7) should be sequenced after parity is reached, not before — parity establishes trust that the native app is a complete substitute for the web app.

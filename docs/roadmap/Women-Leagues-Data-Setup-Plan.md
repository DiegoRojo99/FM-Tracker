# Women Leagues Data Setup Plan

Status last updated: 2026-08-12

## Goal
Build a reliable women leagues and teams data pipeline for FM26 and FM27 without activating additional leagues, then simplify app logic to depend on explicit gender fields instead of runtime heuristics.

## Phase 0 - Scope Lock and Baseline
- [x] Confirm final scope: only currently active FM leagues are in-scope.
- [x] Export baseline counts from DB:
  - [x] Total teams
  - [x] Teams with `isFemale = true`
  - [x] Teams with `isFemale = false`
  - [x] Teams with `isFemale IS NULL`
- [x] Export baseline counts for competitions:
  - [x] Active `CompetitionGroup` count
  - [x] Existing `CompetitionGroupApiCompetition` links
- [x] Freeze a snapshot of active league IDs for this project cycle.

## Phase 1 - Schema Upgrade
- [x] Update Prisma schema:
  - [x] Add nullable `isFemale` to `ApiCompetition`.
  - [x] Add nullable `isFemale` to `CompetitionGroup`.
- [x] Add indexes for filtering:
  - [x] `CompetitionGroup.isFemale`
  - [x] `ApiCompetition.isFemale`
- [x] Generate and review migration SQL.
- [x] Validate migration on development database.
- [x] Regenerate Prisma client.

## Phase 2 - Seed Pipeline Refactor (No New Active Leagues)
- [x] Update league/competition seed flow:
  - [x] Read only active `CompetitionGroup` rows.
  - [x] Do not create or activate extra competition groups.
  - [x] Refresh mapped `ApiCompetition` metadata only.
- [x] Add two-season run support:
  - [x] FM26 base season import (2025/2026 window)
  - [x] FM27 base season import (2026/2027 window)
- [x] Ensure idempotency:
  - [x] Upsert `ApiCompetition`
  - [x] Upsert `Team`
  - [x] Insert `TeamSeason` with conflict handling
- [x] Add run summary output:
  - [x] Competitions processed
  - [x] Teams created/updated
  - [x] TeamSeason rows created
  - [x] Unknown gender rows remaining

## Phase 3 - Gender Attribution Rules
- [x] Define deterministic attribution order:
  - [x] Source flag from API if available
  - [x] Controlled name pattern fallback for competition
  - [x] Participation-based inference from `TeamSeason`
- [x] Implement `ApiCompetition.isFemale` assignment.
- [x] Implement `CompetitionGroup.isFemale` rollup from mapped competitions:
  - [x] `true` if all mapped are female
  - [x] `false` if all mapped are non-female
  - [x] `null` if mixed/unknown
- [x] Implement `Team.isFemale` assignment/backfill logic.

## Phase 4 - Data Alignment
- [x] Replace one-off backfill scripts with explicit mapping and sync flow.
- [x] Create missing `CompetitionGroup` rows from active `ApiCompetition` (`sync-groups-from-api`).
- [x] Create/fix missing `CompetitionGroupApiCompetition` links (`sync-group-links`).
- [x] Sync `ApiCompetition.isFemale` from active domestic group mappings (`sync-api-gender`).
- [x] Validate women-league mapping gap closure (FA WSL and other target women leagues linked).
- [x] Consolidate export/apply into one unified snapshot flow for prod parity.
- [x] Keep explicit `Team.isFemale` sync script based on mapped competitions (`teams:sync-gender`).
- [x] Run team gender sync from mapped competitions and capture current state:
  - [x] Teams scanned: 3979
  - [x] Teams updated: 14
  - [x] Teams unchanged: 3965
  - [x] Derived female/male/null: 126/2743/1110
  - [x] Conflicting signals: 0
- [x] Produce final unresolved audit lists after final seed run:
  - [x] Teams still null (current: 1060)
  - [x] Competition groups still null (current: 0)
  - [x] API competitions still null (current: 0)
  - [x] Latest execute run snapshot captured:
    - [x] Processed API competitions: 150
    - [x] Seasons processed/skipped unavailable/skipped seeded: 9/7/284
    - [x] Teams fetched/created/updated: 156/10/146
    - [x] TeamSeason rows inserted: 156
    - [x] Algolia competitions/teams upserted: 150/3989

## Phase 5 - Application Logic Cleanup
- [x] Replace runtime heuristic filtering with explicit `CompetitionGroup.isFemale` filtering.
- [x] Keep product rule:
  - [x] Women teams can select only women competitions.
  - [x] Men/unknown teams default to non-women competitions.
- [x] Remove broad team fallback behavior for league team lookup.
- [x] Add cache version bumps where required after logic swaps.

## Phase 6 - QA and Verification
- [ ] Save creation tests:
  - [x] FM26 women league save creation (FA WSL)
  - [ ] FM27 women league save creation
  - [ ] Men league save creation in same country
- [ ] Trophy flows:
  - [x] Add trophy with women team
  - [ ] Add trophy with men/unknown team
  - [ ] Edit trophy and switch teams
- [ ] Season flows:
  - [ ] Add cup results with women team
  - [ ] Add cup results with men team
- [ ] API checks:
  - [x] `/api/competitions` with `isFemale=true`
  - [ ] `/api/competitions` with `isFemale=false`
  - [ ] `/api/teams` for women league in FM26/FM27
- [ ] Compare post-run counts against baseline and capture delta.

## Phase 7 - Operational Runbook (During Paid API Month)
- [x] Consolidate operational docs into unified runbook (`docs/database/Competitions-Unified-Runbook.md`).
- [x] Replace multi-file competition export/apply with single unified export/apply commands.
- [x] Prod execution:
  - [x] Run Prisma deploy/generate on prod.
  - [x] Run unified apply dry-run on prod.
  - [x] Run unified apply on prod.
  - [x] Re-run unified apply dry-run to confirm idempotency.
- [x] Final post-prod snapshot/log capture.

## Completion Criteria
- [ ] Women leagues in active FM set can create saves with visible teams.
- [ ] Trophy competition dropdown behavior is consistent by gender rule.
- [ ] Unknown `Team.isFemale` population is reduced to an agreed threshold.
- [ ] App runtime no longer depends on name heuristics for final filtering.
- [ ] No additional leagues were activated as part of this project.

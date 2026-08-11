# Women Leagues Data Setup Plan

## Goal
Build a reliable women leagues and teams data pipeline for FM26 and FM27 without activating additional leagues, then simplify app logic to depend on explicit gender fields instead of runtime heuristics.

## Phase 0 - Scope Lock and Baseline
- [ ] Confirm final scope: only currently active FM leagues are in-scope.
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
- [ ] Update Prisma schema:
  - [ ] Add nullable `isFemale` to `ApiCompetition`.
  - [ ] Add nullable `isFemale` to `CompetitionGroup`.
- [ ] Add indexes for filtering:
  - [ ] `CompetitionGroup.isFemale`
  - [ ] `ApiCompetition.isFemale`
- [ ] Generate and review migration SQL.
- [ ] Validate migration on development database.
- [ ] Regenerate Prisma client.

## Phase 2 - Seed Pipeline Refactor (No New Active Leagues)
- [ ] Update league/competition seed flow:
  - [ ] Read only active `CompetitionGroup` rows.
  - [ ] Do not create or activate extra competition groups.
  - [ ] Refresh mapped `ApiCompetition` metadata only.
- [ ] Add two-season run support:
  - [ ] FM26 base season import (2025/2026 window)
  - [ ] FM27 base season import (2026/2027 window)
- [ ] Ensure idempotency:
  - [ ] Upsert `ApiCompetition`
  - [ ] Upsert `Team`
  - [ ] Insert `TeamSeason` with conflict handling
- [ ] Add run summary output:
  - [ ] Competitions processed
  - [ ] Teams created/updated
  - [ ] TeamSeason rows created
  - [ ] Unknown gender rows remaining

## Phase 3 - Gender Attribution Rules
- [ ] Define deterministic attribution order:
  - [ ] Source flag from API if available
  - [ ] Controlled name pattern fallback for competition
  - [ ] Participation-based inference from `TeamSeason`
- [ ] Implement `ApiCompetition.isFemale` assignment.
- [ ] Implement `CompetitionGroup.isFemale` rollup from mapped competitions:
  - [ ] `true` if all mapped are female
  - [ ] `false` if all mapped are non-female
  - [ ] `null` if mixed/unknown
- [ ] Implement `Team.isFemale` assignment/backfill logic.

## Phase 4 - Backfill Existing Data
- [ ] Backfill `ApiCompetition.isFemale` where null.
- [ ] Backfill `CompetitionGroup.isFemale` where null.
- [ ] Backfill `Team.isFemale` from women competition participation.
- [ ] Produce unresolved audit lists:
  - [ ] Teams still null
  - [ ] Competition groups still null
- [ ] Manual review pass for unresolved high-impact leagues (for example FA WSL).

## Phase 5 - Application Logic Cleanup
- [ ] Replace runtime heuristic filtering with explicit `CompetitionGroup.isFemale` filtering.
- [ ] Keep product rule:
  - [ ] Women teams can select only women competitions.
  - [ ] Men/unknown teams default to non-women competitions.
- [ ] Keep temporary fallback in team lookup only if mapping gaps remain.
- [ ] Add cache version bumps where required after logic swaps.

## Phase 6 - QA and Verification
- [ ] Save creation tests:
  - [ ] FM26 women league save creation (FA WSL)
  - [ ] FM27 women league save creation
  - [ ] Men league save creation in same country
- [ ] Trophy flows:
  - [ ] Add trophy with women team
  - [ ] Add trophy with men/unknown team
  - [ ] Edit trophy and switch teams
- [ ] Season flows:
  - [ ] Add cup results with women team
  - [ ] Add cup results with men team
- [ ] API checks:
  - [ ] `/api/competitions` with `isFemale=true`
  - [ ] `/api/competitions` with `isFemale=false`
  - [ ] `/api/teams` for women league in FM26/FM27
- [ ] Compare post-run counts against baseline and capture delta.

## Phase 7 - Operational Runbook (During Paid API Month)
- [ ] Dry run on subset of active leagues.
- [ ] Full run for FM26 and FM27 in controlled batches.
- [ ] Re-run idempotency check.
- [ ] Final full refresh near end of paid month.
- [ ] Export final snapshots and logs for future offline maintenance.

## Completion Criteria
- [ ] Women leagues in active FM set can create saves with visible teams.
- [ ] Trophy competition dropdown behavior is consistent by gender rule.
- [ ] Unknown `Team.isFemale` population is reduced to an agreed threshold.
- [ ] App runtime no longer depends on name heuristics for final filtering.
- [ ] No additional leagues were activated as part of this project.

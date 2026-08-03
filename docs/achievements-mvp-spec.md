# Achievements MVP Specification

Status: Draft for Review
Version: v0.1
Date: 2026-06-03

## 1. Scope

This document defines Step 1 only (specification). No implementation details, schema migrations, or API changes are included here.

MVP categories:
- Trophies
- Promotions
- Challenges
- Career
- Seasons/Consistency

MVP UX targets:
- New /achievements page
- Profile summary card

MVP evaluation mode:
- Evaluate on write events (season/trophy/challenge updates)
- Support user backfill endpoint later

MVP scoring:
- Achievement points enabled
- Rarity labels enabled

## 2. Data Contract for Each Achievement Definition

Each achievement definition must include these fields:
- key: stable unique string, never reused
- title: user-facing short name
- description: user-facing unlock description
- category: one of the MVP categories
- points: integer points value
- rarity: Common | Rare | Epic | Legendary
- triggerEvents: one or more events that should evaluate this rule
- unlockRule: deterministic condition
- progressRule: deterministic progress formula
- maxProgress: integer cap for progress UI
- example: concrete user scenario

## 3. Event Triggers (Evaluation Inputs)

Evaluator must run after these domain events:
- season.created
- trophy.added
- challenge.progress.updated

Evaluator input payload (minimum):
- userId
- saveId (optional for global rules)
- gameId (optional filter context)
- eventType
- eventTimestamp

## 4. Achievement Catalog (MVP)

## 4.1 Trophies

| Key | Title | Description | Points | Rarity | Trigger Events | Unlock Rule | Progress Rule | Max Progress | Example |
|---|---|---|---:|---|---|---|---|---:|---|
| trophies.first | First Silverware | Win your first trophy | 10 | Common | trophy.added, season.created | User total trophies >= 1 | min(totalTrophies, 1) | 1 | User wins a domestic cup once |
| trophies.ten | Trophy Collector | Win 10 trophies | 40 | Rare | trophy.added, season.created | User total trophies >= 10 | min(totalTrophies, 10) | 10 | User reaches 10 total trophies across saves |
| trophies.fifty | Hall of Fame Cabinet | Win 50 trophies | 120 | Legendary | trophy.added, season.created | User total trophies >= 50 | min(totalTrophies, 50) | 50 | Long-term profile with many saves and trophies |

## 4.2 Promotions

| Key | Title | Description | Points | Rarity | Trigger Events | Unlock Rule | Progress Rule | Max Progress | Example |
|---|---|---|---:|---|---|---|---|---:|---|
| promotions.first | On The Up | Achieve your first promotion | 15 | Common | season.created | User total promoted league results >= 1 | min(totalPromotions, 1) | 1 | Season saved with promoted=true |
| promotions.five | Promotion Specialist | Achieve 5 promotions | 60 | Rare | season.created | User total promotions >= 5 | min(totalPromotions, 5) | 5 | Multiple campaigns with successful promotions |
| promotions.ten | Lift-Off Legacy | Achieve 10 promotions | 140 | Epic | season.created | User total promotions >= 10 | min(totalPromotions, 10) | 10 | User consistently climbs leagues over time |

## 4.3 Challenges

| Key | Title | Description | Points | Rarity | Trigger Events | Unlock Rule | Progress Rule | Max Progress | Example |
|---|---|---|---:|---|---|---|---|---:|---|
| challenges.first_complete | Challenger | Complete your first challenge | 20 | Common | challenge.progress.updated, trophy.added, season.created | User completed career challenges >= 1 | min(completedChallenges, 1) | 1 | First challenge record gets completedAt |
| challenges.five_complete | Elite Challenger | Complete 5 challenges | 90 | Epic | challenge.progress.updated, trophy.added, season.created | User completed challenges >= 5 | min(completedChallenges, 5) | 5 | User has completed five distinct challenge runs |

## 4.4 Career

| Key | Title | Description | Points | Rarity | Trigger Events | Unlock Rule | Progress Rule | Max Progress | Example |
|---|---|---|---:|---|---|---|---|---:|---|
| career.first_save | Journey Begins | Create your first save | 10 | Common | season.created, trophy.added | User saves count >= 1 | min(activeSaves, 1) | 1 | First save has at least one persisted event |
| career.five_clubs | Wandering Boss | Manage 5 distinct clubs in career stints | 70 | Rare | season.created, challenge.progress.updated | Distinct club teamId count in career stints >= 5 | min(distinctClubsManaged, 5) | 5 | User manages 5 different clubs across saves |
| career.ten_clubs | Globe-Trotter Manager | Manage 10 distinct clubs | 150 | Legendary | season.created, challenge.progress.updated | Distinct clubs managed >= 10 | min(distinctClubsManaged, 10) | 10 | User reaches tenth unique managed club |

## 4.5 Seasons/Consistency

| Key | Title | Description | Points | Rarity | Trigger Events | Unlock Rule | Progress Rule | Max Progress | Example |
|---|---|---|---:|---|---|---|---|---:|---|
| seasons.first | One Season In | Complete your first season entry | 10 | Common | season.created | User total seasons >= 1 | min(totalSeasons, 1) | 1 | User adds first season record |
| seasons.ten | Decade Dugout | Complete 10 seasons | 80 | Rare | season.created | User total seasons >= 10 | min(totalSeasons, 10) | 10 | User logs ten seasons in aggregate |
| seasons.twenty_five | Dynasty Builder | Complete 25 seasons | 180 | Epic | season.created | User total seasons >= 25 | min(totalSeasons, 25) | 25 | Long-running profile with 25 seasons |

## 5. Rule Semantics

General rules:
- Rules are evaluated against user-global aggregates unless noted otherwise.
- Progress values are non-decreasing once persisted unless explicit full backfill recalculates.
- Unlock occurs when progress reaches maxProgress.
- unlockedAt is set once and never overwritten.

Aggregation definitions:
- totalTrophies: count of trophies where trophy.save.userId = userId
- totalPromotions: count of league results where promoted=true and season.save.userId = userId
- completedChallenges: count of career challenges where completedAt is not null and userId matches
- activeSaves: count of saves where save.userId = userId
- distinctClubsManaged: count of distinct careerStint.teamId joined through save.userId
- totalSeasons: count of seasons joined through save.userId

## 6. Idempotency, Conflict, and Backfill Rules

Idempotency:
- Unique unlock identity is (userId, achievementKey).
- Re-processing the same event must not create duplicate unlock rows.
- If already unlocked, only optional metadata refresh may occur; unlockedAt remains unchanged.

Conflict handling:
- Multiple achievements may unlock from a single event.
- Processing order is deterministic by achievement key ascending.
- Failure in one achievement evaluation should not roll back unrelated successful unlocks unless transaction policy explicitly requires all-or-nothing.

Backfill behavior:
- Backfill recomputes progress from source-of-truth tables.
- Backfill can unlock missed achievements but never remove unlocked achievements in MVP.
- Backfill sets unlockedAt to backfill execution time for previously missed unlocks (MVP default).

## 7. Mapping to Existing Data Sources

This catalog is intentionally based on currently available entities:
- Trophy and Save relations for trophy milestones
- LeagueResult.promoted for promotion milestones
- CareerChallenge.completedAt for challenge milestones
- CareerStint.teamId for distinct clubs managed
- Season records for season milestones

## 8. Open Decisions for Approval

1. Should challenge achievements count completed challenge runs or distinct challenge IDs only?
Current draft: completed runs.

2. For backfill, should unlockedAt use historical inferred date or backfill run time?
Current draft: backfill run time for simplicity.

3. Do we want one special high-prestige achievement in MVP (for example, 3 promotions in same save)?
Current draft: not included to keep rules simple and auditable.

4. Should rarity be static in definitions (current draft) or dynamically computed from global unlock rates?
Current draft: static rarity labels.

## 9. Step 1 Acceptance Checklist

- Every MVP achievement has explicit key, category, points, rarity, and deterministic unlock rule.
- Every rule maps to data already present in the current schema.
- Event triggers are defined for real-time evaluation.
- Idempotency and backfill behavior are explicitly documented.

# Competitions Unified Runbook

This runbook is the single flow to move competition data from dev to prod.

Scope covered by unified snapshot:
- CompetitionGroup table
- ApiCompetition table
- CompetitionGroupApiCompetition links

## 1) Dev: prepare competition data

1. Export one unified snapshot.
   npm run competitions:export-unified

Output file:
- scripts/data/competitions-unified-snapshot.json

## 2) Prod: run Prisma changes, then apply data snapshot

1. Deploy code that contains your Prisma migrations and scripts.
2. Run Prisma migrations on prod DB.
   npx prisma migrate deploy
3. Regenerate Prisma client on prod runtime/build environment.
   npx prisma generate
4. Copy scripts/data/competitions-unified-snapshot.json to prod workspace.
5. Preview data changes.
   npm run competitions:apply-unified:dry-run
6. Apply data changes.
   npm run competitions:apply-unified

## 3) Recommended verification after prod apply

1. Re-run dry run to confirm idempotency.
   npm run competitions:apply-unified:dry-run
2. Check API competitions in Admin UI:
   /admin/competitions/api
3. Check group settings in Admin UI:
   /admin/competitions/tiers

Note:
- If there are no new migration files, `npx prisma migrate deploy` will complete without applying changes.
- The unified apply command uses safe mode to preserve existing non-null ApiCompetition.isFemale values.

## Tiers

Tier values are fully handled in the unified flow:
- CompetitionGroup.tier is exported and applied.
- ApiCompetition.tier is exported and applied.

No separate tier export/seed/infer scripts are required.

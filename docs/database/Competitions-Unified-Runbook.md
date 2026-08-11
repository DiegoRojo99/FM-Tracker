# Competitions Unified Runbook

This runbook is the single flow to move competition data from dev to prod.

Scope covered by unified snapshot:
- CompetitionGroup table
- ApiCompetition table
- CompetitionGroupApiCompetition links

## 1) Dev: prepare competition data

1. Optional: normalize type values if you imported legacy type labels.
   npm run competitions:normalise-types

2. Optional: create any missing CompetitionGroup rows and links from active ApiCompetition rows.
   npm run competitions:sync-groups-from-api:dry-run
   npm run competitions:sync-groups-from-api

3. Optional: ensure women-marked groups have links, then roll isFemale to ApiCompetition.
   npm run competitions:sync-group-links:dry-run
   npm run competitions:sync-group-links
   npm run competitions:sync-api-gender:dry-run
   npm run competitions:sync-api-gender

4. Export one unified snapshot.
   npm run competitions:export-unified

Output file:
- scripts/data/competitions-unified-snapshot.json

## 2) Prod: apply exactly what was exported

1. Copy scripts/data/competitions-unified-snapshot.json to prod workspace.
2. Preview changes.
   npm run competitions:apply-unified:dry-run
3. Apply changes.
   npm run competitions:apply-unified

## 3) Recommended verification after prod apply

1. Re-run dry run to confirm idempotency.
   npm run competitions:apply-unified:dry-run
2. Check API competitions in Admin UI:
   /admin/competitions/api
3. Check group settings in Admin UI:
   /admin/competitions/tiers

## Tiers

Tier values are fully handled in the unified flow:
- CompetitionGroup.tier is exported and applied.
- ApiCompetition.tier is exported and applied.

No separate tier export/seed/infer scripts are required.

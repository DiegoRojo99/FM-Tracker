# Dev DB and Migration Testing Runbook

Date: 2026-08-03
Project: FM Tracker

This runbook defines how to safely:
1. Create a development database
2. Export data from production
3. Import/sanitize data for development
4. Test Prisma schema changes and migrations before production

## 1) Environment Topology

For a solo workflow, use 2 PostgreSQL environments:
- Production DB: live traffic only
- Dev DB: local development + migration testing

Rules:
- Never run migration experiments on production
- Never point local app to production by default
- Keep separate DATABASE_URL values for each environment

Recommended env files:
- .env.development.local (default for local app and Prisma commands)
- .env.production.local (only for intentional production operations)

## 2) Production Export Strategy

Create two backup artifacts on each migration cycle:
- Full backup (for disaster recovery)
- Sanitized/dev backup (for development and testing)

### 2.1 Full backup (lossless)

Use pg_dump custom format:

pg_dump "<PROD_DATABASE_URL>" --format=custom --verbose --file=backups/prod_YYYYMMDD_HHMM.dump

Optional globals (roles/privileges), if needed by infra:

pg_dumpall --globals-only --file=backups/prod_globals_YYYYMMDD.sql

### 2.2 Dev/sanitized backup

Approach A (recommended):
- Restore full backup into an isolated temporary DB
- Run anonymization SQL
- Dump sanitized DB as the artifact used by developers

Approach B:
- Export selected tables directly from production (only if strict data minimization is required)

## 3) Dev Import and Sanitization

### 3.0 Local Node.js alternative (no Railway migrator, no pg_dump tools)

Use this if Railway function-based migrator is unavailable.

Prerequisites:
- `.env.production.local` contains production `DATABASE_URL`
- `.env.development.local` contains development `DATABASE_URL`
- Both URLs must point to different databases

Commands:

1) Preview what will be copied:

`npm run db:copy:prod-to-dev:dry-run`

2) Execute copy + sanitization:

`npm run db:copy:prod-to-dev`

What it does:
- Reads production as source and development as target
- Truncates target public tables (except `_prisma_migrations`)
- Copies all rows table-by-table using FK-aware ordering
- Applies `scripts/data/sanitize-dev.sql` on target

Important:
- This replaces existing dev data.
- Do not run this command if dev URL points to production.

## 3.1 Restore into Dev DB

pg_restore --clean --if-exists --no-owner --no-privileges --dbname="<DEV_DATABASE_URL>" backups/prod_YYYYMMDD_HHMM.dump

## 3.2 Run anonymization SQL after restore

Minimum recommended anonymization:
- User emails
- User display names (optional)
- Any personal profile fields

Example patterns:
- email -> user_<uid>@example.test
- displayName -> User <short uid>

Keep this as a repeatable SQL script in scripts/data/sanitize-dev.sql.

## 4) Prisma Migration Testing Workflow

For each schema change:

1. Prepare change:
- Edit prisma/schema.prisma
- Validate model and relation integrity

2. Create migration in Dev DB:
- npx prisma migrate dev --name <descriptive_name>

3. Validate generated SQL:
- Review prisma/migrations/<timestamp_name>/migration.sql
- Ensure no unintended destructive operations

4. Apply migrations to a fresh test DB:
- Create an empty temporary DB
- Run npx prisma migrate deploy
- Confirm schema bootstraps from scratch cleanly

5. Apply migrations to cloned production-like DB:
- Restore latest sanitized production dump to temp DB
- Run npx prisma migrate deploy
- Execute smoke checks (counts, key API reads, integrity checks)

6. Regenerate Prisma client:
- npx prisma generate

7. App validation:
- Run lint/build and key API route checks

## 5) Migration Safety Gates (Required)

Before applying any migration to production:
- Backup created and verified
- DATABASE_URL double-checked by two-step confirmation
- migration.sql reviewed manually
- Destructive changes explicitly approved
- Rollback plan written (or forward-fix plan if rollback is not possible)

Never do in production:
- prisma migrate reset
- ad-hoc schema edits without migration history
- unreviewed SQL in migration files

## 6) Suggested Command Checklist Per Migration

- [ ] Create full prod backup
- [ ] Refresh sanitized dev dump
- [ ] Restore sanitized dump to temp test DB
- [ ] Run prisma migrate deploy on temp test DB
- [ ] Run smoke test queries and key route checks
- [ ] Review migration SQL with another reviewer
- [ ] Apply migration to a fresh temp DB and validate
- [ ] Apply migration to production
- [ ] Capture post-deploy verification notes

## 7) Practical Next Setup Tasks

- [ ] Create a dedicated Dev DB (Railway or local Docker Postgres)
- [ ] Add explicit env files for dev/prod URLs
- [ ] Add scripts/data/sanitize-dev.sql
- [ ] Add package scripts for backup/restore/smoke checks
- [ ] Add docs/db/migration-safety-checklist.md linked from README

## 8) Optional CI Hardening (Recommended)

Add a CI job that:
1. Spins up ephemeral Postgres
2. Runs npx prisma migrate deploy
3. Runs npx prisma generate
4. Runs a smoke query script against core tables

This catches broken migrations before merge/deploy.

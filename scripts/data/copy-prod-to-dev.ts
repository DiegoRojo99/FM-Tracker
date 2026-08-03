import { config } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pkg from 'pg';

const { Pool } = pkg;

interface CopyOptions {
  confirm: boolean;
  dryRun: boolean;
  skipSanitize: boolean;
}

function parseArgs(): CopyOptions {
  const args = process.argv.slice(2);
  return {
    confirm: args.includes('--confirm'),
    dryRun: args.includes('--dry-run'),
    skipSanitize: args.includes('--skip-sanitize'),
  };
}

function maskConnection(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.host || '<missing-host>';
    const db = parsed.pathname.replace(/^\//, '') || '<missing-db>';
    return `${parsed.protocol}//${parsed.username}:***@${host}/${db}`;
  } catch {
    return '<invalid-url>';
  }
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function loadConnectionStrings() {
  const root = process.cwd();
  const devPath = resolve(root, '.env.development.local');
  const prodPath = resolve(root, '.env.production.local');

  const devEnv = config({ path: devPath }).parsed ?? {};
  const prodEnv = config({ path: prodPath }).parsed ?? {};

  const sourceUrl = process.env.SOURCE_DATABASE_URL ?? process.env.PROD_DATABASE_URL ?? prodEnv.DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL ?? process.env.DEV_DATABASE_URL ?? devEnv.DATABASE_URL;

  if (!sourceUrl) throw new Error('Missing source database URL. Set SOURCE_DATABASE_URL or DATABASE_URL in .env.production.local.');
  if (!targetUrl) throw new Error('Missing target database URL. Set TARGET_DATABASE_URL or DATABASE_URL in .env.development.local.');

  const sourceParsed = new URL(sourceUrl);
  const targetParsed = new URL(targetUrl);

  const sameDb = sourceParsed.host === targetParsed.host && sourceParsed.pathname === targetParsed.pathname;
  if (sameDb) throw new Error('Source and target database point to the same host/database. Aborting for safety.');
  return { sourceUrl, targetUrl };
}

async function getTables(pool: InstanceType<typeof Pool>): Promise<string[]> {
  const result = await pool.query<{ tablename: string }>(
    `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '_prisma_migrations'
      ORDER BY tablename;
    `
  );

  return result.rows.map((row) => row.tablename);
}

function getCommonTables(sourceTables: string[], targetTables: string[]): {
  commonTables: string[];
  sourceOnly: string[];
  targetOnly: string[];
} {
  const sourceSet = new Set(sourceTables);
  const targetSet = new Set(targetTables);

  const commonTables = sourceTables.filter((table) => targetSet.has(table));
  const sourceOnly = sourceTables.filter((table) => !targetSet.has(table));
  const targetOnly = targetTables.filter((table) => !sourceSet.has(table));

  return { commonTables, sourceOnly, targetOnly };
}

async function getInsertionOrder(sourcePool: InstanceType<typeof Pool>, tables: string[]): Promise<string[]> {
  const fkResult = await sourcePool.query<{ child_table: string; parent_table: string }>(
    `
      SELECT
        tc.table_name AS child_table,
        ccu.table_name AS parent_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `
  );

  const tableSet = new Set(tables);
  const outgoing = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();

  for (const table of tables) {
    outgoing.set(table, new Set());
    indegree.set(table, 0);
  }

  for (const row of fkResult.rows) {
    if (!tableSet.has(row.child_table) || !tableSet.has(row.parent_table)) {
      continue;
    }

    if (row.child_table === row.parent_table) {
      continue;
    }

    const parentSet = outgoing.get(row.parent_table)!;
    if (!parentSet.has(row.child_table)) {
      parentSet.add(row.child_table);
      indegree.set(row.child_table, (indegree.get(row.child_table) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [table, degree] of indegree.entries()) {
    if (degree === 0) queue.push(table);
  }

  const ordered: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(current);

    for (const next of outgoing.get(current) ?? []) {
      const newDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, newDegree);
      if (newDegree === 0) queue.push(next);
    }
  }

  if (ordered.length !== tables.length) {
    const unresolved = tables.filter((table) => !ordered.includes(table));
    console.warn('Warning: dependency cycle detected. Appending unresolved tables at the end:', unresolved.join(', '));
    ordered.push(...unresolved);
  }

  return ordered;
}

async function truncateTarget(targetPool: InstanceType<typeof Pool>, tables: string[]) {
  if (tables.length === 0) return;
  const fullNames = tables.map((table) => `${quoteIdentifier('public')}.${quoteIdentifier(table)}`);
  const sql = `TRUNCATE TABLE ${fullNames.join(', ')} RESTART IDENTITY CASCADE;`;
  await targetPool.query(sql);
}

async function copyTableData(
  sourcePool: InstanceType<typeof Pool>,
  targetPool: InstanceType<typeof Pool>,
  table: string,
  batchSize = 500
): Promise<number> {
  const tableRef = `${quoteIdentifier('public')}.${quoteIdentifier(table)}`;
  const data = await sourcePool.query(`SELECT * FROM ${tableRef};`);
  const rows = data.rows;

  if (rows.length === 0) {
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((col) => quoteIdentifier(col)).join(', ');

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values: unknown[] = [];

    const placeholders = batch
      .map((row, rowIndex) => {
        const rowPlaceholders = columns.map((col, colIndex) => {
          values.push(row[col]);
          return `$${rowIndex * columns.length + colIndex + 1}`;
        });
        return `(${rowPlaceholders.join(', ')})`;
      })
      .join(', ');

    const insertSql = `INSERT INTO ${tableRef} (${quotedColumns}) VALUES ${placeholders};`;
    await targetPool.query(insertSql, values);
  }

  return rows.length;
}

async function run() {
  const options = parseArgs();
  const { sourceUrl, targetUrl } = loadConnectionStrings();

  console.log('Source:', maskConnection(sourceUrl));
  console.log('Target:', maskConnection(targetUrl));

  if (!options.confirm && !options.dryRun) {
    console.error('Refusing to run without confirmation. Use --confirm or --dry-run.');
    process.exit(1);
  }

  const sourcePool = new Pool({ connectionString: sourceUrl });
  const targetPool = new Pool({ connectionString: targetUrl });

  try {
    await sourcePool.query('SELECT 1');
    await targetPool.query('SELECT 1');

    const sourceTables = await getTables(sourcePool);
    const targetTables = await getTables(targetPool);
    const { commonTables, sourceOnly, targetOnly } = getCommonTables(sourceTables, targetTables);

    const insertionOrder = await getInsertionOrder(sourcePool, commonTables);

    console.log(`Found ${sourceTables.length} source tables.`);
    console.log(`Found ${targetTables.length} target tables.`);
    console.log(`Will copy ${commonTables.length} shared tables.`);

    if (sourceOnly.length > 0) {
      console.warn('Skipping source-only tables (not present in target):', sourceOnly.join(', '));
    }

    if (targetOnly.length > 0) {
      console.warn('Target has extra tables not in source:', targetOnly.join(', '));
    }

    console.log('Insertion order:', insertionOrder.join(', '));

    if (options.dryRun) {
      console.log('Dry run complete. No data was changed.');
      return;
    }

    await targetPool.query('BEGIN');
    await truncateTarget(targetPool, commonTables);

    let totalRows = 0;
    for (const table of insertionOrder) {
      const copied = await copyTableData(sourcePool, targetPool, table);
      totalRows += copied;
      console.log(`Copied ${copied} rows from ${table}`);
    }

    if (!options.skipSanitize) {
      const sanitizePath = resolve(process.cwd(), 'scripts/data/sanitize-dev.sql');
      if (existsSync(sanitizePath)) {
        const sanitizeSql = readFileSync(sanitizePath, 'utf8');
        await targetPool.query(sanitizeSql);
        console.log('Sanitize script applied.');
      } else {
        console.log('Sanitize script not found, skipping.');
      }
    }

    await targetPool.query('COMMIT');
    console.log(`Copy complete. Total rows copied: ${totalRows}`);
  } catch (error) {
    await targetPool.query('ROLLBACK').catch(() => undefined);
    console.error('Copy failed:', error);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

run().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});

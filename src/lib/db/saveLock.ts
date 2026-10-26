import { pool } from './prisma';

/*
 * Postgres session-level advisory lock keyed by saveId, used to serialize progress
 * recomputation (challenge run sync + achievement evaluation) for a single save.
 *
 * Without this, two concurrent requests touching the same save (e.g. two trophies added
 * in quick succession from different tabs, or a season create racing a manual trophy edit)
 * can both read the same "existing runs" snapshot and then both write, silently dropping one
 * of the two updates. The lock is acquired on a dedicated connection checked out from the
 * shared pool and is always released (or dropped automatically if the connection itself
 * fails), so a crashed request can never leave a save permanently locked.
 */

const LOCK_NAMESPACE = 'fm_tracker_save_progress';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withSaveProgressLock<T>(
  saveId: string,
  fn: () => Promise<T>,
  options?: { maxWaitMs?: number }
): Promise<T> {
  const maxWaitMs = options?.maxWaitMs ?? 10_000;
  const client = await pool.connect();
  let acquired = false;

  try {
    const start = Date.now();
    while (!acquired) {
      const result = await client.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_lock(hashtext($1), hashtext($2)) AS locked',
        [LOCK_NAMESPACE, saveId]
      );
      acquired = result.rows[0]?.locked === true;
      if (acquired) break;

      if (Date.now() - start > maxWaitMs) {
        console.warn(`Timed out waiting for progress lock on save ${saveId} after ${maxWaitMs}ms; proceeding without it.`);
        break;
      }
      await delay(100);
    }

    return await fn();
  } finally {
    if (acquired) {
      await client.query('SELECT pg_advisory_unlock(hashtext($1), hashtext($2))', [LOCK_NAMESPACE, saveId]).catch((error) => {
        console.error(`Failed to release progress lock for save ${saveId}:`, error);
      });
    }
    client.release();
  }
}

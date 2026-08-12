import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const globalWithEnvFlag = globalThis as typeof globalThis & {
  __fmTrackerNodeEnvLoaded?: boolean;
};

export function loadNodeEnv(cwd = process.cwd()): void {
  if (globalWithEnvFlag.__fmTrackerNodeEnvLoaded) return;

  const baseEnvPath = resolve(cwd, '.env');
  if (existsSync(baseEnvPath)) config({ path: baseEnvPath });
  else config();

  const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production.local'
    : '.env.development.local';

  const envPath = resolve(cwd, envFile);
  if (existsSync(envPath)) config({ path: envPath, override: true });

  globalWithEnvFlag.__fmTrackerNodeEnvLoaded = true;
}
import { config } from 'dotenv';
import { defineConfig } from "prisma/config";
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();

// Load base .env first so NODE_ENV declared there is available for env-file selection.
const baseEnvPath = resolve(cwd, '.env');
if (existsSync(baseEnvPath)) config({ path: baseEnvPath });
else config();

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production.local'
  : '.env.development.local';

// Then load the env-specific file and let it override base values.
const envPath = resolve(cwd, envFile);
if (existsSync(envPath)) config({ path: envPath, override: true });

export default defineConfig({
   schema: "prisma/schema.prisma",
   migrations: {
     path: "prisma/migrations"
   },
   datasource: {
      url: process.env.DATABASE_URL!,
   },
});
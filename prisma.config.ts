import { config } from 'dotenv';
import { defineConfig } from "prisma/config";
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const envFile = process.env.NODE_ENV === 'production'
   ? '.env.production.local'
   : '.env.development.local';

// Prefer explicit env files, fallback to .env if missing.
const envPath = resolve(cwd, envFile);
if (existsSync(envPath)) config({ path: envPath });
else config();

export default defineConfig({
   schema: "prisma/schema.prisma",
   migrations: {
     path: "prisma/migrations"
   },
   datasource: {
      url: process.env.DATABASE_URL!,
   },
});
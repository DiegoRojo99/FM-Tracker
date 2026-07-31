This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Analytics

Vercel Analytics is enabled in the root layout via `@vercel/analytics`.
When deployed on Vercel, page view and usage metrics will appear in the Vercel project Analytics tab.

## Redis Cache

Server-side Redis caching is enabled when `REDIS_URL` is configured.

- Add a Redis service in Railway (same region as Postgres is recommended).
- Copy the Redis connection string to your app environment as `REDIS_URL`.
- If `REDIS_URL` is missing, the app automatically falls back to database reads.

Currently cached API endpoints include:

- `GET /api/countries`
- `GET /api/games`
- `GET /api/competitions`
- `GET /api/teams?leagueId=...`
- `GET /api/stats`

Each cached response includes an `x-cache` header with one of:

- `hit` (served from Redis)
- `miss` (fetched from DB and stored in Redis)
- `disabled` (Redis unavailable or not configured)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

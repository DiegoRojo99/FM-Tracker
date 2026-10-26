import algoliasearch from 'algoliasearch';

// Server-only: must never be imported from a client component.
// ALGOLIA_WRITE_API_KEY is intentionally not prefixed with NEXT_PUBLIC_
// so Next.js never inlines it into a browser bundle.
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const writeKey = process.env.ALGOLIA_WRITE_API_KEY!;

export const algoliaWriteClient = algoliasearch(appId, writeKey);

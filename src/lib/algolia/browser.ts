import algoliasearch from 'algoliasearch';

// Safe for client bundles: app ID is not secret and this key is search-only.
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;

export const algoliaClient = algoliasearch(appId, searchKey);

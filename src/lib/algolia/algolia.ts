import algoliasearch from "algoliasearch";
import 'dotenv/config';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const writeKey = process.env.NEXT_PUBLIC_ALGOLIA_WRITE_API_KEY!;

export const algoliaClient = algoliasearch(appId, searchKey);
export const algoliaWriteClient = algoliasearch(appId, writeKey);
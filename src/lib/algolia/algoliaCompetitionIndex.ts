import { adminDB } from "../auth/firebase-admin";
import { Competition } from "../types/RetrieveDB";
import { algoliaWriteClient } from "./algolia";

const index = algoliaWriteClient.initIndex('competitions_index');

async function fetchCompetitions() {
  // 1. Get all countries with inFootballManager === true
  const countriesSnapshot = await adminDB.collection('countries').where('inFootballManager', '==', true).get();
  const competitions: Competition[] = [];

  // 2. For each country, get competitions from subcollection
  for (const countryDoc of countriesSnapshot.docs) {
    const countryId = countryDoc.id;
    const competitionsSnapshot = await adminDB.collection(`countries/${countryId}/competitions`).get();

    competitionsSnapshot.forEach(compDoc => {
      competitions.push({
        id: compDoc.id,
        countryId,
        ...compDoc.data(),
      });
    });
  }

  return competitions;
}

// 3. Fetch competitions and index them in Algolia
fetchCompetitions()
  .then((competitions) => {
    const records = competitions.map((comp) => ({
      ...comp,
      objectID: comp.id, // Required by Algolia
    }));

    return index.saveObjects(records);
  })
  .then(({ objectIDs }) => {
    console.log('✅ Competitions indexed:', objectIDs);
  })
  .catch(console.error);
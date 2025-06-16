import { adminDB } from "@/lib/auth/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

async function createTrophiesForFMCompetitions() {
  try {
    const countriesSnapshot = await adminDB.collection('countries')
      .where('inFootballManager', '==', true)
      .get();

    console.log(`Found ${countriesSnapshot.size} countries in FM.`);

    for (const countryDoc of countriesSnapshot.docs) {
      const countryId = countryDoc.id;
      const countryData = countryDoc.data();

      console.log(`Processing country: ${countryData.name} (${countryId})`);

      // Get competitions for this country
      const competitionsSnapshot = await adminDB
        .collection('countries')
        .doc(countryId)
        .collection('competitions')
        .get();

      console.log(`  Found ${competitionsSnapshot.size} competitions.`);

      for (const compDoc of competitionsSnapshot.docs) {
        const compId = compDoc.id;
        const compData = compDoc.data();

        const trophyData = {
          competitionId: compId,
          countryId,
          name: `${compData.name} Trophy`,
          createdAt: Timestamp.now(),
          // Add other trophy fields here as needed
        };

        // Add trophy doc (you can also use compId as doc id if you want unique)
        await adminDB.collection('trophies').add(trophyData);

        console.log(`    Created trophy for competition: ${compData.name}`);
      }
    }

    console.log('All trophies created successfully.');
  } catch (error) {
    console.error('Error creating trophies:', error);
  }
}

createTrophiesForFMCompetitions().catch(console.error);
import { adminDB } from "@/lib/auth/firebase-admin";

async function migrateCompetitions() {
  try {
    // 1. Get all countries with inFootballManager === true
    const countriesSnapshot = await adminDB.collection('countries')
      .where('inFootballManager', '==', true)
      .get();

    const fmCountryIds = countriesSnapshot.docs.map(doc => doc.id);
    console.log('Countries in FM:', fmCountryIds);

    if (fmCountryIds.length === 0) {
      console.log('No countries found with inFootballManager = true');
      return;
    }

    // 2. Get all competitions from top-level collection
    const competitionsSnapshot = await adminDB.collection('competitions').get();

    if (competitionsSnapshot.empty) {
      console.log('No competitions found in top-level collection');
      return;
    }

    // 3. Filter competitions by those whose country is in FM countries list
    const batch = adminDB.batch();

    let movedCount = 0;
    for (const compDoc of competitionsSnapshot.docs) {
      const compData = compDoc.data();

      // Assuming compData.countryId holds the ID of the country this competition belongs to
      const countryId = compData.countryCode;

      if (fmCountryIds.includes(countryId)) {
        // Reference for new competition document under the country subcollection
        const newCompRef = adminDB.collection('countries').doc(countryId).collection('competitions').doc(compDoc.id);

        // Move competition data
        batch.set(newCompRef, compData);

        // Delete original document
        batch.delete(compDoc.ref);

        movedCount++;
      }
    }

    if (movedCount > 0) {
      await batch.commit();
      console.log(`Moved ${movedCount} competitions to countries subcollections.`);
    } else {
      console.log('No competitions matched countries in FM, nothing moved.');
    }
  } catch (error) {
    console.error('Error migrating competitions:', error);
  }
}

migrateCompetitions();
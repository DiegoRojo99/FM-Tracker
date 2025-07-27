import { adminDB } from '@/lib/auth/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Save, SaveLeague } from '@/lib/types/Save';
import { fetchCompetition } from '@/lib/db/competitions';

async function normalizeSavesCurrentLeaguesFromCareer() {
  const usersSnap = await adminDB.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const savesSnap = await adminDB.collection('users').doc(userId).collection('saves').get();

    for (const saveDoc of savesSnap.docs) {
      const saveId = saveDoc.id;
      const saveRef = adminDB.collection('users').doc(userId).collection('saves').doc(saveId);

      const saveData = saveDoc.data() as Save;
      const countryCode = saveData.countryCode;
      if (!countryCode) {
        console.warn(`⚠️ Save ${saveId} for user ${userId} is missing countryCode`);
        continue;
      }

      const currentLeagueData = await fetchCompetition(countryCode, String(saveData.currentLeague?.id));
      if (!currentLeagueData) {
        console.warn(`⚠️ No league found for save ${saveId} in user ${userId}`);
        continue;
      }

      // Parse the current league data
      const currentLeague: SaveLeague = {
        id: currentLeagueData.id,
        name: currentLeagueData.name,
        logo: currentLeagueData.logo || '',
      };

      // Update the current league of the save
      await saveRef.update({
        currentLeague: currentLeague,
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Updated save ${saveId} for user ${userId}`);
    }
  }

  console.log('✅ All saves updated successfully.');
}

normalizeSavesCurrentLeaguesFromCareer().catch(console.error);

import { adminDB } from '@/lib/auth/firebase-admin';
import { Team } from '@/lib/types/firebase/Team';


async function normalizeCareerStints() {
  const usersSnap = await adminDB.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const savesSnap = await adminDB.collection('users').doc(userId).collection('saves').get();

    for (const saveDoc of savesSnap.docs) {
      const saveId = saveDoc.id;
      const careerRef = adminDB.collection('users').doc(userId).collection('saves').doc(saveId).collection('career');
      const careerSnap = await careerRef.get();

      for (const stintDoc of careerSnap.docs) {
        const stintData = stintDoc.data();
        const teamId = String(stintData.teamId);

        // Fetch global team data
        const teamSnap = await adminDB.collection('teams').doc(teamId).get();
        if (!teamSnap.exists) {
          console.warn(`Team ${teamId} not found`);
          continue;
        }

        const teamData = teamSnap.data() as Team;

        // Build normalized career stint
        const normalizedStint = {
          ...stintData,
          teamId: teamId,
          teamName: teamData.name,
          teamLogo: teamData.logo,
          leagueId: teamData.leagueId,
          isNational: teamData.national,
          countryCode: teamData.countryCode,
        };

        // Update the document with the normalized data
        await careerRef.doc(stintDoc.id).update(normalizedStint);
        console.log(`Updated stint ${stintDoc.id} in save ${saveId}`);
      }
    }
  }

  console.log('Normalization complete.');
}

normalizeCareerStints().catch(console.error);

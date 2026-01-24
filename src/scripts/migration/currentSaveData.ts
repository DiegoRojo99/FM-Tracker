import { adminDB } from '@/lib/auth/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { SaveTeam } from '@/lib/types/firebase/Save';

async function normalizeSavesFromCareer() {
  const usersSnap = await adminDB.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const savesSnap = await adminDB.collection('users').doc(userId).collection('saves').get();

    for (const saveDoc of savesSnap.docs) {
      const saveId = saveDoc.id;
      const saveRef = adminDB.collection('users').doc(userId).collection('saves').doc(saveId);
      const careerSnap = await saveRef.collection('career').get();

      if (careerSnap.empty) continue;

      // Separate career stints into national and club, then sort each by startDate
      const clubStints = careerSnap.docs
        .map(doc => doc.data())
        .filter(stint => !stint.isNational)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      const ntStints = careerSnap.docs
        .map(doc => doc.data())
        .filter(stint => stint.isNational)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      let currentClub: SaveTeam | null = null;
      let currentNT: SaveTeam | null = null;

      if (clubStints.length > 0) {
        const lastClub = clubStints[0];
        const teamSnap = await adminDB.collection('teams').doc(String(lastClub.teamId)).get();
        if (teamSnap.exists) {
          const teamData = teamSnap.data();
          currentClub = {
            id: lastClub.teamId,
            name: teamData?.name ?? 'Unknown',
            logo: teamData?.logo ?? '',
          };
        }
      }

      if (ntStints.length > 0) {
        const lastNT = ntStints[0];
        const teamSnap = await adminDB.collection('teams').doc(String(lastNT.teamId)).get();
        if (teamSnap.exists) {
          const teamData = teamSnap.data();
          currentNT = {
            id: lastNT.teamId,
            name: teamData?.name ?? 'Unknown',
            logo: teamData?.logo ?? '',
          };
        }
      }

      // Base countryCode and leagueId on last club if available, otherwise NT
      const baseStint = clubStints[0] ?? ntStints[0];
      if (!baseStint) continue;

      const updatedSave = {
        userId,
        countryCode: baseStint.countryCode,
        leagueId: Number(baseStint.leagueId),
        currentClub,
        currentNT,
        createdAt: saveDoc.data().createdAt ?? Timestamp.now(),
      };

      await saveRef.update(updatedSave);
      console.log(`✅ Updated save ${saveId} for user ${userId}`);
    }
  }

  console.log('✅ All saves updated successfully.');
}

normalizeSavesFromCareer().catch(console.error);

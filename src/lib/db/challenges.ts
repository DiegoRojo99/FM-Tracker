import { addDoc, collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { CareerChallenge, Challenge } from '../types/Challenge';
import { Trophy } from '../types/Trophy';
import { getCareerChallengeFromChallengeAndTrophies, getCareerChallengeFromChallengeAndTrophy, getChallengeWithoutStartingAt } from '../dto/challenges';
import { getTrophiesForSave } from './trophies';
import { Save } from '../types/Save';

export async function getAllChallenges() {
  const challengesCol = collection(db, 'challenges');
  const challengeSnapshot = await getDocs(challengesCol);
  return challengeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Challenge[];
}

export async function getChallengeById(challengeId: string) {
  const challengesCol = collection(db, 'challenges');
  const challengeSnapshot = await getDocs(challengesCol);
  const challengeDoc = challengeSnapshot.docs.find(doc => doc.id === challengeId);
  
  if (!challengeDoc) return null;
  
  return { id: challengeDoc.id, ...challengeDoc.data() } as Challenge;
}

export async function getUserChallenges(userId: string) {
  const savesCol = collection(db, 'users', userId, 'saves');
  const savesSnapshot = await getDocs(savesCol);
  const saves = savesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Save[];

  const userChallenges: CareerChallenge[] = [];
  for (const save of saves) {
    const challengesCol = collection(db, 'users', userId, 'saves', save.id, 'challenges');
    const challengeSnapshot = await getDocs(challengesCol);
    const challenges = challengeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CareerChallenge[];
    userChallenges.push(...challenges);
  }

  return userChallenges;
}

export async function getTeamMatchingChallenges(teamId: string) {
  const challenges = await getAllChallenges();
  return challenges.filter(challenge => {
    return challenge.goals.some(goal => goal.teamGroup?.includes(String(teamId)));
  });
}

export async function getCountryMatchingChallenges(countryId: string) {
  const challenges = await getAllChallenges();
  return challenges.filter(challenge => 
    challenge.goals.some(goal => 
      goal.countryId === countryId
    )
  );
}

export async function getCompetitionMatchingChallenges(competitionId: string) {
  const challenges = await getAllChallenges();
  return challenges.filter(challenge => 
    challenge.goals.some(goal => 
      goal.competitionId === competitionId
    )
  );
}

export async function getChallengesForSave(userId: string, saveId: string) {
  const challengesCol = collection(db, 'users', userId, 'saves', saveId, 'challenges');
  const challengeSnapshot = await getDocs(challengesCol);
  return challengeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Challenge[];
}

export async function addChallengeForSave(userId: string, saveId: string, challenge: CareerChallenge) {
  const challengesCol = collection(db, 'users', userId, 'saves', saveId, 'challenges');
  const res = await addDoc(challengesCol, challenge);
  return res.id;
}

export async function updateChallengeForSave(userId: string, saveId: string, challenge: CareerChallenge) {
  const challengesRef = collection(db, 'users', userId, 'saves', saveId, 'challenges');
  
  // Look for existing document with the same challenge.id
  const existingQuery = query(challengesRef, where('id', '==', challenge.id));
  const existingSnap = await getDocs(existingQuery);

  if (!existingSnap.empty) {
    // Update the first match
    const docRef = existingSnap.docs[0].ref;

    // Remove the startedAt field to avoid overwriting it
    const updatedChallenge = getChallengeWithoutStartingAt(challenge);
    await updateDoc(docRef, updatedChallenge);
  } 
  else {
    // Add new document with auto-generated ID
    await addDoc(challengesRef, challenge);
  }
  return challenge.id;
}

export async function checkForMatchingChallenges(trophyData: Trophy) {
  const [teamChallenges, countryChallenges, competitionChallenges] = await Promise.all([
    getTeamMatchingChallenges(trophyData.teamId),
    getCountryMatchingChallenges(trophyData.countryCode),
    getCompetitionMatchingChallenges(trophyData.competitionId),
  ]);

  return [...teamChallenges, ...countryChallenges, ...competitionChallenges]
}

/* Checks for matching challenges and adds them to the user's save */
export async function addChallengeForTrophy(
  uid: string,
  saveId: string,
  trophyData: Trophy
): Promise<void> {
  const matchingChallenges = await checkForMatchingChallenges(trophyData);
  const saveTrophies = await getTrophiesForSave(uid, saveId);
  if (!saveTrophies.includes(trophyData)) saveTrophies.push(trophyData);

  for (const challenge of matchingChallenges) {
    const updatedCareerChallenge = getCareerChallengeFromChallengeAndTrophies(challenge, saveTrophies);
    await updateChallengeForSave(uid, saveId, updatedCareerChallenge);
  }
}

export async function addChallengeForTeam(
  uid: string,
  saveId: string,
  teamId: string
): Promise<void> {
  const userChallenges = await getChallengesForSave(uid, saveId);
  const matchingChallenges = await getTeamMatchingChallenges(String(teamId));

  // Get the save to access its gameId
  const savesCol = collection(db, 'users', uid, 'saves');
  const saveSnap = await getDocs(query(savesCol, where('id', '==', saveId)));
  const save = saveSnap.docs[0]?.data() as Save | undefined;
  const gameId = save?.gameId || 'unknown';

  for (const challenge of matchingChallenges) {
    // Check if the challenge is already in the user's save
    const userHasChallenge = userChallenges.some(c => c.id === challenge.id);
    
    if (!userHasChallenge) {
      // Add the challenge to the user's save
      const careerChallenge = { ...getCareerChallengeFromChallengeAndTrophy(challenge, null), gameId };
      await addChallengeForSave(uid, saveId, careerChallenge);
    }
  }
}

export async function addChallengeForCountry(
  uid: string,
  saveId: string,
  countryCode: string
): Promise<void> {
  const userChallenges = await getChallengesForSave(uid, saveId);
  const matchingChallenges = await getCountryMatchingChallenges(String(countryCode));

  // Get the save to access its gameId
  const savesCol = collection(db, 'users', uid, 'saves');
  const saveSnap = await getDocs(query(savesCol, where('id', '==', saveId)));
  const save = saveSnap.docs[0]?.data() as Save | undefined;
  const gameId = save?.gameId || 'unknown';

  for (const challenge of matchingChallenges) {
    // Check if the challenge is already in the user's save
    const userHasChallenge = userChallenges.some(c => c.id === challenge.id);
    
    if (!userHasChallenge) {
      // Add the challenge to the user's save
      const careerChallenge = { ...getCareerChallengeFromChallengeAndTrophy(challenge, null), gameId };
      await addChallengeForSave(uid, saveId, careerChallenge);
    }
  }
}
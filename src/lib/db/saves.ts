import { doc, getDoc, getDocs, updateDoc, collection } from "firebase/firestore";
import { db } from '@/lib/db/firebase';
import { fetchCompetition } from "./competitions";
import { Competition } from "../types/Country&Competition";
import { Save, SaveLeague } from "../types/Save";
import { CareerStint } from "../types/Career";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Updates the 'season' attribute of a save document for a user in Firestore.
 * @param userId - The user's ID.
 * @param saveId - The save's ID.
 * @param season - The new season value.
 */
export async function updateSaveSeason(userId: string, saveId: string, season: string) {
  const saveRef = doc(db, `users/${userId}/saves/${saveId}`);
  await updateDoc(saveRef, { season, updatedAt: Timestamp.now() });
}

/**
 * Updates the 'season' attribute of a save document for a user in Firestore.
 * @param userId - The user's ID.
 * @param saveId - The save's ID.
 * @param currentLeagueId - The ID of the current league.
 * @param countryCode - The country code of the current league.
 */
export async function updateSaveCurrentLeague(
  userId: string, saveId: string, currentLeagueId: string, countryCode: string
): Promise<boolean> {
  const saveRef = doc(db, `users/${userId}/saves/${saveId}`);

  const currentLeague: Competition | null = await fetchCompetition(countryCode, currentLeagueId);
  if (!currentLeague) return false;

  const currentLeagueData: SaveLeague = {
    id: currentLeague.id,
    name: currentLeague.name,
    logo: currentLeague.logo,
  };

  await updateDoc(saveRef, { 
    currentLeague: currentLeagueData,
    updatedAt: Timestamp.now()
  });
  return true;
}

export async function getSaveById(userId: string, saveId: string) {
  const saveRef = doc(db, `users/${userId}/saves/${saveId}`);
  const saveSnapshot = await getDoc(saveRef);
  if (!saveSnapshot.exists()) return null;
  return { ...saveSnapshot.data(), id: saveSnapshot.id } as Save;
}

export async function getSaveWithCareer(userId: string, saveId: string) {
  const save = await getSaveById(userId, saveId);
  if (!save) return null;

  const careerRef = collection(db, `users/${userId}/saves/${saveId}/career`);
  const careerSnapshot = await getDocs(careerRef);
  const career = careerSnapshot.docs.map(doc => ({ ...doc.data() as CareerStint })) as CareerStint[];

  return { ...save, career };
}

export async function getUserSaves(userId: string) {
  const savesRef = collection(db, `users/${userId}/saves`);
  const savesSnapshot = await getDocs(savesRef);
  return savesSnapshot.docs.map(doc => ({ ...doc.data() as Save, id: doc.id })) as Save[];
}

export async function getUserSavesWithCareer(userId: string) {
  const saves = await getUserSaves(userId);
  const savesWithCareer = await Promise.all(saves.map(async save => await getSaveWithCareer(userId, save.id)));
  return savesWithCareer.filter(save => save !== null);
}
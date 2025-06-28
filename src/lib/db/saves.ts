import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { fetchCompetition } from "./competitions";
import { Competition } from "../types/Country&Competition";
import { SaveLeague } from "../types/Save";

/**
 * Updates the 'season' attribute of a save document for a user in Firestore.
 * @param userId - The user's ID.
 * @param saveId - The save's ID.
 * @param season - The new season value.
 */
export async function updateSaveSeason(userId: string, saveId: string, season: string) {
  const saveRef = doc(db, `users/${userId}/saves/${saveId}`);
  await updateDoc(saveRef, { season });
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
    currentLeague: currentLeagueData
  });
  return true;
}
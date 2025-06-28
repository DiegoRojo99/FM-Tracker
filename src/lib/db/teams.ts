import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Team } from "../types/Team";

export async function fetchTeam(teamId: string) {
  const db = getFirestore();
  const teamRef = doc(db, `teams/${teamId}`);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    return null;
  }

  const teamData = teamSnap.data() as Team;
  return teamData;
}
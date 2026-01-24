import { db } from "@/lib/db/firebase";
import { Team } from "@/lib/types/firebase/Team";
import { doc, getDoc } from "firebase/firestore";

export async function GetTeamData(teamId: string) {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  const team = teamSnap.exists() ? { ...teamSnap.data() as Team } : null;
  return team;
}
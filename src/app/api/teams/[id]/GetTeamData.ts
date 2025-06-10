import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GetTeamData(teamId: string) {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  const team = teamSnap.exists() ? { id: teamSnap.id, ...teamSnap.data() } : null;
  return team;
}
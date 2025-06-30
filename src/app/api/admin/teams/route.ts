import { getUserSavesWithCareer } from "@/lib/db/saves";
import { getAllUsers } from "@/lib/db/users";

export async function GET() {
  const users = await getAllUsers();
  const userSaves = await Promise.all(users.map(user => getUserSavesWithCareer(user.uid)));
  const saves = userSaves.flat();
  const teams = saves.filter(save => save !== null && save.career.length > 0).flatMap(save => save.career.map(stint => ({ id: stint.teamId, name: stint.teamName, logo: stint.teamLogo })));
  return new Response(JSON.stringify(teams), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
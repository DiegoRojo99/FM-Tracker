import { getUserSaves } from "@/lib/db/saves";
import { getAllUsers } from "@/lib/db/users";

export async function GET() {
  const users = await getAllUsers();
  const saves = await Promise.all(users.map(user => getUserSaves(user.uid)));
  return new Response(JSON.stringify(saves), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
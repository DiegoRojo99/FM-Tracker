import { getAllUsers } from "@/lib/db/users";

export async function GET() {
  const users = await getAllUsers();
  return new Response(JSON.stringify(users), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
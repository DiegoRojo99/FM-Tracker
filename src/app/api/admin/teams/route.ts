import { getAllTeamsInSaves } from "@/lib/db/saves";

export async function GET() {
  const uniqueTeams = await getAllTeamsInSaves();
  return new Response(JSON.stringify(uniqueTeams), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
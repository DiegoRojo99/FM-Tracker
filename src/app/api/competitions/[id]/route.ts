import { fetchCompetition } from "@/lib/db/competitions";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competitionId = Number(id);

  const competition = await fetchCompetition(competitionId);

  if (!competition) {
    return new Response('Competition not found', { status: 404 });
  }

  return new Response(JSON.stringify(competition), { status: 200 });
}

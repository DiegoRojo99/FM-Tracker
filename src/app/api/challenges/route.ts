import { getAllChallenges } from '@/lib/db/challenges';

export async function GET() {
  const allChallenges = await getAllChallenges();
  return new Response(JSON.stringify(allChallenges), { status: 200 });
}
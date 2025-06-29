import { NextRequest } from 'next/server';
import { getAllChallenges } from '@/lib/db/challenges';

export async function GET(req: NextRequest) {
  const allChallenges = await getAllChallenges();
  return new Response(JSON.stringify(allChallenges), { status: 200 });
}
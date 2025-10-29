import { NextRequest, NextResponse } from 'next/server';
import { getChallengeById } from '@/lib/db/challenges';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const challengeId = params.id;
  try {
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    return NextResponse.json(challenge);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

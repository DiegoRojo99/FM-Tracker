import { NextRequest, NextResponse } from 'next/server';
import { getChallengeById } from '@/lib/db/challenges';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: challengeId } = await params;
  try {
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    return NextResponse.json(challenge);
  } 
  catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

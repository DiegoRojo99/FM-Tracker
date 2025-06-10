import { NextRequest, NextResponse } from 'next/server';
import { GetLeagueData } from '../GetLeagueData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'League ID is required' }, { status: 400 });

  const league = await GetLeagueData(id);
  if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
  return NextResponse.json(league);
}
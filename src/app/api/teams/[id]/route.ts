import { NextRequest, NextResponse } from 'next/server';
import { GetTeamData } from './GetTeamData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  }

  const team = await GetTeamData(id);

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  return NextResponse.json(team);
}
import { NextRequest, NextResponse } from 'next/server';
import { GetTeamData } from './GetTeamData';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db/firebase';

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  }

  const data = await req.json();
  if (!data || !data.coordinates) {
    return NextResponse.json({ error: 'Coordinates are required' }, { status: 400 });
  }

  const team = await GetTeamData(id);
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Update the team coordinates
  const teamRef = doc(db, 'teams', id);
  updateDoc(teamRef, {
    coordinates: data.coordinates
  });

  return NextResponse.json({ id, ...data }, { status: 200 });
}
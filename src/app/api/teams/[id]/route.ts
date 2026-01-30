import { NextRequest, NextResponse } from 'next/server';
import { getTeamData } from './GetTeamData';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });

  const team = await getTeamData(parseInt(id));
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
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

  let {lat, lng} = data.coordinates;
  lat = Number(lat);
  lng = Number(lng);
  if (isNaN(lat) || isNaN(lng)) return NextResponse.json({ error: 'Coordinates have invalid format'}, { status: 400 });
  

  const team = await getTeamData(parseInt(id));
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  // Update the team coordinates
  const updateCoordsResponse = await prisma.team.update({
    where: {
      id: parseInt(id)
    },
    data: { lat, lng }
  })

  return NextResponse.json(updateCoordsResponse, { status: 200 });
}
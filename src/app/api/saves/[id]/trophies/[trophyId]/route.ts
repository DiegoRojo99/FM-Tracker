import { withAuth } from '@/lib/auth/withAuth';
import { updateTrophy, deleteTrophy } from '@/lib/db/trophies';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const trophyId = pathParts[5];

    if (!uid || !saveId || !trophyId) {
      return NextResponse.json({ error: 'Unauthorized or missing IDs' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate at least one field is provided
    if (!body.teamId && !body.season && !body.countryCode && !body.competitionId) {
      return NextResponse.json({ error: 'At least one field must be provided for update' }, { status: 400 });
    }

    const success = await updateTrophy(Number(trophyId), body);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update trophy' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Trophy updated successfully' }, { status: 200 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const trophyId = pathParts[5];

    if (!uid || !saveId || !trophyId) {
      return NextResponse.json({ error: 'Unauthorized or missing IDs' }, { status: 401 });
    }

    const success = await deleteTrophy(Number(trophyId));

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete trophy' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Trophy deleted successfully' }, { status: 200 });
  });
}

import { getTeamsByIds } from '@/lib/db/teams';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
  }

  const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'No valid ids provided' }, { status: 400 });
  }

  const teams = await getTeamsByIds(ids);
  return NextResponse.json({ teams });
}
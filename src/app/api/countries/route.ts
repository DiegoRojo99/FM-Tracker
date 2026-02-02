import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const countries = await prisma.country.findMany({});
  return NextResponse.json(countries, { status: 200 });
}

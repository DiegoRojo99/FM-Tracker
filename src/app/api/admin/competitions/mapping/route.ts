import { adminDB } from '@/lib/auth/firebase-admin';
import { NextRequest } from 'next/server';

type AdminCompetition = {
  id: string;
  isGrouped: boolean;
  groupName?: string;
  [key: string]: any;
};

export async function GET(req: NextRequest) {
  try {
    const snapshot = await adminDB.collection('adminCompetitions').get();
    const competitions: AdminCompetition[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AdminCompetition));

    // Create a mapping of group names to their member competition IDs
    const groupMapping = competitions
      .filter((comp: AdminCompetition) => comp.isGrouped && comp.groupName)
      .reduce((acc: Record<string, string[]>, comp: AdminCompetition) => {
        if (!acc[comp.groupName!]) {
          acc[comp.groupName!] = [];
        }
        acc[comp.groupName!].push(comp.id);
        return acc;
      }, {} as Record<string, string[]>);

    return new Response(JSON.stringify({ competitions, groupMapping }), { status: 200 });
  } catch (error) {
    console.error('Error fetching admin competitions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch competitions' }), { 
      status: 500 
    });
  }
}
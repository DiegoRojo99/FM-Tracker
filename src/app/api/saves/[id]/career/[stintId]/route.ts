import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { db } from '@/lib/db/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

interface CareerStintUpdateData {
  teamId: string;
  teamName: string;
  teamLogo: string;
  countryCode: string;
  leagueId: string;
  startDate: string;
  endDate: string | null;
  isNational: boolean;
}

export async function PUT(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const careerStintId = pathParts[5];

    if (!uid || !saveId || !careerStintId) {
      return NextResponse.json({ error: 'Unauthorized or missing IDs' }, { status: 401 });
    }

    try {
      const body = await req.json();
      
      // Validate required fields
      const { 
        teamId, 
        teamName, 
        teamLogo, 
        countryCode, 
        leagueId, 
        startDate, 
        endDate, 
        isNational 
      } = body;

      if (!teamId || !teamName || !countryCode || !leagueId || !startDate) {
        return NextResponse.json(
          { error: 'Missing required fields: teamId, teamName, countryCode, leagueId, startDate' }, 
          { status: 400 }
        );
      }

      // Check if career stint exists
      const careerStintRef = doc(db, 'users', uid, 'saves', saveId, 'career', careerStintId);
      const careerStintSnap = await getDoc(careerStintRef);
      
      if (!careerStintSnap.exists()) {
        return NextResponse.json({ error: 'Career stint not found' }, { status: 404 });
      }

      // Prepare update data
      const updateData: CareerStintUpdateData = {
        teamId: teamId.toString(),
        teamName,
        teamLogo: teamLogo || '',
        countryCode,
        leagueId: leagueId.toString(),
        startDate,
        endDate: endDate || null,
        isNational: Boolean(isNational),
      };

      // Update the career stint
      await updateDoc(careerStintRef, updateData as Partial<CareerStintUpdateData>);

      // Return the updated career stint
      const updatedSnap = await getDoc(careerStintRef);
      const updatedCareerStint = { id: updatedSnap.id, ...updatedSnap.data() };

      return NextResponse.json(updatedCareerStint, { status: 200 });
    } catch (error) {
      console.error('Error updating career stint:', error);
      return NextResponse.json({ error: 'Failed to update career stint' }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saveId = pathParts[3];
    const careerStintId = pathParts[5];

    if (!uid || !saveId || !careerStintId) {
      return NextResponse.json({ error: 'Unauthorized or missing IDs' }, { status: 401 });
    }

    try {
      // Check if career stint exists
      const careerStintRef = doc(db, 'users', uid, 'saves', saveId, 'career', careerStintId);
      const careerStintSnap = await getDoc(careerStintRef);
      
      if (!careerStintSnap.exists()) {
        return NextResponse.json({ error: 'Career stint not found' }, { status: 404 });
      }

      // Delete the career stint
      await deleteDoc(careerStintRef);

      return NextResponse.json({ message: 'Career stint deleted successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting career stint:', error);
      return NextResponse.json({ error: 'Failed to delete career stint' }, { status: 500 });
    }
  });
}
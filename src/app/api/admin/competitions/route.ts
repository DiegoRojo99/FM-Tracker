import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '../../../../lib/auth/firebase-admin';
import { AdminCompetition } from '@/lib/types/AdminCompetition';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const grouped = searchParams.get('grouped');
    const visible = searchParams.get('visible');
    
    let query: FirebaseFirestore.Query = adminDB.collection('adminCompetitions');
    
    // Apply filters
    if (country) {
      query = query.where('countryCode', '==', country);
    }
    if (grouped !== null) {
      query = query.where('isGrouped', '==', grouped);
    }
    if (visible !== null) {
      query = query.where('isVisible', '==', visible === 'true');
    }
    
    // Get all documents (we'll sort in memory for now)
    const snapshot = await query.get();
    const competitions: AdminCompetition[] = snapshot.docs.map((doc: FirebaseFirestore.DocumentSnapshot) => ({
      ...doc.data() as AdminCompetition
    }));
    
    // Sort in memory to avoid needing indexes
    competitions.sort((a: AdminCompetition, b: AdminCompetition) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ competitions });
  } catch (error) {
    console.error('Error fetching admin competitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Expected array of updates' },
        { status: 400 }
      );
    }
    
    // Batch update
    const batch = adminDB.batch();
    
    for (const update of updates) {
      if (!update.id) continue;
      
      const ref = adminDB.collection('adminCompetitions').doc(update.id);
      const updateData = { ...update };
      delete updateData.id;
      
      batch.update(ref, {
        ...updateData,
        lastUpdated: new Date(),
        updatedBy: 'admin'
      });
    }
    
    await batch.commit();
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updates.length} competitions` 
    });
  } catch (error) {
    console.error('Error updating admin competitions:', error);
    return NextResponse.json(
      { error: 'Failed to update competitions' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { addPromotionRelegationFields, setupExampleSpanishLinks } from '@/scripts/migration/addPromotionRelegationLinks';

export async function POST() {
  try {
    console.log('🚀 Starting simple promotion/relegation enhancement...');
    
    // Add the basic fields
    await addPromotionRelegationFields();
    
    // Setup example Spanish links
    await setupExampleSpanishLinks();
    
    return NextResponse.json({ 
      success: true, 
      message: 'AdminCompetitions enhanced with simple promotion/relegation links successfully' 
    });
    
  } catch (error) {
    console.error('Error running enhancement:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to enhance adminCompetitions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
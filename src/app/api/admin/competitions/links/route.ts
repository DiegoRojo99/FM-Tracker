import { adminDB } from '@/lib/auth/firebase-admin';
import { AdminCompetition, AdminCompetitionWithId } from '@/lib/types/AdminCompetition';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    const countryCode = searchParams.get('countryCode');
    
    if (competitionId) {
      // Get promotion/relegation targets for a specific competition
      return await getCompetitionTargets(competitionId);
    }
    
    if (countryCode) {
      // Get all promotion/relegation links for a country
      return await getCountryPromotionMap(countryCode);
    }
    
    // Get all promotion/relegation links
    return await getAllPromotionLinks();
    
  } catch (error) {
    console.error('Error in promotion links API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get promotion/relegation targets for a specific competition
async function getCompetitionTargets(competitionId: string) {
  const doc = await adminDB.collection('adminCompetitions').doc(competitionId).get();
  
  if (!doc.exists) {
    return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
  }
  
  const competition = { id: doc.id, ...doc.data() as AdminCompetition } as AdminCompetitionWithId;
  
  // Get promotion target details
  let promotionTarget = null;
  if (competition.promotionTargetId) {
    const promoDoc = await adminDB.collection('adminCompetitions').doc(competition.promotionTargetId).get();
    if (promoDoc.exists) {
      promotionTarget = { id: promoDoc.id, ...promoDoc.data() as AdminCompetition } as AdminCompetitionWithId;
    }
  }
  
  // Get relegation target details
  let relegationTarget = null;
  if (competition.relegationTargetId) {
    const releDoc = await adminDB.collection('adminCompetitions').doc(competition.relegationTargetId).get();
    if (releDoc.exists) {
      relegationTarget = { id: releDoc.id, ...releDoc.data() as AdminCompetition } as AdminCompetitionWithId;
    }
  }
  
  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.displayName || competition.name,
      countryCode: competition.countryCode,
      priority: competition.priority
    },
    promotionTarget: promotionTarget ? {
      id: promotionTarget.id,
      name: promotionTarget.displayName || promotionTarget.name,
      priority: promotionTarget.priority
    } : null,
    relegationTarget: relegationTarget ? {
      id: relegationTarget.id,
      name: relegationTarget.displayName || relegationTarget.name,
      priority: relegationTarget.priority
    } : null
  });
}

type PromotionEntry = {
  competition: {
    id: string;
    name: string;
    priority: number;
  };
  promotesTo: string | null;
  promotesToName?: string;
  relegatesTo: string | null;
  relegatesToName?: string;
}

// Get all promotion/relegation links for a country
async function getCountryPromotionMap(countryCode: string) {
  const competitions = await adminDB.collection('adminCompetitions')
    .where('countryCode', '==', countryCode)
    .where('type', '==', 'League')
    .where('isVisible', '==', true)
    .get();
  
  const comps = competitions.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as AdminCompetitionWithId[];
  
  // Build promotion map
  const promotionMap: Record<string, PromotionEntry> = {};
  
  for (const comp of comps) {
    promotionMap[comp.id] = {
      competition: {
        id: comp.id,
        name: comp.displayName || comp.name,
        priority: comp.priority
      },
      promotesTo: comp.promotionTargetId || null,
      relegatesTo: comp.relegationTargetId || null
    };
  }
  
  // Add target names
  for (const compId of Object.keys(promotionMap)) {
    const entry = promotionMap[compId];
    
    if (entry.promotesTo) {
      const target = comps.find(c => c.id === entry.promotesTo);
      entry.promotesToName = target ? (target.displayName || target.name) : 'Unknown';
    }
    
    if (entry.relegatesTo) {
      const target = comps.find(c => c.id === entry.relegatesTo);
      entry.relegatesToName = target ? (target.displayName || target.name) : 'Unknown';
    }
  }
  
  return NextResponse.json({
    countryCode,
    competitions: Object.values(promotionMap).sort((a: PromotionEntry, b: PromotionEntry) => b.competition.priority - a.competition.priority)
  });
}

interface PromotionRelegationLink {
  id: string;
  name: string;
  countryCode: string;
  priority: number;
  promotionTargetId: string | null;
  relegationTargetId: string | null;
}
// Get all promotion/relegation links (summary)
async function getAllPromotionLinks() {
  const competitions = await adminDB.collection('adminCompetitions')
    .where('type', '==', 'League')
    .where('isVisible', '==', true)
    .get();

  const links: PromotionRelegationLink[] = [];
  
  for (const doc of competitions.docs) {
    const comp = doc.data();
    
    if (comp.promotionTargetId || comp.relegationTargetId) {
      links.push({
        id: doc.id,
        name: comp.displayName || comp.name,
        countryCode: comp.countryCode,
        priority: comp.priority,
        promotionTargetId: comp.promotionTargetId || null,
        relegationTargetId: comp.relegationTargetId || null
      });
    }
  }
  
  return NextResponse.json({
    totalLinks: links.length,
    links: links.sort((a, b) => {
      if (a.countryCode !== b.countryCode) {
        return a.countryCode.localeCompare(b.countryCode);
      }
      return b.priority - a.priority;
    })
  });
}
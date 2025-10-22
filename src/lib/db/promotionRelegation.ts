import { adminDB } from '../auth/firebase-admin';

/**
 * Simple utilities for handling promotion/relegation logic
 */

export type PromotionRelegationLink = {
  competitionId: string;
  competitionName: string;
  promotionTargetId?: string;
  promotionTargetName?: string;
  relegationTargetId?: string;
  relegationTargetName?: string;
  priority: number;
};

/**
 * Get promotion target for a competition
 */
export async function getPromotionTarget(competitionId: string): Promise<string | null> {
  try {
    const doc = await adminDB.collection('adminCompetitions').doc(competitionId).get();
    if (!doc.exists) return null;
    
    const data = doc.data();
    return data?.promotionTargetId || null;
  } catch (error) {
    console.error('Error getting promotion target:', error);
    return null;
  }
}

/**
 * Get relegation target for a competition
 */
export async function getRelegationTarget(competitionId: string): Promise<string | null> {
  try {
    const doc = await adminDB.collection('adminCompetitions').doc(competitionId).get();
    if (!doc.exists) return null;
    
    const data = doc.data();
    return data?.relegationTargetId || null;
  } catch (error) {
    console.error('Error getting relegation target:', error);
    return null;
  }
}

/**
 * Check if a competition has promotion available
 */
export async function hasPromotionAvailable(competitionId: string): Promise<boolean> {
  const promotionTarget = await getPromotionTarget(competitionId);
  return promotionTarget !== null;
}

/**
 * Check if a competition has relegation risk
 */
export async function hasRelegationRisk(competitionId: string): Promise<boolean> {
  const relegationTarget = await getRelegationTarget(competitionId);
  return relegationTarget !== null;
}

/**
 * Get complete promotion/relegation info for a competition
 */
export async function getCompetitionPromotionInfo(competitionId: string): Promise<PromotionRelegationLink | null> {
  try {
    const doc = await adminDB.collection('adminCompetitions').doc(competitionId).get();
    if (!doc.exists) return null;
    
    const comp = doc.data();
    const result: PromotionRelegationLink = {
      competitionId,
      competitionName: comp?.displayName || comp?.name || 'Unknown',
      priority: comp?.priority || 0
    };
    
    // Get promotion target details
    if (comp?.promotionTargetId) {
      const promoDoc = await adminDB.collection('adminCompetitions').doc(comp.promotionTargetId).get();
      if (promoDoc.exists) {
        const promoData = promoDoc.data();
        result.promotionTargetId = comp.promotionTargetId;
        result.promotionTargetName = promoData?.displayName || promoData?.name || 'Unknown';
      }
    }
    
    // Get relegation target details
    if (comp?.relegationTargetId) {
      const releDoc = await adminDB.collection('adminCompetitions').doc(comp.relegationTargetId).get();
      if (releDoc.exists) {
        const releData = releDoc.data();
        result.relegationTargetId = comp.relegationTargetId;
        result.relegationTargetName = releData?.displayName || releData?.name || 'Unknown';
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting competition promotion info:', error);
    return null;
  }
}

/**
 * Get all competitions that promote to a specific competition
 */
export async function getCompetitionsThatPromoteTo(targetCompetitionId: string): Promise<string[]> {
  try {
    const snapshot = await adminDB.collection('adminCompetitions')
      .where('promotionTargetId', '==', targetCompetitionId)
      .get();
    
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting competitions that promote to target:', error);
    return [];
  }
}

/**
 * Get all competitions that relegate to a specific competition
 */
export async function getCompetitionsThatRelegateTo(targetCompetitionId: string): Promise<string[]> {
  try {
    const snapshot = await adminDB.collection('adminCompetitions')
      .where('relegationTargetId', '==', targetCompetitionId)
      .get();
    
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting competitions that relegate to target:', error);
    return [];
  }
}

/**
 * Validate if a save's league change is a valid promotion/relegation
 */
export async function isValidLeagueChange(fromCompetitionId: string, toCompetitionId: string): Promise<{
  isValid: boolean;
  type?: 'promotion' | 'relegation' | 'lateral';
  reason?: string;
}> {
  try {
    const fromInfo = await getCompetitionPromotionInfo(fromCompetitionId);
    if (!fromInfo) {
      return { isValid: false, reason: 'Source competition not found' };
    }
    
    // Check if it's a promotion
    if (fromInfo.promotionTargetId === toCompetitionId) {
      return { isValid: true, type: 'promotion' };
    }
    
    // Check if it's a relegation
    if (fromInfo.relegationTargetId === toCompetitionId) {
      return { isValid: true, type: 'relegation' };
    }
    
    // Check if it's the same competition (renewal)
    if (fromCompetitionId === toCompetitionId) {
      return { isValid: true, type: 'lateral', reason: 'Same competition' };
    }
    
    return { 
      isValid: false, 
      reason: 'No direct promotion/relegation link exists between these competitions' 
    };
  } catch (error) {
    console.error('Error validating league change:', error);
    return { isValid: false, reason: 'Error validating change' };
  }
}

/**
 * Get league hierarchy for a country (sorted by priority)
 */
export async function getCountryLeagueHierarchy(countryCode: string): Promise<PromotionRelegationLink[]> {
  try {
    const snapshot = await adminDB.collection('adminCompetitions')
      .where('countryCode', '==', countryCode)
      .where('type', '==', 'League')
      .where('isVisible', '==', true)
      .get();
    
    const competitions = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const info = await getCompetitionPromotionInfo(doc.id);
        return info;
      })
    );
    
    return competitions
      .filter((comp): comp is PromotionRelegationLink => comp !== null)
      .sort((a, b) => b.priority - a.priority);
      
  } catch (error) {
    console.error('Error getting country league hierarchy:', error);
    return [];
  }
}
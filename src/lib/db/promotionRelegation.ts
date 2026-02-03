import { CompetitionGroup } from "../types/prisma/Competitions";
import { prisma } from "./prisma"; 

/**
 * Get promotion target for a competition
 */
export async function getPromotionTarget(competitionId: number): Promise<CompetitionGroup | null> {
  try {
    const record = await prisma.promotionRelegation.findFirst({
      where: { 
        type: 'promotion',
        fromGroupId: competitionId
       },
       include: { toGroup: true }
    });

    if (!record) return null;
    return record.toGroup;
  } 
  catch (error) {
    console.error('Error getting promotion target:', error);
    return null;
  }
}

/**
 * Get relegation target for a competition
 */
export async function getRelegationTarget(competitionId: number): Promise<CompetitionGroup | null> {
  try {
    const record = await prisma.promotionRelegation.findFirst({
      where: { 
        type: 'relegation',
        fromGroupId: competitionId
       },
       include: { toGroup: true }
    });
    if (!record) return null;
    return record.toGroup;
  } 
  catch (error) {
    console.error('Error getting relegation target:', error);
    return null;
  }
}

/**
 * Check if a competition has promotion available
 */
export async function hasPromotionAvailable(competitionId: number): Promise<boolean> {
  const promotionTarget = await getPromotionTarget(competitionId);
  return promotionTarget !== null;
}

/**
 * Check if a competition has relegation risk
 */
export async function hasRelegationRisk(competitionId: number): Promise<boolean> {
  const relegationTarget = await getRelegationTarget(competitionId);
  return relegationTarget !== null;
}

/**
 * Validate if a save's league change is a valid promotion/relegation
 */
export async function isValidLeagueChange(fromCompetitionId: number, toCompetitionId: number): Promise<{
  isValid: boolean;
  type?: 'promotion' | 'relegation' | 'lateral';
  reason?: string;
}> {
  try {
    const promotionTarget = await getPromotionTarget(fromCompetitionId);
    if (promotionTarget && promotionTarget.id === toCompetitionId) {
      return { isValid: true, type: 'promotion' };
    }

    const relegationTarget = await getRelegationTarget(fromCompetitionId);
    if (relegationTarget && relegationTarget.id === toCompetitionId) {
      return { isValid: true, type: 'relegation' };
    }
    
    return { 
      isValid: false, 
      reason: 'No direct promotion/relegation link exists between these competitions' 
    };
  } 
  catch (error) {
    console.error('Error validating league change:', error);
    return { isValid: false, reason: 'Error validating change' };
  }
}
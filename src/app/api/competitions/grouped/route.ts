import { adminDB } from '@/lib/auth/firebase-admin';
import { Competition, Country, CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { AdminCompetition, AdminCompetitionWithId } from '@/lib/types/AdminCompetition';
import { NextRequest } from 'next/server';

type TrophyCompetition = {
  id: string | number;
  name: string;
  logo: string;
  type: string;
  season: string | number;
  countryCode: string;
  countryName: string;
  inFootballManager: boolean;
  isGroup?: boolean; 
  groupMembers?: string[];
  priority?: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const compType = searchParams.get('type');

  // Get all visible AdminCompetitions
  let adminCompsQuery = adminDB.collection('adminCompetitions')
    .where('isVisible', '==', true);

  if (country) {
    adminCompsQuery = adminCompsQuery.where('countryCode', '==', country);
  }

  const adminCompsSnap = await adminCompsQuery.get();
  const adminCompetitions = adminCompsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as AdminCompetition
  })) as AdminCompetitionWithId[];

  // Filter by type if specified
  let filteredComps = adminCompetitions;
  if (compType) {
    const normalizedType = compType.charAt(0).toUpperCase() + compType.slice(1).toLowerCase();
    filteredComps = adminCompetitions.filter(comp => comp.type === normalizedType);
  }

  // Group competitions by country and handle grouping
  const competitionsByCountry = filteredComps.reduce((acc, comp) => {
    if (!acc[comp.countryCode]) {
      acc[comp.countryCode] = [];
    }

    if (comp.isGrouped && comp.groupName) {
      // Find existing group or create new one
      const existingGroup = acc[comp.countryCode].find(
        c => c.isGroup && c.name === comp.groupName
      );
      
      if (!existingGroup) {
        // Create group entry
        acc[comp.countryCode].push({
          id: comp.groupName.replace(/\s+/g, '_').toLowerCase(),
          name: comp.groupName,
          logo: comp.logoUrl || '',
          type: comp.type || 'League',
          season: '2025/26', // Default season
          countryCode: comp.countryCode,
          countryName: comp.countryName,
          inFootballManager: true,
          isGroup: true,
          groupMembers: [comp.id],
          priority: comp.priority
        } as TrophyCompetition);
      } else {
        // Add to existing group
        existingGroup.groupMembers?.push(comp.id);
      }
    } else {
      // Individual competition
      acc[comp.countryCode].push({
        id: comp.id,
        name: comp.displayName,
        logo: comp.logoUrl || '',
        type: comp.type || 'League',
        season: '2025/26', // Default season
        countryCode: comp.countryCode,
        countryName: comp.countryName,
        inFootballManager: true,
        isGroup: false,
        priority: comp.priority
      } as TrophyCompetition);
    }

    return acc;
  }, {} as Record<string, TrophyCompetition[]>);

  // Get countries info and build final response
  const countryCodesSet = new Set(Object.keys(competitionsByCountry));
  const countriesSnap = await adminDB.collection('countries')
    .where('inFootballManager', '==', true)
    .get();

  const countries: CountryWithCompetitions[] = countriesSnap.docs
    .map(doc => doc.data() as Country)
    .filter(country => countryCodesSet.has(country.code))
    .map(country => ({
      ...country,
      competitions: (competitionsByCountry[country.code] || [])
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .map(comp => ({
          id: typeof comp.id === 'string' ? parseInt(comp.id) || 0 : comp.id,
          name: comp.name,
          logo: comp.logo,
          type: comp.type,
          season: typeof comp.season === 'string' ? parseInt(comp.season.split('/')[0]) || 2025 : comp.season,
          countryCode: comp.countryCode,
          countryName: comp.countryName,
          inFootballManager: comp.inFootballManager
        } as Competition))
    }));

  return new Response(JSON.stringify(countries), { status: 200 });
}
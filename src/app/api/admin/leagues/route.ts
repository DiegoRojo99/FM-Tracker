import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/db/firebase';
import { Team } from '@/lib/types/Team';
import { Competition, Country } from '@/lib/types/Country&Competition';

export async function GET(req: NextRequest) {
  try {
    // Fetch countries where inFootballManager is true
    const countriesSnap = await getDocs(
      query(collection(db, 'countries'), where('inFootballManager', '==', true))
    );
    const countries = countriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as Country}));

    // Fetch leagues from those countries
    const leagues: Competition[] = [];
    for (const country of countries) {
      const competitionsSnap = await getDocs(
        query(
          collection(db, `countries/${country.id}/competitions`), 
          where('inFootballManager', '==', true)
        )
      );
      leagues.push(...competitionsSnap.docs.map(doc => ({  ...doc.data() as Competition})));
    }

    // Fetch teams with their league ids
    const leagueIds = leagues.map(l => l.id);
    let teams: Team[] = [];
    // Firestore 'in' queries are limited to 10 elements
    for (let i = 0; i < leagueIds.length; i += 10) {
      const batch = leagueIds.slice(i, i + 10);
      const teamsSnap = await getDocs(
        query(collection(db, 'teams'), where('leagueId', 'in', batch))
      );
      teams = teams.concat(teamsSnap.docs.map(doc => ({ ...doc.data()  as Team})));
    }

    // Determine which leagues have teams (pulled) and which do not
    const leagueIdsWithTeams = new Set(teams.map(t => t.leagueId));
    const leaguesPulled = leagues.filter(l => leagueIdsWithTeams.has(l.id));
    const leaguesNotPulled = leagues.filter(l => !leagueIdsWithTeams.has(l.id));

    return NextResponse.json({
      leaguesPulled,
      leaguesNotPulled,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
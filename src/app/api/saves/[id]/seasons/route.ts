import { withAuth } from '@/lib/auth/withAuth';
import { db } from '@/lib/db/firebase';
import { updateSaveSeason } from '@/lib/db/saves';
import { addTrophyToSave } from '@/lib/db/trophies';
import { SeasonInput, SeasonSummary } from '@/lib/types/Season';
import { collection, addDoc, doc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }
    
    const body = await req.json() as SeasonInput;
    // Validate required fields
    if (!body.teamId || !body.leagueId || !body.leaguePosition || !body.season) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Fetch team data
    const teamSnap = await getDoc(doc(db, 'teams', body.teamId));
    if (!teamSnap.exists()) throw new Error('Team not found');
    const teamData = teamSnap.data();

    // Fetch competition data
    const countryCode = teamData.countryCode;
    console.log("Country code:", countryCode);
    if (!countryCode) {
      return new Response('Team does not have a country code', { status: 400 });
    }

    const leagueSnap = await getDoc(doc(db, 'countries', countryCode, 'competitions', body.leagueId));
    if (!leagueSnap.exists()) throw new Error('League not found');
    const leagueData = leagueSnap.data();

    const cups = body.cupResults || [];
    const cupPromises = cups.map(cup => getDoc(doc(db, 'countries', cup.countryCode, 'competitions', cup.competitionId)));
    const cupSnapshots = await Promise.all(cupPromises);
    const cupResults = cupSnapshots.filter(snap => snap.exists()).map(snap => ({
      competitionId: snap.id,
      competitionName: snap.data().name,
      competitionLogo: snap.data().logo,
      reachedRound: body.cupResults?.find(cup => cup.competitionId === snap.id)?.reachedRound || 'Group Stage',
    }));

    const newSeason: SeasonSummary = {
      season: body.season,

      teamId: body.teamId,
      teamName: teamData.name,
      teamLogo: teamData.logo,
      
      leagueResult: {
        competitionId: body.leagueId,
        competitionName: leagueData.name,
        competitionLogo: leagueData.logo,
        position: body.leaguePosition,
        promoted: body.promoted,
        relegated: body.relegated,
      },

      cupResults: cupResults,
    };

    const seasonsRef = collection(db, 'users', uid, 'saves', saveId, 'seasons');
    const docRef = await addDoc(seasonsRef, newSeason);
    if (!docRef.id) {
      return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
    }

    if (body.leaguePosition === 1) {
      await addTrophyToSave({
        uid,
        saveId,
        competitionId: body.leagueId,
        teamId: body.teamId,
        countryCode,
        season: body.season,
      });
    }

    // If the season is a cup win, add the trophy
    for (const cup of cups) {
      if (cup.reachedRound === 'Winners') {
        await addTrophyToSave({
          uid,
          saveId,
          competitionId: cup.competitionId,
          teamId: body.teamId,
          countryCode: cup.countryCode,
          season: body.season,
        });
      }
    }

    // Update the season in the save
    await updateSaveSeason(uid, saveId, body.season);

    return NextResponse.json({ id: docRef.id, ...newSeason }, { status: 201 });
  });
}

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }

    const seasonsRef = collection(db, 'users', uid, 'saves', saveId, 'seasons');
    const snapshot = await getDocs(seasonsRef);

    const seasons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(seasons);
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (uid) => {
    const url = new URL(req.url);
    const saveId = url.pathname.split('/')[3];

    if (!uid || !saveId) {
      return NextResponse.json({ error: 'Unauthorized or missing save ID' }, { status: 401 });
    }
    
    const body = await req.json() as { season: string; teamId: string };
    
    // Validate required fields
    if (!body.season || !body.teamId) {
      return new Response('Missing season or teamId', { status: 400 });
    }

    try {
      // Find the existing season document
      const seasonsRef = collection(db, 'users', uid, 'saves', saveId, 'seasons');
      const q = query(seasonsRef, where('season', '==', body.season), where('teamId', '==', body.teamId));
      const existingSeasons = await getDocs(q);
      
      if (existingSeasons.empty) {
        return NextResponse.json({ error: 'Season not found' }, { status: 404 });
      }

      const seasonDoc = existingSeasons.docs[0];
      
      // Delete the document
      await deleteDoc(seasonDoc.ref);

      return NextResponse.json({ message: 'Season deleted successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting season:', error);
      return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
    }
  });
}
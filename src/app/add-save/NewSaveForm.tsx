'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TeamGrid from './TeamGrid';
import { Country, League } from '@/lib/types/RetrieveDB';

export default function NewSaveForm() {
  const { user } = useAuth();
  const [countries, setCountries] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    fetch('/api/countries').then(res => res.json()).then(setCountries);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetch(`/api/leagues?countryCode=${selectedCountry}`)
        .then(res => res.json())
        .then(setLeagues);
    } else {
      setLeagues([]);
      setSelectedLeague('');
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedLeague) {
      fetch(`/api/teams?leagueId=${selectedLeague}`)
        .then(res => res.json())
        .then(setTeams);
    } else {
      setTeams([]);
      setSelectedTeam('');
    }
  }, [selectedLeague]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedTeam || !selectedLeague || !selectedCountry) return;

    const newSave = {
      userId: user.uid,
      countryCode: selectedCountry,
      leagueId: Number(selectedLeague),
      teamId: Number(selectedTeam),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'saves'), newSave);
    alert('✅ Save created!');
    setTimeout(() => {
      window.location.href = '/saves';
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 w-fit">
      <div>
        <label>Country</label>
        <select onChange={e => setSelectedCountry(e.target.value)} className="w-full">
          <option className='text-black' value="">-- Select a country --</option>
          {countries.map((c: Country) => (
            <option className='text-black' key={c.code} value={c.code ?? ''}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>League</label>
        <select onChange={e => setSelectedLeague(e.target.value)} disabled={!selectedCountry} className="w-full">
          <option className='text-black' value="">-- Select a league --</option>
          {leagues.map((l: League) => (
            <option className='text-black' key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <TeamGrid
        teams={teams}
        selectedTeamId={selectedTeam}
        onSelect={setSelectedTeam}
      />

      <button
        type="submit"
        disabled={!selectedTeam}
        className="bg-purple-700 text-white p-2 rounded w-full hover:bg-purple-800 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Create Save
      </button>
    </form>
  );
}

'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { serverTimestamp } from 'firebase/firestore';
import TeamGrid from './TeamGrid';
import { Competition, Country } from '@/lib/types/Country&Competition';
import { Team } from '@/lib/types/Team';

export default function NewSaveForm() {
  const { user } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [leagues, setLeagues] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  // Fetch countries on mount
  useEffect(() => {
    fetch('/api/countries').then(res => res.json()).then(setCountries);
  }, []);

  // Fetch leagues when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetch(`/api/leagues?countryCode=${selectedCountry}`)
        .then(res => res.json())
        .then(setLeagues);
    } 
    else {
      setLeagues([]);
      setSelectedLeague('');
    }
  }, [selectedCountry]);

  // Fetch teams when league changes
  useEffect(() => {
    if (selectedLeague) {
      fetch(`/api/teams?leagueId=${selectedLeague}`)
        .then(res => res.json())
        .then(setTeams);
    } 
    else {
      setTeams([]);
      setSelectedTeam('');
    }
  }, [selectedLeague]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedTeam || !selectedLeague || !selectedCountry) return;

    const newSave = {
      countryCode: selectedCountry,
      leagueId: Number(selectedLeague),
      startingTeamId: Number(selectedTeam),
      createdAt: serverTimestamp()
    };

    const userToken = await user.getIdToken();
    const saveResponse = await fetch('/api/saves', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(newSave),
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json();
      alert(`Error creating save: ${errorData.message}`);
      return;
    }

    alert('✅ Save created!');
    setTimeout(() => {
      window.location.href = '/saves';
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 w-fit">
      <div>
        <label>Country</label>
        <select onChange={e => setSelectedCountry(e.target.value)} className="w-full my-2 bg-[var(--color-dark)] disabled:opacity-50" disabled={!countries.length}>
          <option className='text-black bg-white' value="">-- Select a country --</option>
          {countries.map((c: Country) => (
            <option className='text-black bg-white' key={c.code} value={c.code ?? ''}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>League</label>
        <select onChange={e => setSelectedLeague(e.target.value)} disabled={!selectedCountry} className="w-full my-2 bg-[var(--color-dark)] disabled:opacity-50">
          <option className='text-black bg-white' value="">-- Select a league --</option>
          {leagues.map((l: Competition) => (
            <option className='text-black bg-white' key={l.id} value={l.id}>{l.name}</option>
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

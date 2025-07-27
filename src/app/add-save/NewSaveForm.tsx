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
  const [isNoTeam, setIsNoTeam] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    fetch('/api/countries').then(res => res.json()).then(setCountries);
  }, []);

  // Fetch leagues when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetch(`/api/competitions?country=${selectedCountry}&type=League`)
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
    if (!user || (!selectedTeam && !isNoTeam)) return;

    const newSave = {
      countryCode: isNoTeam ? null : selectedCountry,
      leagueId: isNoTeam ? null : Number(selectedLeague),
      startingTeamId: isNoTeam ? null : Number(selectedTeam),
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
    <div className="max-w-3xl mx-auto rounded-lg">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">Create New Save</h1>
      
      <form onSubmit={handleSubmit} className="bg-[var(--color-dark)] rounded-xl shadow-2xl p-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-lg font-semibold text-white">Country</label>
          <select 
            onChange={e => setSelectedCountry(e.target.value)} 
            className="w-full p-3 rounded-lg bg-[var(--color-darker)] text-white border-2 border-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!countries.length}
          >
            <option value="">-- Select a country --</option>
            {countries.sort((a, b) => a.name.localeCompare(b.name)).map((c: Country) => (
              <option key={c.code} value={c.code ?? ''}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-semibold text-white">League</label>
          <select 
            onChange={e => setSelectedLeague(e.target.value)} 
            disabled={!selectedCountry} 
            className="w-full p-3 rounded-lg bg-[var(--color-darker)] text-white border-2 border-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Select a league --</option>
            {leagues.map((l: Competition) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-white">Starting Option</label>
          
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsNoTeam(false);
                setSelectedTeam('');
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                !isNoTeam 
                  ? 'bg-[var(--color-accent)] text-white shadow-lg' 
                  : 'bg-[var(--color-darker)] text-gray-300 border border-[var(--color-primary)]'
              }`}
            >
              Choose Team
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNoTeam(true);
                setSelectedTeam('');
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isNoTeam 
                  ? 'bg-[var(--color-accent)] text-white shadow-lg' 
                  : 'bg-[var(--color-darker)] text-gray-300 border border-[var(--color-primary)]'
              }`}
            >
              Unemployed
            </button>
          </div>

          {isNoTeam ? (
            <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-dashed border-[var(--color-accent)] text-center">
              <div className="text-6xl mb-4">🆓</div>
              <h3 className="text-xl font-bold text-white mb-2">Unemployed Mode</h3>
              <p className="text-gray-300">Start your career without being tied to any specific team. Perfect for a challenging journey!</p>
            </div>
          ) : (
            <div className={`transition-opacity duration-200 ${!selectedLeague ? 'opacity-50 pointer-events-none' : ''}`}>
              <TeamGrid
                teams={teams}
                selectedTeamId={selectedTeam}
                onSelect={setSelectedTeam}
              />
              {selectedLeague && teams.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">⚽</div>
                  <p>Loading teams...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={(!selectedTeam && !isNoTeam)}
          className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] 
          text-white font-bold py-4 px-6 rounded-lg cursor-pointer
          hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)] 
          transition-all duration-300 transform hover:scale-[1.02] 
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {isNoTeam ? '🆓 Create Unemployed Save' : '⚽ Create Save'}
        </button>
      </form>
    </div>
  );
}

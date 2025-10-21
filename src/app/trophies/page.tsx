'use client';

import { CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { TrophyGroup } from '@/lib/types/Trophy';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import FootballLoader from '@/app/components/FootBallLoader';
import CircleProgress from '@/app/components/progress/CircleProgress';
import Image from 'next/image';
import BlurredCard from '../components/BlurredCard';
import { Game } from '@/lib/types/Game';

export default function TrophiesPage() {
  const { user, userLoading } = useAuth();
  const [countries, setCountries] = useState<CountryWithCompetitions[]>([]);
  const [trophies, setTrophies] = useState<TrophyGroup[]>([]);
  const [groupMapping, setGroupMapping] = useState<Record<string, string[]>>({});
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!user) {
        const [compsRes, mappingRes, gamesRes] = await Promise.all([
          fetch('/api/competitions/grouped'),
          fetch('/api/admin/competitions/mapping'),
          fetch('/api/games?active=true'),
        ]);
        
        if (compsRes.ok && mappingRes.ok && gamesRes.ok) {
          const compsData = await compsRes.json();
          const mappingData = await mappingRes.json();
          const gamesData = await gamesRes.json();
          setCountries(compsData);
          setGroupMapping(mappingData.groupMapping || {});
          setGames(gamesData.games || []);
        }
        setLoading(false);
        return;
      }
      
      // Get token and fetch data
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch competitions, trophies, group mapping, and games
      const trophiesUrl = selectedGame !== 'all' ? `/api/trophies?game=${selectedGame}` : '/api/trophies';
      const [compsRes, trophiesRes, mappingRes, gamesRes] = await Promise.all([
        fetch('/api/competitions/grouped', { headers }),
        fetch(trophiesUrl, { headers }),
        fetch('/api/admin/competitions/mapping'),
        fetch('/api/games', { headers }),
      ]);

      // Check if all requests were successful
      if (!compsRes.ok || !trophiesRes.ok || !mappingRes.ok || !gamesRes.ok) {
        console.error('Failed to fetch competitions, trophies, mapping, or games');
        setLoading(false);
        return;
      }

      // Get JSON data
      const compsData = await compsRes.json();
      const trophiesData = await trophiesRes.json();
      const mappingData = await mappingRes.json();
      const gamesData = await gamesRes.json();

      // Set state with fetched data
      setCountries(compsData);
      setTrophies(trophiesData);
      setGroupMapping(mappingData.groupMapping || {});
      console.log('Fetched games data:', gamesData);
      setGames(gamesData.games || []);
      setLoading(false);
    }
    
    // Wait for user to be loaded
    if (userLoading) return;
    else {
      fetchAll();
    }

  }, [user, userLoading, selectedGame]);

  if (loading) {
    return <FootballLoader />;
  }

  if (!countries?.length) {
    return <div>No competitions found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">🏆 Trophies Checklist</h1>
        
        {games.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="game-select" className="text-sm font-medium text-gray-700">
              Game:
            </label>
            <select
              id="game-select"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Games</option>
              {games.map(game => (
                <option key={game.id} value={game.id}>{game.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
          return <TrophyCountry key={country.code} country={country} trophies={trophies} groupMapping={groupMapping} />;
        })}
      </div>
    </div>
  );
}

function TrophyCountry({ country, trophies, groupMapping }: { 
  country: CountryWithCompetitions, 
  trophies: TrophyGroup[], 
  groupMapping: Record<string, string[]> 
}) {
  const hasWon = (competitionId: string | number) => {
    const compIdStr = String(competitionId);
    
    // Check if user has won this specific competition
    const directWin = trophies.some((t) => String(t.competitionId) === compIdStr);
    if (directWin) return true;
    
    // Check if this is a grouped competition and user won any member of the group
    const groupName = Object.keys(groupMapping).find(groupName => 
      groupMapping[groupName].includes(compIdStr)
    );
    
    if (groupName) {
      // Check if user won any competition in this group
      const groupMembers = groupMapping[groupName];
      return trophies.some((t) => groupMembers.includes(String(t.competitionId)));
    }
    
    return false;
  };
  
  const comps = country.competitions || [];
  const total = comps.length;
  const won = comps.filter((c) => hasWon(c.id)).length;

  return (
    <BlurredCard className="h-fit">
      <div className="text-white p-2">
        <details className="space-y-2">
          <summary className="cursor-pointer flex items-center justify-between mb-0">
            <div className="flex items-center gap-2">
              <Image
                src={country.flag} 
                alt={country.name} 
                width={20}
                height={20}
                className="w-5 h-5"
                unoptimized
              />
              <span className="font-semibold text-lg">{country.name}</span>
            </div>
            <CircleProgress completed={won} total={total} size={48} strokeWidth={6} />
          </summary>

          <ul className="pl-4 space-y-1 pt-4">
            {comps.map((comp, index) => (
              <li
                key={`${country.code}-${String(comp.id)}-${index}`}
                className={`flex items-center gap-2 ${
                  hasWon(comp.id) ? 'text-green-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {comp.logo ? (
                  <Image 
                    src={comp.logo} 
                    alt={comp.name} 
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    unoptimized
                  />
                ) : (
                  <div className="w-4 h-4 bg-gray-300 rounded flex-shrink-0"></div>
                )}
                <span>{comp.name}</span>
                {hasWon(comp.id) && <span>🏆</span>}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </BlurredCard>
  );
}
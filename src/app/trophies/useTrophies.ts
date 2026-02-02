import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { TrophyGroup } from '@/lib/types/firebase/Trophy';
import { FirebaseGame } from '@/lib/types/firebase/Game';
import { CountryWithCompetitions } from '@/lib/types/prisma/Competitions';

export function useTrophies(selectedGame: string) {
  const { user, userLoading } = useAuth();
  const [countries, setCountries] = useState<CountryWithCompetitions[]>([]);
  const [trophies, setTrophies] = useState<TrophyGroup[]>([]);
  const [groupMapping, setGroupMapping] = useState<Record<string, string[]>>({});
  const [games, setGames] = useState<FirebaseGame[]>([]);
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
      setGames(gamesData.games || []);
      setLoading(false);
    }
    
    // Wait for user to be loaded
    if (userLoading) return;
    else {
      fetchAll();
    }

  }, [user, userLoading, selectedGame]);

  return { countries, trophies, groupMapping, games, loading };
}

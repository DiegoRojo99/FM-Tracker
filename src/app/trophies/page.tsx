'use client';

import { CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { Trophy } from '@/lib/types/Trophy';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import FootballLoader from '../components/FootBallLoader';


export default function TrophiesPage() {
  const { user, userLoading } = useAuth();
  const [countries, setCountries] = useState<CountryWithCompetitions[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!user) return;
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [compsRes, trophiesRes] = await Promise.all([
        fetch('/api/competitions/fm-only', { headers }),
        fetch('/api/trophies', { headers }),
      ]);

      const compsData = await compsRes.json();
      const trophiesData = await trophiesRes.json();

      console.log('Fetched competitions:', compsData);
      console.log('Fetched trophies:', trophiesData);

      setCountries(compsData);
      setTrophies(trophiesData);
      setLoading(false);
    }
    
    // Wait for user to be loaded
    if (userLoading) return;
    else if (!user) {
      setLoading(false);
      return;
    }
    else {
      fetchAll();
    }

  }, [user, userLoading]);

  const hasWon = (competitionId: number) =>
    trophies.some((t) => String(t.competitionId) === String(competitionId));

  if (loading) {
    return <FootballLoader />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🏆 Trophies Checklist</h1>

      {countries.map((country) => {
        const comps = country.competitions || [];
        const total = comps.length;
        const won = comps.filter((c) => hasWon(c.id)).length;
        const percentage = total > 0 ? Math.round((won / total) * 100) : 0;

        return (
          <div key={country.code} className="border rounded-lg bg-white shadow p-4 text-black">
            <details className="space-y-2">
              <summary className="cursor-pointer flex items-center justify-between mb-0">
                <div className="flex items-center gap-2">
                  <img src={country.flag} alt={country.name} className="w-5 h-5" />
                  <span className="font-semibold">{country.name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {won}/{total} ({percentage}%)
                </span>
              </summary>

              <ul className="pl-4 space-y-1 pt-4">
                {comps.map((comp) => (
                  <li
                    key={comp.id}
                    className={`flex items-center gap-2 ${
                      hasWon(comp.id) ? 'text-green-600 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    <img src={comp.logo} alt={comp.name} className="w-4 h-4" />
                    <span>{comp.name}</span>
                    {hasWon(comp.id) && <span>🏆</span>}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </div>
  );
}

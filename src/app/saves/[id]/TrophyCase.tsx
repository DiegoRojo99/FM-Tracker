'use client';

import { useAuth } from '@/app/components/AuthProvider';
import { useEffect, useState } from 'react';
import AddTrophyModal from './AddTrophyModal';
import { Trophy } from '@/lib/types/Trophy';
import { SaveWithChildren } from '@/lib/types/Save';
import Image from 'next/image';
import { CareerStint } from '@/lib/types/Career';

type Props = {
  save: SaveWithChildren;
};

export default function TrophyCase({ save }: Props) {
  const { user } = useAuth();
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTrophies = async () => {
      if (!user) return;

      const userToken = await user.getIdToken();
      const response = await fetch(`/api/saves/${save.id}/trophies`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch trophies:', response.statusText);
        return;
      }

      const data = await response.json();
      setTrophies(data);
    };

    fetchTrophies();
  }, [save, user]);

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Trophy Case</h2>
        <button
          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          +
        </button>
      </div>

      {trophies.length === 0 ? (
        <p className="text-sm text-gray-500">No trophies yet. Start winning!</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {trophies.map((trophyWin, i) => {
            const team = save.career?.find((t: CareerStint) => t.teamId === trophyWin.teamId);
            return (
              <div key={i} className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900 shadow">
                <div className="flex items-center gap-2 mb-2">
                  {team?.logo && (
                    <Image src={team.logo} alt={team.name} width={128} height={128} className="w-6 h-6 object-contain" />
                  )}
                  <span className="font-semibold">{team?.name || 'Unknown Team'}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {trophyWin?.competitionLogo && (
                    <Image src={trophyWin.competitionLogo} alt={trophyWin.competitionName} width={128} height={128} className="w-6 h-6 object-contain" />
                  )}
                  <span className="font-semibold">{trophyWin.competitionName || 'Unknown Competition'}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {trophyWin.competitionName || 'Unknown Competition'}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {trophyWin.season} — {new Date(trophyWin.dateWon).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddTrophyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        saveId={save.id}
        onSuccess={(newTrophy) => setTrophies((prev) => [...prev, newTrophy])}
      />
    </section>
  );
}

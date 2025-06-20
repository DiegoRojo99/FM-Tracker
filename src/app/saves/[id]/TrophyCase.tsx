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
            return (
              <div key={i} className="bg-purple-50 dark:bg-purple-900 border border-purple-600 rounded-lg p-4 flex flex-col items-center shadow">
                {trophyWin.competitionLogo && (
                  <Image
                    src={trophyWin.competitionLogo}
                    alt={trophyWin.competitionName}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain mb-2"
                  />
                )}
                <div className="text-lg font-bold text-center mb-2">{trophyWin.competitionName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-1">
                  Season: {trophyWin.season}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300 text-center">
                  {trophyWin.teamName}
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

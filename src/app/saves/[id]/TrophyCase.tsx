'use client';

import { useAuth } from '@/app/components/AuthProvider';
import { useEffect, useState } from 'react';
import AddTrophyModal from '@/app/components/modals/AddTrophyModal';
import { TrophyGroup } from '@/lib/types/Trophy';
import { SaveWithChildren } from '@/lib/types/Save';
import Image from 'next/image';
import BlurredCard from '@/app/components/BlurredCard';
import { groupTrophies } from '@/lib/dto/trophies';
import GradientButton from '@/app/components/GradientButton';

type Props = {
  save: SaveWithChildren;
  setRefresh: (refresh: boolean) => void; // Prop for refreshing
};

export default function TrophyCase({ save, setRefresh }: Props) {
  const { user } = useAuth();
  const [trophies, setTrophies] = useState<TrophyGroup[]>(groupTrophies(save.trophies || []));
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
        <GradientButton
          onClick={() => setShowModal(true)}
        >
          + Add Trophy
        </GradientButton>
      </div>

      {trophies.length === 0 ? (
        <p className="text-sm text-gray-500">No trophies yet. Start winning!</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {trophies.map((trophy, i) => {
            if (!trophy?.trophies?.length) {
              return (
                <BlurredCard key={i} blurSize='2xs'>
                  <div className="flex flex-col items-center p-4">
                    <div className="text-sm text-gray-500">No trophies won</div>
                  </div>
                </BlurredCard>
              );
            }

            return (
              <BlurredCard key={i} blurSize='2xs'>
                <div className="flex flex-col items-center">
                  {trophy.competitionLogo && (
                    <Image
                      src={trophy.competitionLogo}
                      alt={trophy.competitionName}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain mb-2"
                  />
                )}
                <div className="text-lg font-bold text-center mb-2">{trophy.competitionName}</div>
                {trophy.trophies.length ? (
                  <ul className="list-none text-sm text-gray-700 dark:text-gray-300">
                    {trophy.trophies.map((trophyItem, j) => (
                      <li key={`trophy-${i}-${j}`} className="mb-1">
                        <span className="font-semibold">{trophyItem.season}</span>:
                        <span className="ml-1">{trophyItem.teamName}</span>
                      </li>
                    ))}
                  </ul>                  
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    No trophies won
                  </div>
                )}
              </div>
              </BlurredCard>
            );
          })}
        </div>
      )}

      <AddTrophyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        saveId={save.id}
        saveDetails={save}
        onSuccess={() => {
          setRefresh(true);
        }}
      />
    </section>
  );
}

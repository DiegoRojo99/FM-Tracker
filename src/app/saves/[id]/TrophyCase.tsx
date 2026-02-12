'use client';

import { useAuth } from '@/app/components/AuthProvider';
import { useEffect, useState } from 'react';
import AddTrophyModal from '@/app/components/modals/AddTrophyModal';
import EditTrophyModal from '@/app/components/modals/EditTrophyModal';
import ConfirmationModal from '@/app/components/modals/ConfirmationModal';
import Image from 'next/image';
import BlurredCard from '@/app/components/BlurredCard';
import { groupTrophies } from '@/lib/dto/trophies';
import { TrophyGroup, Trophy } from '@/lib/types/prisma/Trophy';
import { FullDetailsSaveWithOwnership } from '@/lib/types/prisma/Save';
import GradientButton from '@/app/components/GradientButton';

type Props = {
  save: FullDetailsSaveWithOwnership;
  setRefresh: (refresh: boolean) => void; // Prop for refreshing
};

export default function TrophyCase({ save, setRefresh }: Props) {
  const { user } = useAuth();
  const [trophies, setTrophies] = useState<TrophyGroup[]>(groupTrophies(save.trophies || []));
  const [showModal, setShowModal] = useState(false);
  const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
  const [deletingTrophy, setDeletingTrophy] = useState<Trophy | null>(null);

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

  const handleDeleteTrophy = async () => {
    if (!deletingTrophy || !user) return;

    const userToken = await user.getIdToken();
    const response = await fetch(`/api/saves/${save.id}/trophies/${deletingTrophy.id}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken || ''}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to delete trophy:', response.statusText);
      return;
    }

    setRefresh(true);
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Trophy Case</h2>
        {save.isOwner && (
          <GradientButton
            onClick={() => setShowModal(true)}
          >
            + Add Trophy
          </GradientButton>
        )}
      </div>

      {trophies.length === 0 ? (
        <p className="text-sm text-gray-500">No trophies yet. Start winning!</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {trophies.map((trophy, i) => (
            <TrophyGroupCard 
              key={i} 
              trophies={trophy}
              onEditTrophy={setEditingTrophy}
              onDeleteTrophy={setDeletingTrophy}
              isOwner={save.isOwner}
            />
          ))}
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

      {editingTrophy && (
        <EditTrophyModal
          open={!!editingTrophy}
          onClose={() => setEditingTrophy(null)}
          saveId={save.id}
          saveDetails={save}
          trophy={editingTrophy}
          onSuccess={() => {
            setRefresh(true);
            setEditingTrophy(null);
          }}
        />
      )}

      <ConfirmationModal
        open={!!deletingTrophy}
        onClose={() => setDeletingTrophy(null)}
        onConfirm={handleDeleteTrophy}
        title="Delete Trophy"
        message={`Are you sure you want to delete the trophy won in season ${deletingTrophy?.season}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </section>
  );
}

function TrophyGroupCard({ 
  trophies, 
  onEditTrophy, 
  onDeleteTrophy,
  isOwner = false
}: { 
  trophies: TrophyGroup;
  onEditTrophy?: (trophy: Trophy) => void;
  onDeleteTrophy?: (trophy: Trophy) => void;
  isOwner?: boolean;
}) {
  if (!trophies?.trophies?.length) {
    return (
      <BlurredCard blurSize='2xs'>
        <div className="flex flex-col items-center p-4">
          <div className="text-sm text-gray-500">No trophies won</div>
        </div>
      </BlurredCard>
    );
  }

  return (
    <BlurredCard blurSize='2xs'>
      <div className="flex flex-col items-center">
        {trophies.competitionGroup.logoUrl && (
          <Image
            src={trophies.competitionGroup.logoUrl}
            alt={trophies.competitionGroup.name}
            width={96}
            height={96}
            className="w-24 h-24 object-contain mb-2"
          />
        )}
        <div className="text-lg font-bold text-center mb-2">{trophies.competitionGroup.name}</div>

        {trophies.trophies.length ? (
            <div className="space-y-2 w-full">
              {trophies.trophies.map((trophyItem, j) => (
                <div key={`trophy-${trophies.competitionGroup.name}-${j}`} className="flex items-center justify-between p-2 bg-black/20 rounded border border-gray-600">
                  <Image
                    src={trophyItem.team.logo || '/default-team-logo.png'}
                    alt={trophyItem.team.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain mr-2"
                  />
                  <div className="font-semibold">{trophyItem.season}</div>
                  {isOwner && (
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTrophy?.(trophyItem);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1 text-xs"
                        title="Edit Trophy"
                      >
                        <Image
                          src="/pencil.svg"
                          alt="Edit Icon"
                          width={16}
                          height={16}
                          className="h-4 w-4 white-image hover:cursor-pointer hover:opacity-80 hover:scale-110 transition-transform"
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTrophy?.(trophyItem);
                        }}
                        className="text-red-400 hover:text-red-300 p-1 text-xs"
                        title="Delete Trophy"
                      >
                        <Image 
                          src="/trash.svg" 
                          alt="Trash Icon" 
                          width={16} 
                          height={16} 
                          className="h-4 w-4 white-image hover:cursor-pointer hover:opacity-80 hover:scale-110 transition-transform" 
                        />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            No trophies won
          </div>
        )}
      </div>
    </BlurredCard>
  );
}

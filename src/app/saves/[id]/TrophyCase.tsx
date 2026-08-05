'use client';

import { useAuth } from '@/app/components/AuthProvider';
import { useEffect, useState } from 'react';
import AddTrophyModal from '@/app/components/modals/AddTrophyModal';
import EditTrophyModal from '@/app/components/modals/EditTrophyModal';
import ConfirmationModal from '@/app/components/modals/ConfirmationModal';
import Image from 'next/image';
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

  const totalTrophies = trophies.reduce((acc, group) => acc + group.trophies.length, 0);
  const totalCompetitions = trophies.length;

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
    <section className="mt-0 min-w-0">
      <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[linear-gradient(135deg,#ffffff14_0%,#ffffff08_42%,#ffffff03_100%)] p-4 shadow-[0_16px_48px_var(--color-shadow-soft)] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-highlight)]">Honours</p>
            <h2 className="mt-1 text-2xl font-black text-white">Honours Cabinet</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Every final won, grouped by competition.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:min-w-[18rem]">
            <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Trophies</p>
              <p className="mt-2 text-2xl font-black leading-none text-white">{totalTrophies}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Competitions</p>
              <p className="mt-2 text-2xl font-black leading-none text-white">{totalCompetitions}</p>
            </div>
          </div>
        </div>

        {save.isOwner && (
          <div className="mt-4 sm:mt-5">
            <GradientButton
              className="w-full sm:w-auto"
              onClick={() => setShowModal(true)}
            >
              + Add Trophy
            </GradientButton>
          </div>
        )}
      </div>

      {trophies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/70 px-5 py-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">No silverware yet</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Log your first cup or league title to start building this wall.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <div className="overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center p-4">
          <div className="text-sm text-[var(--color-text-muted)]">No trophies won</div>
        </div>
      </div>
    );
  }

  const sortedTrophies = [...trophies.trophies].sort((a, b) => b.season.localeCompare(a.season));

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 shadow-xl backdrop-blur-sm">
      <div className="group rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/50 p-4 transition duration-300 hover:border-[var(--color-highlight)]/50 hover:shadow-[0_10px_30px_var(--color-shadow-highlight)]">
        <div className="flex items-start gap-3 border-b border-[var(--color-surface-border)] pb-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/55 bg-[linear-gradient(160deg,#ffffff_0%,#eef2ff_100%)] shadow-[inset_0_0_0_1px_#ffffff80,0_8px_16px_#00000030]">
            {trophies.competitionGroup.logoUrl ? (
              <Image
                src={trophies.competitionGroup.logoUrl}
                alt={trophies.competitionGroup.name}
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
            ) : (
              <span className="text-xs font-bold uppercase text-slate-700">Cup</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{trophies.competitionGroup.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {sortedTrophies.length} {sortedTrophies.length === 1 ? 'title' : 'titles'}
            </p>
          </div>
        </div>

        <ul className="mt-3 divide-y divide-[var(--color-surface-border)]/80">
          {sortedTrophies.map((trophyItem, j) => (
            <li key={`trophy-${trophies.competitionGroup.name}-${j}`} className="py-2.5">
              <div className="flex items-center gap-3">
                <Image
                  src={trophyItem.team.logo || '/default-team-logo.png'}
                  alt={trophyItem.team.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full border border-[var(--color-surface-border)] bg-black/20 object-contain"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{trophyItem.team.name}</p>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">{trophyItem.season}</p>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-1 opacity-90 transition group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTrophy?.(trophyItem);
                      }}
                      className="rounded-md border border-[var(--color-surface-border)] p-1.5 text-xs hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-soft)]"
                      title="Edit Trophy"
                    >
                      <Image
                        src="/pencil.svg"
                        alt="Edit Icon"
                        width={14}
                        height={14}
                        className="white-image h-3.5 w-3.5"
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrophy?.(trophyItem);
                      }}
                      className="rounded-md border border-[var(--color-danger-soft-border)]/60 p-1.5 text-xs hover:border-[var(--color-danger-soft-border)] hover:bg-[var(--color-danger-soft-bg)]"
                      title="Delete Trophy"
                    >
                      <Image
                        src="/trash.svg"
                        alt="Trash Icon"
                        width={14}
                        height={14}
                        className="white-image h-3.5 w-3.5"
                      />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import FootballLoader from '../components/FootBallLoader';
import { SaveCard } from './SaveCard';
import GradientButton from '../components/GradientButton';
import { Game } from '@/lib/types/prisma/Game';
import { PreviewSave, Save } from '@/lib/types/prisma/Save';
import { PlusCircle, Save as SaveIcon, SlidersHorizontal } from 'lucide-react';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics/events';

export default function SavesPage() {
  const { user, userLoading } = useAuth();
  const [saves, setSaves] = useState<PreviewSave[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deletingSave, setDeletingSave] = useState<PreviewSave | null>(null);
  
  useEffect(() => {
    if (!user && userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const token = await user.getIdToken();
      
      // Fetch saves and games in parallel
      const [savesResponse, gamesResponse] = await Promise.all([
        fetch('/api/saves', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/games?active=true')
      ]);

      const savesData = await savesResponse.json();
      const gamesData = await gamesResponse.json();
      
      setSaves(savesData);
      setGames(gamesData.games || []);
      setLoading(false);
    };

    fetchData().catch(() => setLoading(false));
  }, [user, userLoading]);

  
  function handleDelete(event: React.MouseEvent<HTMLButtonElement>, saveId: string) {
    event.stopPropagation();

    // Check if user is logged in
    if (!user) return;
    
    // Find the save to delete and open confirmation modal
    const saveToDelete = saves.find(save => save.id === saveId);
    if (saveToDelete) {
      setDeletingSave(saveToDelete);
    }
  }

  async function confirmDelete() {
    if (!deletingSave || !user) return;
    const deletedSave = deletingSave;
    
    const token = await user.getIdToken();
    const response = await fetch(`/api/saves/${deletingSave.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`,},
    });
    
    if (!response.ok) throw new Error('Failed to delete save');
    
    // Remove the deleted save from the state
    setSaves(prevSaves => prevSaves.filter(save => save.id !== deletingSave.id));
    setDeletingSave(null);

    trackEvent(AnalyticsEvents.SaveDeleted, {
      gameId: deletedSave.gameId,
      hadCurrentClub: Boolean(deletedSave.currentClub),
      hadNationalTeam: Boolean(deletedSave.currentNT),
    });
  }

  function getLatestDate(save: Save) {
    const updatedAtTime = new Date(save.updatedAt);
    const createdAtTime = new Date(save.createdAt);
    return updatedAtTime ?? createdAtTime;
  }

  function sortSavesByDate(a: Save, b: Save) {
    const dateA = getLatestDate(a);
    const dateB = getLatestDate(b);
    return dateB.getTime() - dateA.getTime();
  }

  // Filter saves based on selected game
  const filteredSaves = saves.filter(save => {
    if (selectedGameFilter === 'all') return true;
    return save.gameId === selectedGameFilter;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[52vh] items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl p-6 sm:p-8">
        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-6 text-center shadow-xl backdrop-blur-sm sm:p-8">
          <h1 className="text-2xl font-bold text-white">Your Saves</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Please log in to view and manage your career saves.</p>
          <Link href="/login" className="mt-5 inline-block">
            <GradientButton>
              Login to Continue
            </GradientButton>
          </Link>
        </div>
      </div>
    );
  }

  const selectedGameName = games.find((g) => g.id === selectedGameFilter)?.name || 'selected game';

  if (!saves || saves.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Career Hub</p>
            <h1 className="mt-1 text-3xl font-black text-white">Your Saves</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Build your timeline, one save at a time.</p>
          </div>
          <Link href="/add-save" className="inline-block">
            <GradientButton className="inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New Save
            </GradientButton>
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-8 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-highlight)]">
            <SaveIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">No saves yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Create your first save and start tracking your FM legacy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">Career Hub</p>
          <h1 className="mt-1 text-3xl font-black text-white">Your Saves</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {filteredSaves.length} of {saves.length} saves visible
          </p>
        </div>

        <Link href="/add-save" className="inline-block">
          <GradientButton className="inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Save
          </GradientButton>
        </Link>
      </div>
      
      <div className="mb-7 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-200">
            <SlidersHorizontal className="h-4 w-4 text-[var(--color-highlight)]" />
            Filters
          </div>

          <div className="w-full sm:w-72">
            <label htmlFor="gameFilter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Game Version
            </label>
            <select
              id="gameFilter"
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="all">All Games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredSaves.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 py-12 text-center shadow-lg backdrop-blur-sm">
          <p className="text-sm text-[var(--color-text-muted)]">
            {selectedGameFilter === 'all' 
              ? 'No saves found.' 
              : `No saves found for ${selectedGameName}.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...filteredSaves].sort(sortSavesByDate).map(save => ( 
            <SaveCard key={save.id} save={save} handleDelete={handleDelete} /> 
          ))}
        </div>
      )}

      <ConfirmationModal
        open={!!deletingSave}
        onClose={() => setDeletingSave(null)}
        onConfirm={confirmDelete}
        title="Delete Save"
        message={`Are you sure you want to delete the save for ${deletingSave?.currentClub?.name || deletingSave?.currentNT?.name || 'No Team'}? This action cannot be undone.`}
        confirmText="Delete"
        destructive={true}
      />
    </div>
  )
}

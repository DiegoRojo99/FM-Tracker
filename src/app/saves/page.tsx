'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { Save } from '@/lib/types/Save';
import FootballLoader from '../components/FootBallLoader';
import { SaveCard } from './SaveCard';
import GradientButton from '../components/GradientButton';
import { Game } from '@/lib/types/Game';


export default function SavesPage() {
  const { user, userLoading } = useAuth();
  const [saves, setSaves] = useState<Save[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deletingSave, setDeletingSave] = useState<Save | null>(null);

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

  
  function handleDelete(event: React.MouseEvent, saveId: string) {
    // Avoid default action of the link
    event.preventDefault();
    
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
    
    const token = await user.getIdToken();
    
    const response = await fetch(`/api/saves/${deletingSave.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete save');
    }
    
    // Remove the deleted save from the state
    setSaves(prevSaves => prevSaves.filter(save => save.id !== deletingSave.id));
    setDeletingSave(null);
  }

  function getLatestDate(save: Save) {
    const updatedAtTime = save.updatedAt ? save.updatedAt._seconds * 1000 + Math.floor(save.updatedAt._nanoseconds / 1000000) : 0;
    const createdAtTime = save.createdAt ? save.createdAt._seconds * 1000 + Math.floor(save.createdAt._nanoseconds / 1000000) : 0;
    return updatedAtTime || createdAtTime;
  }

  function sortSavesByDate(a: Save, b: Save) {
    const dateA = getLatestDate(a);
    const dateB = getLatestDate(b);
    return dateB - dateA;
  }

  // Filter saves based on selected game
  const filteredSaves = saves.filter(save => {
    if (selectedGameFilter === 'all') return true;
    return save.gameId === selectedGameFilter;
  });

  if (loading) {
    return <FootballLoader />;
  }

  if (!user) {
    return (
      <div className='p-6'>
        <p className='text-gray-500'>Please log in to view your saves.</p>
      </div>
    );
  }

  if (!saves || saves.length === 0) {
    return (
      <div className='p-6'>
        <div className='mb-6 flex flex-row items-center justify-between'>
          <h1 className="text-2xl font-bold">Your Saves</h1>
          <Link href="/add-save" className="inline-block">
            <GradientButton>
              Create New Save
            </GradientButton>
          </Link>
        </div>
        <p className='text-gray-500'>No saves found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className='mb-6 flex flex-row items-center justify-between'>
        <h1 className="text-2xl font-bold">Your Saves</h1>
        <Link href="/add-save" className="inline-block">
          <GradientButton>
            Create New Save
          </GradientButton>
        </Link>
      </div>
      
      {/* Game Filter */}
      <div className="mb-6 flex flex-row items-center gap-4">
        <label htmlFor="gameFilter" className="text-sm font-medium text-gray-300">
          Filter by Game:
        </label>
        <select
          id="gameFilter"
          value={selectedGameFilter}
          onChange={(e) => setSelectedGameFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--color-darker)] text-white border-2 border-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
        >
          <option value="all">All Games</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          ({filteredSaves.length} save{filteredSaves.length !== 1 ? 's' : ''})
        </span>
      </div>

      {filteredSaves.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {selectedGameFilter === 'all' 
              ? 'No saves found.' 
              : `No saves found for ${games.find(g => g.id === selectedGameFilter)?.name || 'selected game'}.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSaves.sort(sortSavesByDate).map(save => ( 
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

'use client';

import { Competition, Team } from '@/lib/types/RetrieveDB';
import { Trophy } from '@/lib/types/Trophy';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import CompetitionSearchDropdown from '@/app/components/algolia/CompetitionSearchDropdown';
import FootballLoader from '@/app/components/FootBallLoader';
import { useAuth } from '@/app/components/AuthProvider';

type Props = {
  open: boolean;
  onClose: () => void;
  saveId: string;
  onSuccess: (trophy: Trophy) => void;
};

export default function AddTrophyModal({ open, onClose, saveId, onSuccess }: Props) {
  const { user } = useAuth();
  const [teamId, setTeamId] = useState('');
  const [dateWon, setDateWon] = useState('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!teamId || !dateWon || !competition) return;
    setLoading(true);

    if (!user) return;
    const userToken = await user.getIdToken();

    await fetch(`/api/saves/${saveId}/trophies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        teamId: teamId.toString(),
        dateWon: dateWon.toString(),
        competitionId: competition.id.toString(),
        countryCode: competition.countryCode.toString(),
      }),
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to add trophy');
      }
      return res.json();
    })
    .then((data) => {
      onSuccess?.(data);
    })
    .catch((error) => {
      console.error('Error adding trophy:', error);
    })
    .finally(() => {
      setLoading(false);
      onClose();
    });
  }

  if (!open) return <></>;
  else if (loading) return <FootballLoader />;

  return (
    <>
      {/* Modal */}
      <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl relative">
            <button
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
              onClick={onClose}
            >
              <X className="w-5 h-5 cursor-pointer" />
            </button>
            <Dialog.Title className="text-xl font-bold mb-4">Add Trophy</Dialog.Title>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div>
                <label className="block text-sm mb-1">Competition</label>
                <CompetitionSearchDropdown
                  onCompetitionSelect={(competition) => setCompetition(competition)}
                />
              </div>
              <div>
                <input
                  hidden
                  name="competitionId"
                  value={competition ? competition.id : ''}
                  readOnly
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  placeholder="Enter competition ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Team</label>
                <TeamSearchDropdown
                  onTeamSelect={(team: Team) => setTeamId(team.id)}
                />
              </div>
              <div>
                <input
                  hidden
                  name="teamId"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  placeholder="Enter team ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Won Date</label>
                <input
                  type="date"
                  name="dateWon"
                  value={dateWon}
                  onChange={(e) => setDateWon(e.target.value)}
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded p-2"
              >
                Save
              </button>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}

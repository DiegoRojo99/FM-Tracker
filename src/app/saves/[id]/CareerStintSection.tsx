'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { SaveWithChildren } from '@/lib/types/Save';
import { useAuth } from '@/app/components/AuthProvider';
import CareerTimeline from './CareerTimeline';
import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import { Team } from '@/lib/types/Team';
import CompetitionDropdown from '@/app/components/dropdowns/CompetitionDropdown';
import { Competition } from '@/lib/types/Country&Competition';

type Props = {
  saveDetails: SaveWithChildren;
  setRefresh: (refresh: boolean) => void; // Optional prop for refreshing
};

export default function CareerStintsSection({ saveDetails, setRefresh }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);

  // Form fields
  const [form, setForm] = useState({
    teamId: '',
    leagueId: '',
    startDate: '',
    endDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' && 'checked' in e.target ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    const token = await user.getIdToken();
    if (!token) {
      console.error('User is not authenticated');
      return;
    }

    const response = await fetch(`/api/saves/${saveDetails.id}/career`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        teamId: form.teamId,
        startDate: form.startDate,
        endDate: form.endDate,
        leagueId: form.leagueId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to save career stint');
      return;
    }

    setRefresh(true); // Call refresh if provided
  };

  return (
    <section className="w-full">
      <div className="mb-2 sm:mb-6 flex flex-row items-center justify-between">
        <h3 className="text-xl font-semibold">Career Stints</h3>
        <button
          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          +
        </button>
      </div>

      {saveDetails.career?.length ? (
        <CareerTimeline
          stints={saveDetails.career}
        />
      ) : (
        <div className='text-sm text-gray-500 mt-4'>No career stints found.</div>
      )}

      {/* Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl relative">
            <button
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <Dialog.Title className="text-xl font-bold mb-4">Add Career Stint</Dialog.Title>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div>
                <label className="block text-sm mb-1">Team</label>
                <TeamSearchDropdown
                  onTeamSelect={(team: Team) => {setForm((prev) => ({ ...prev, teamId: String(team.id) })); setCountryCode(team.countryCode);}}
                />
              </div>
              <div>
                <input
                  hidden
                  name="teamId"
                  value={form.teamId}
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  placeholder="Enter team ID"
                  required
                />
              </div>
              
              {form.teamId && countryCode ? (
                <div>
                  <label className="block text-sm mb-1">League</label>
                  <CompetitionDropdown
                    onChange={(competition: Competition) => setForm((prev) => ({ ...prev, leagueId: String(competition.id) }))}
                    type='League'
                    country={countryCode}
                    value={form.leagueId}
                  />
                </div>
              ) : (<div className="text-sm text-gray-500">Select a team to view leagues</div>)}
              <div>
                <input
                  hidden
                  name="leagueId"
                  value={form.leagueId}
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  placeholder="Enter league ID"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">End Date (optional)</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded p-2 cursor-pointer"
              >
                Save
              </button>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  );
}

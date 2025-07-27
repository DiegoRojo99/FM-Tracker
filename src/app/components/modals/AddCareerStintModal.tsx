import React, { useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import { Team } from '@/lib/types/Team';
import CompetitionDropdown from '@/app/components/dropdowns/CompetitionDropdown';
import { Competition } from '@/lib/types/Country&Competition';
import BaseModal from './BaseModal';
import GradientButton from '../GradientButton';

interface AddCareerStintModalProps {
  open: boolean;
  onClose: () => void;
  saveId: string;
  onSuccess: () => void;
}

export const AddCareerStintModal: React.FC<AddCareerStintModalProps> = ({
  open,
  onClose,
  saveId,
  onSuccess,
}) => {
  const { user } = useAuth();
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

    const response = await fetch(`/api/saves/${saveId}/career`, {
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

    // Reset form
    setForm({
      teamId: '',
      leagueId: '',
      startDate: '',
      endDate: '',
    });
    setCountryCode(null);
    
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setForm({
      teamId: '',
      leagueId: '',
      startDate: '',
      endDate: '',
    });
    setCountryCode(null);
    onClose();
  };

  return (
    <BaseModal open={open} onClose={handleClose} title="Add Career Stint" maxWidth="max-w-md">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Team</label>
          <TeamSearchDropdown
            onTeamSelect={(team: Team) => {
              setForm((prev) => ({ ...prev, teamId: String(team.id) })); 
              setCountryCode(team.countryCode);
            }}
          />
        </div>
        
        <div>
          <input
            hidden
            name="teamId"
            value={form.teamId}
            onChange={handleChange}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white"
            placeholder="Enter team ID"
            required
          />
        </div>
        
        {form.teamId && countryCode ? (
          <div>
            <label className="block text-sm mb-2 font-medium text-gray-200">League</label>
            <CompetitionDropdown
              onChange={(competition: Competition) => setForm((prev) => ({ ...prev, leagueId: String(competition.id) }))}
              type='League'
              country={countryCode}
              value={form.leagueId}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-3 border border-[var(--color-primary)]">
            Select a team to view available leagues
          </div>
        )}
        
        <div>
          <input
            hidden
            name="leagueId"
            value={form.leagueId}
            onChange={handleChange}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white"
            placeholder="Enter league ID"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">End Date (optional)</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
          />
        </div>

        <GradientButton
          type="submit"
          width="full"
          size="lg"
          disabled={!form.teamId || !form.startDate}
        >
          Save Career Stint
        </GradientButton>
      </form>
    </BaseModal>
  );
};

export default AddCareerStintModal;

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import CompetitionDropdown from '@/app/components/dropdowns/CompetitionDropdown';
import { FirebaseCompetition } from '@/lib/types/firebase/Country&Competition';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';
import { FullCareerStint } from '@/lib/types/prisma/Career';
import { Team } from '@/lib/types/prisma/Team';
import { FullDetailsSave } from '@/lib/types/prisma/Save';

interface AddCareerStintModalProps {
  open: boolean;
  onClose: () => void;
  saveDetails: FullDetailsSave;
  onSuccess: () => void;
  editingStint?: FullCareerStint | null;
}

export const AddCareerStintModal: React.FC<AddCareerStintModalProps> = ({
  open,
  onClose,
  saveDetails,
  onSuccess,
  editingStint,
}) => {
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    teamId: '',
    leagueId: '',
    startDate: '',
    endDate: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (editingStint && open) {
      setForm({
        teamId: editingStint.team?.id.toString() || '',
        leagueId: saveDetails.currentLeague?.id.toString() || '',
        startDate: editingStint.startDate,
        endDate: editingStint.endDate || '',
      });
      setCountryCode(editingStint.team?.countryCode || null);
      setSelectedTeam(editingStint.team);
    }
  }, [editingStint, open, saveDetails.currentLeague]);

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
    
    setSaving(true);

    try {
      const token = await user.getIdToken();
      if (!token) {
        console.error('User is not authenticated');
        return;
      }

      const isEditing = !!editingStint;
      const url = isEditing 
        ? `/api/saves/${saveDetails.id}/career/${editingStint.id}` 
        : `/api/saves/${saveDetails.id}/career`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          teamId: form.teamId,
          startDate: form.startDate,
          endDate: form.endDate || null,
          leagueId: form.leagueId,
          isNational: selectedTeam?.national || false,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to ${isEditing ? 'update' : 'save'} career stint`);
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
      setSelectedTeam(null);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving career stint:', error);
    } finally {
      setSaving(false);
    }
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
    setSelectedTeam(null);
    onClose();
  };

  return (
    <BaseModal open={open} onClose={handleClose} title={editingStint ? "Edit Career Stint" : "Add Career Stint"} maxWidth="max-w-md">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Team</label>
          <TeamSearchDropdown
            onTeamSelect={(team: Team) => {
              setForm((prev) => ({ ...prev, teamId: String(team.id) })); 
              setCountryCode(team.countryCode);
              setSelectedTeam(team);
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
              onChange={(competition: FirebaseCompetition) => setForm((prev) => ({ ...prev, leagueId: String(competition.id) }))}
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

        <LoadingButton
          type="submit"
          width="full"
          size="lg"
          disabled={!form.teamId || !form.startDate}
          isLoading={saving}
          loadingText={editingStint ? 'Updating Career Stint...' : 'Saving Career Stint...'}
        >
          {editingStint ? 'Update Career Stint' : 'Save Career Stint'}
        </LoadingButton>
      </form>
    </BaseModal>
  );
};

export default AddCareerStintModal;

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import CompetitionDropdown from '@/app/components/dropdowns/CompetitionDropdown';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';
import { FullCareerStint } from '@/lib/types/prisma/Career';
import { Team } from '@/lib/types/prisma/Team';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { CompetitionGroup } from '@/lib/types/prisma/Competitions';

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
      alert('You must be logged in to perform this action.');
      return;
    }
    
    setSaving(true);

    try {
      const token = await user.getIdToken();
      if (!token) {
        console.error('User is not authenticated');
        alert('You must be logged in to perform this action.');
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
        alert(`Failed to ${isEditing ? 'update' : 'save'} career stint`);
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
    } 
    catch (error) {
      console.error('Error saving career stint:', error);
      alert('An error occurred while saving the career stint. Please try again.');
    } 
    finally {
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
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

        {/* Team search */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Team</label>
          <TeamSearchDropdown
            onTeamSelect={(team: Team) => {
              setForm((prev) => ({ ...prev, teamId: String(team.id) }));
              setCountryCode(team.countryCode);
              setSelectedTeam(team);
            }}
          />
          <input hidden name="teamId" value={form.teamId} onChange={handleChange} required />
        </div>

        {/* League */}
        {form.teamId && countryCode ? (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">League</label>
            <CompetitionDropdown
              onChange={(competition: CompetitionGroup) => setForm((prev) => ({ ...prev, leagueId: String(competition.id) }))}
              type="DOMESTIC_LEAGUE"
              country={countryCode}
              value={form.leagueId}
            />
            <input hidden name="leagueId" value={form.leagueId} onChange={handleChange} />
          </div>
        ) : (
          <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
            Select a team to view available leagues
          </p>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">End Date <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
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

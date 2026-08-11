'use client';

import { Trophy } from '@/lib/types/prisma/Trophy';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { Team } from '@/lib/types/prisma/Team';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { CompetitionGroup } from '@/lib/types/prisma/Competitions';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';
import CompetitionWithWorldDropdown from '../dropdowns/CompetitionWithWorldDropdown';
import { FullCareerStint } from '@/lib/types/prisma/Career';

type Props = {
  open: boolean;
  onClose: () => void;
  saveId: string;
  saveDetails: FullDetailsSave;
  trophy: Trophy;
  onSuccess: () => void;
};

function getTeamCategorySuffix(isFemale: boolean | null | undefined): string {
  return isFemale === true ? ' (Women)' : '';
}

export default function EditTrophyModal({ open, onClose, saveId, saveDetails, trophy, onSuccess }: Props) {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dateWon, setDateWon] = useState('');
  const [competition, setCompetition] = useState<CompetitionGroup | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-season inference if missing
  function getSeasonFromDate(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return month > 6
      ? `${year}/${(year + 1).toString().slice(-2)}`
      : `${year - 1}/${year.toString().slice(-2)}`;
  }

  async function fetchTeamData(teamId: number) {
    return fetch(`/api/teams/${teamId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch team data');
        }
        return response.json();
      }) as Promise<Team>;
  }

  async function fetchCompetition(competitionId: number) {
    return fetch(`/api/competitions/${competitionId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch competition data');
        }
        return response.json();
      }) as Promise<CompetitionGroup>;
  }

  // Populate form when trophy data changes
  useEffect(() => {
    const loadTrophyData = async () => {
      if (!trophy || !open) return;
      
      // Set selected team
      const teamData = await fetchTeamData(trophy.teamId);
      setSelectedTeam(teamData);

      // Set competition
      const competitionData = await fetchCompetition(trophy.competitionGroupId);
      setCompetition(competitionData);

      // Set date - convert from season back to date
      // For now, use a default date in the season
      // Default to August 1st of the season
      const seasonYear = parseInt(trophy.season.split('/')[0]);
      setDateWon(`${seasonYear}-08-01`);
    };

    loadTrophyData();
  }, [trophy, open]);

  const handleSubmit = async () => {
    if (!selectedTeam || !dateWon || !competition) return;
    setSaving(true);

    try {
      if (!user) return;
      const userToken = await user.getIdToken();

      const season = getSeasonFromDate(dateWon);

      const response = await fetch(`/api/saves/${saveId}/trophies/${trophy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          season: season,
          competitionId: competition.id,
          countryCode: competition.countryCode.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update trophy');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating trophy:', error);
    } finally {
      setSaving(false);
    }
  };

  async function selectTeam(teamId: string) {
    if (!teamId) {
      setSelectedTeam(null);
      setCompetition(null);
      return;
    }

    // Set selected team
    const teamData = await fetchTeamData(parseInt(teamId));
    setSelectedTeam(teamData);
    
    // Reset competition when team changes    
    setCompetition(null);
  }

  if (!open) return null;

  return (
    <BaseModal open={open} onClose={onClose} title="Edit Trophy" maxWidth="max-w-md">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

        {/* Team */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Team</label>
          {saveDetails.careerStints && saveDetails.careerStints.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={async (e) => selectTeam(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
              disabled={saving}
            >
              <option value="">Select a team</option>
              {saveDetails.careerStints
                .filter((stint: FullCareerStint, index, self) =>
                  index === self.findIndex((s: FullCareerStint) => s.teamId === stint.teamId)
                )
                .map((stint: FullCareerStint) => (
                  <option key={stint.teamId} value={stint.teamId}>
                    {stint.team.name}{getTeamCategorySuffix(stint.team.isFemale)}
                  </option>
                ))}
            </select>
          ) : (
            <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              No career stints found. Add career stints first.
            </p>
          )}
        </div>

        {/* Competition */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Competition</label>
          {selectedTeam ? (
            <CompetitionWithWorldDropdown
              country={selectedTeam.countryCode}
              isFemale={selectedTeam.isFemale}
              value={competition?.id ? String(competition.id) : ""}
              onChange={(comp: CompetitionGroup) => setCompetition(comp)}
              placeholder="Select competition"
            />
          ) : (
            <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              Select a team to choose a competition
            </p>
          )}
          {competition && (
            <p className="mt-1.5 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm font-semibold text-white">
              {competition.name}
            </p>
          )}
        </div>

        {/* Date Won */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Date Won</label>
          <input
            type="date"
            value={dateWon}
            onChange={(e) => setDateWon(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            required
            disabled={saving}
          />
        </div>

        <LoadingButton
          type="submit"
          width="full"
          size="lg"
          disabled={!selectedTeam || !competition || !dateWon}
          isLoading={saving}
          loadingText="Updating Trophy..."
        >
          Update Trophy
        </LoadingButton>
      </form>
    </BaseModal>
  );
}

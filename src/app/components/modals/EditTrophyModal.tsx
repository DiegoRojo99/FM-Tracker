'use client';

import { Trophy } from '@/lib/types/prisma/Trophy';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { FirebaseCompetition } from '@/lib/types/firebase/Country&Competition';
import { Team } from '@/lib/types/prisma/Team';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';
import CompetitionWithWorldDropdown from '../dropdowns/CompetitionWithWorldDropdown';

type Props = {
  open: boolean;
  onClose: () => void;
  saveId: string;
  saveDetails: FullDetailsSave;
  trophy: Trophy;
  onSuccess: () => void;
};

export default function EditTrophyModal({ open, onClose, saveId, saveDetails, trophy, onSuccess }: Props) {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dateWon, setDateWon] = useState('');
  const [competition, setCompetition] = useState<FirebaseCompetition | null>(null);
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
      }) as Promise<FirebaseCompetition>;
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
          teamId: selectedTeam.id.toString(),
          season: season,
          competitionId: competition.id.toString(),
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
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {/* Team Selection */}
        <div>
          <label className="block text-sm mb-3 font-medium text-gray-200">Team</label>
          {saveDetails.careerStints && saveDetails.careerStints.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={async (e) => {
                const teamId = e.target.value;
                await selectTeam(teamId);
              }}
              className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
              disabled={saving}
            >
              <option value="">Select a team...</option>
              {saveDetails.careerStints
                ?.filter((stint, index, self) => 
                  index === self.findIndex(s => s.teamId === stint.teamId)
                )
                .map((stint) => (
                  <option key={stint.teamId} value={stint.teamId}>
                    {stint.teamName}
                  </option>
                ))}
            </select>
          ) : (
            <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-4 border border-[var(--color-primary)] text-center">
              <div className="text-gray-500 mb-1">⚽</div>
              No career stints found. Add career stints first to select teams.
            </div>
          )}
        </div>

        {/* Competition Selection - filtered by team's country or international */}
        <div>
          <label className="block text-sm mb-3 font-medium text-gray-200">Competition</label>
          {selectedTeam ? (
            <div>
              <CompetitionWithWorldDropdown
                country={selectedTeam.countryCode}
                value={competition?.id ? String(competition.id) : ""}
                onChange={(comp: FirebaseCompetition) => setCompetition(comp)}
                placeholder="Select competition"
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Please select a team first to filter competitions.
            </div>
          )}
        </div>

        {/* Date Won */}
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Date Won</label>
          <input
            type="date"
            value={dateWon}
            onChange={(e) => setDateWon(e.target.value)}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
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

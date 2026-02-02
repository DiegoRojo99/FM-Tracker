'use client';

import { useState } from 'react';
import FootballLoader from '@/app/components/FootBallLoader';
import { useAuth } from '@/app/components/AuthProvider';
import { CompetitionGroup } from '@/lib/types/prisma/Competitions';
import { Team } from '@/lib/types/prisma/Team';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { Trophy } from '@/lib/types/prisma/Trophy';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';
import CompetitionWithWorldDropdown from '../dropdowns/CompetitionWithWorldDropdown';
import Image from 'next/image';

type Props = {
  open: boolean;
  onClose: () => void;
  saveId: string;
  saveDetails: FullDetailsSave;
  onSuccess: (trophy: Trophy) => void;
};

export default function AddTrophyModal({ open, onClose, saveId, saveDetails, onSuccess }: Props) {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dateWon, setDateWon] = useState('');
  const [competition, setCompetition] = useState<CompetitionGroup | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTeam || !dateWon || !competition) return;
    setSaving(true);

    if (!user) return;
    const userToken = await user.getIdToken();

    await fetch(`/api/saves/${saveId}/trophies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        teamId: selectedTeam.id.toString(),
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
      setSaving(false);
      onClose();
    });
  }

  if (!open) return <></>;
  else if (saving) return <FootballLoader />;

  return (
    <BaseModal open={open} onClose={onClose} title="Add Trophy" maxWidth="max-w-md">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {/* Competition Selection - filtered by team's country or international */}
        <div>
          <label className="block text-sm mb-3 font-medium text-gray-200">Competition</label>
          {selectedTeam ? (
            <div>
              <CompetitionWithWorldDropdown
                country={selectedTeam.countryCode}
                value={competition?.id ? String(competition.id) : ""}
                onChange={(comp: CompetitionGroup) => setCompetition(comp)}
                placeholder="Select competition"
              />
            </div>
          ) : (
            <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-4 border border-[var(--color-primary)] text-center">
              <div className="text-gray-500 mb-1">⚽</div>
              Select a team to choose a competition
            </div>
          )}
          {competition && (
            <div className="mt-3 p-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-lg border border-[var(--color-highlight)]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-white font-semibold">{competition.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Team Selection - from save's career stints */}
        <div>
          <label className="block text-sm mb-3 font-medium text-gray-200">Team</label>
          {saveDetails.careerStints && saveDetails.careerStints.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={(e) => {
                const teamId = e.target.value;
                if (teamId) {
                  const careerStint = saveDetails.careerStints?.find(stint => stint.teamId === teamId);
                  if (careerStint) {
                    // Create a Team object from career stint data
                    const team: Team = {
                      id: parseInt(careerStint.teamId),
                      name: careerStint.teamName || '',
                      logo: careerStint.teamLogo || '',
                      countryCode: careerStint.countryCode,
                      national: careerStint.isNational || false,
                      lat: null, 
                      lng: null ,
                      isFemale: null,
                    };
                    setSelectedTeam(team);
                    setCompetition(null); // Reset competition when team changes
                  }
                } else {
                  setSelectedTeam(null);
                  setCompetition(null);
                }
              }}
              className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            >
              <option value="" className="bg-[var(--color-darker)] text-white">-- Select a team --</option>
              {/* Get unique teams from career stints */}
              {Array.from(new Map(saveDetails.careerStints.map(stint => [stint.teamId, stint])).values()).map((stint) => (
                <option key={stint.teamId} value={stint.teamId} className="bg-[var(--color-darker)] text-white">
                  {stint.teamName}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-4 border border-[var(--color-primary)] text-center">
              <div className="text-gray-500 mb-1">👥</div>
              No teams found in your career history. Add a career stint first.
            </div>
          )}
          {selectedTeam && (
            <div className="mt-3 p-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-lg border border-[var(--color-highlight)] flex items-center space-x-3">
              <Image 
                src={selectedTeam.logo} 
                alt={selectedTeam.name} 
                width={32} 
                height={32} 
                className="h-8 w-8 object-contain rounded-full bg-white p-1" 
                unoptimized 
              />
              <span className="text-white font-semibold">{selectedTeam.name}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Won Date</label>
          <input
            type="date"
            name="dateWon"
            value={dateWon}
            onChange={(e) => setDateWon(e.target.value)}
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            required
          />
        </div>

        <LoadingButton
          type="submit"
          width="full"
          size="lg"
          disabled={!selectedTeam || !competition || !dateWon}
          isLoading={saving}
          loadingText="Saving Trophy..."
        >
          Save Trophy
        </LoadingButton>
      </form>
    </BaseModal>
  )
}

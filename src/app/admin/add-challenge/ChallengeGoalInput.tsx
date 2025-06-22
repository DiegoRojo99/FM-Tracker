'use client';

import TeamSearchDropdown from '@/app/components/algolia/TeamSearchDropdown';
import CompetitionSearchDropdown from '@/app/components/algolia/CompetitionSearchDropdown';
import CountryDropdown from '@/app/components/CountryDropdown';
import { ChallengeGoalInputData } from '@/lib/types/Challenge';

export default function ChallengeGoalInput({
  data,
  onChange,
}: {
  data: ChallengeGoalInputData;
  onChange: (updated: ChallengeGoalInputData) => void;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-2 bg-white/80 text-black relative">
      <input
        className="w-full px-3 py-2 border rounded bg-white placeholder-gray-400"
        placeholder="Goal description"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
      />

      <div className="flex items-center gap-2">
        <CompetitionSearchDropdown
          onCompetitionSelect={(competition) =>
            onChange({
              ...data,
              competitionId: competition?.id !== undefined ? String(competition.id) : undefined,
            })
          }
        />
        {data.competitionId && (
          <button onClick={() => onChange({ ...data, competitionId: undefined })} className="text-xs text-red-500">
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TeamSearchDropdown
          onTeamSelect={(team) =>
            onChange({
              ...data,
              teamId: team?.id !== undefined ? String(team.id) : undefined,
            })
          }
        />
        {data.teamId && (
          <button onClick={() => onChange({ ...data, teamId: undefined })} className="text-xs text-red-500">
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <CountryDropdown
          value={data.countryId}
          onChange={(countryId) => onChange({ ...data, countryId })}
        />
        {data.countryId && (
          <button onClick={() => onChange({ ...data, countryId: undefined })} className="text-xs text-red-500">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

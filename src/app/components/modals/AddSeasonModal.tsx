import React, { useState } from "react";
import { CUP_ROUNDS, CupRound, SeasonInput, CupResultInput } from "@/lib/types/Season";
import CompetitionDropdown from "../dropdowns/CompetitionDropdown";
import CompetitionWithWorldDropdown from "../dropdowns/CompetitionWithWorldDropdown";
import { Competition } from "@/lib/types/Country&Competition";
import { SaveWithChildren } from "@/lib/types/Save";
import BaseModal from "./BaseModal";
import LoadingButton from "../LoadingButton";
import { Team } from "@/lib/types/Team";
import Image from "next/image";

type AddSeasonModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (season: SeasonInput) => void;
  saveDetails: SaveWithChildren;
};

export const AddSeasonModal: React.FC<AddSeasonModalProps> = ({
  open,
  onClose,
  onSave,
  saveDetails,
}) => {
  const [season, setSeason] = useState('');
  const [leaguePosition, setLeaguePosition] = useState<number | "">("");
  const [promoted, setPromoted] = useState(false);
  const [relegated, setRelegated] = useState(false);
  const [cupResults, setCupResults] = useState<CupResultInput[]>([]);
  const [saving, setSaving] = useState(false);
  
  // New state for team and league selection
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<Competition | null>(null);

  const handleAddCup = () => {
    setCupResults([
      ...cupResults,
      { competitionId: "", countryCode: "", reachedRound: CUP_ROUNDS[0] },
    ]);
  };

  const handleCupChange = (
    idx: number,
    field: "reachedRound" | "competition",
    value: Competition | CupRound | string
  ) => {
    const updated = [...cupResults];
    if (field === "reachedRound") {
      updated[idx][field] = value as CupRound;
    } 
    else if (field === "competition") {
      const competition = value as Competition;
      updated[idx]["competitionId"] = String(competition.id);
      updated[idx]["countryCode"] = competition.countryCode;
    }
    setCupResults(updated);
  };

  const handleRemoveCup = (idx: number) => {
    setCupResults(cupResults.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedTeam || !selectedLeague) {
      alert("Please select both a team and a league.");
      return;
    }
    if (!season || leaguePosition === "") {
      alert("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const seasonResult: SeasonInput = {
        season,
        teamId: String(selectedTeam.id),
        leagueId: String(selectedLeague.id),
        leaguePosition: Number(leaguePosition),
        promoted,
        relegated,
        cupResults,
      };

      await onSave(seasonResult);
      onClose();
    } catch (error) {
      console.error('Error saving season:', error);
      alert('Failed to save season. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  
  return (
    <BaseModal open={open} onClose={onClose} title="Add Season">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Season (e.g. 2023/24)</label>
          <input
            type="text"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="2023/24"
            className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            pattern="^\d{4}/\d{2}$"
            title="Season must be in the format YYYY/YY (e.g., 2023/24)"
            required
          />
        </div>

        {/* Team Selection - from save's career stints */}
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-200">Team</label>
          {saveDetails.career && saveDetails.career.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={(e) => {
                const teamId = e.target.value;
                if (teamId) {
                  const careerStint = saveDetails.career?.find(stint => stint.teamId === teamId);
                  if (careerStint) {
                    // Create a Team object from career stint data
                    const team: Team = {
                      id: parseInt(careerStint.teamId),
                      name: careerStint.teamName || '',
                      logo: careerStint.teamLogo || '',
                      countryCode: careerStint.countryCode,
                      national: careerStint.isNational || false,
                      leagueId: parseInt(careerStint.leagueId),
                      season: 2024, // Default season as number
                      coordinates: { lat: null, lng: null }
                    };
                    setSelectedTeam(team);
                    setSelectedLeague(null); // Reset league when team changes
                  }
                } else {
                  setSelectedTeam(null);
                  setSelectedLeague(null);
                }
              }}
              className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            >
              <option value="">-- Select a team --</option>
              {/* Get unique teams from career stints */}
              {Array.from(new Map(saveDetails.career.map(stint => [stint.teamId, stint])).values()).map((stint) => (
                <option key={stint.teamId} value={stint.teamId}>
                  {stint.teamName}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-3 border border-[var(--color-primary)]">
              No teams found in your career history. Add a career stint first.
            </div>
          )}
          {selectedTeam && (
            <div className="mt-2 p-3 bg-[var(--color-darker)] rounded-lg border border-[var(--color-primary)] flex items-center space-x-3">
              <Image 
                src={selectedTeam.logo} 
                alt={selectedTeam.name} 
                width={32} 
                height={32} 
                className="h-8 w-8 object-contain" 
                unoptimized 
              />
              <span className="text-white font-semibold">{selectedTeam.name}</span>
            </div>
          )}
        </div>

        {/* League Selection - only show if team is selected */}
        {selectedTeam ? (
          <div>
            <label className="block text-sm mb-2 font-medium text-gray-200">League</label>
            <CompetitionDropdown
              type="League"
              country={selectedTeam.countryCode}
              value={selectedLeague?.id ? String(selectedLeague.id) : ""}
              onChange={(competition: Competition) => setSelectedLeague(competition)}
            />
            {selectedLeague && (
              <div className="mt-2 p-3 bg-[var(--color-darker)] rounded-lg border border-[var(--color-primary)]">
                <span className="text-white font-semibold">{selectedLeague.name}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-3 border border-[var(--color-primary)]">
            Select a team to choose a league
          </div>
        )}

        {selectedLeague ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 font-medium text-gray-200">League Position</label>
              <input
                type="number"
                min={1}
                value={leaguePosition}
                onChange={(e) =>
                  setLeaguePosition(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
                required
              />
            </div>
            
            {/* Checkboxes - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <label className="flex items-center space-x-2 text-gray-200">
                <input
                  type="checkbox"
                  checked={promoted}
                  onChange={(e) => setPromoted(e.target.checked)}
                  className="rounded border-[var(--color-primary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <span>Promoted</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-200">
                <input
                  type="checkbox"
                  checked={relegated}
                  onChange={(e) => setRelegated(e.target.checked)}
                  className="rounded border-[var(--color-primary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <span>Relegated</span>
              </label>
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="font-semibold text-lg mb-3 text-white">Cup Results</h3>
          {!selectedTeam && cupResults.length === 0 && (
            <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-4 border border-[var(--color-primary)] text-center mb-3">
              <div className="text-gray-500 mb-1">🏆</div>
              Select a team to add cup results
            </div>
          )}
          <div className="space-y-3">
          {cupResults.map((cup, idx) => (
            <div key={idx} className="border-2 border-[var(--color-primary)] rounded-lg p-4 bg-[var(--color-darker)]">
              <label className="block text-sm mb-2 font-medium text-gray-200">Cup</label>
              {selectedTeam ? (
                <CompetitionWithWorldDropdown
                  type="Cup"
                  country={selectedTeam.countryCode}
                  value={cup.competitionId}
                  onChange={(value) => handleCupChange(idx, "competition", value)}
                  placeholder="Select cup competition"
                />
              ) : (
                <div className="text-sm text-gray-400 bg-[var(--color-darker)] rounded-lg p-3 border border-[var(--color-primary)] text-center">
                  Select a team first to choose cup competitions
                </div>
              )}
              <label className="block text-sm mt-4 mb-2 font-medium text-gray-200">Round Reached</label>
              <select
                value={cup.reachedRound}
                onChange={(e) => handleCupChange(idx, "reachedRound", e.target.value)}
                className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
              >
                {CUP_ROUNDS.map(round => (
                  <option key={round} value={round}>{round}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRemoveCup(idx)}
                className="text-red-400 hover:text-red-300 text-sm mt-3 transition-colors duration-200"
              >
                Remove
              </button>
            </div>
          ))}
          </div>
          <button
            type="button"
            onClick={handleAddCup}
            disabled={!selectedTeam}
            className={`text-sm mt-3 transition-colors duration-200 ${
              selectedTeam 
                ? 'text-[var(--color-accent)] hover:text-[var(--color-highlight)]' 
                : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            + Add Cup Result
          </button>
        </div>

        <LoadingButton
          type="submit"
          width="full"
          size="lg"
          disabled={!season || !selectedTeam || !selectedLeague || leaguePosition === "" || saving}
          isLoading={saving}
          loadingText="Saving Season..."
        >
          Save Season
        </LoadingButton>
      </form>
    </BaseModal>
  );
};

export default AddSeasonModal;
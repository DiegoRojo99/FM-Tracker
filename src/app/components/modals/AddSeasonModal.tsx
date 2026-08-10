import React, { useEffect, useState } from "react";
import { CUP_ROUNDS, CupRound, SeasonInput, CupResultInput, SeasonSummary } from "@/lib/types/prisma/Season";
import CompetitionDropdown from "../dropdowns/CompetitionDropdown";
import CompetitionWithWorldDropdown from "../dropdowns/CompetitionWithWorldDropdown";
import { FullDetailsSave } from "@/lib/types/prisma/Save";
import BaseModal from "./BaseModal";
import LoadingButton from "../LoadingButton";
import { Team } from "@/lib/types/prisma/Team";
import { CompetitionGroup } from '@/lib/types/prisma/Competitions';
import Image from "next/image";
import { FullCareerStint } from "@/lib/types/prisma/Career";

type AddSeasonModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (season: SeasonInput) => Promise<boolean>;
  saveDetails: FullDetailsSave;
  initialSeason?: SeasonSummary | null;
  title?: string;
  submitLabel?: string;
};

/**
 * Pull the next season from the save details.
 * @param saveDetails The save details containing existing seasons.
 * @returns The next season in the format "YYYY/YY" or an empty string if not found.
 */
function pullNextSeasonFromSave(saveDetails: FullDetailsSave): string {
  if (!saveDetails || !saveDetails.seasons?.length) {
    return "";
  }

  const lastSeason = saveDetails.seasons[saveDetails.seasons.length - 1];
  const [year, nextYear] = lastSeason.season.split("/").map(Number);
  return `${year + 1}/${nextYear + 1}`;
}

export const AddSeasonModal: React.FC<AddSeasonModalProps> = ({
  open,
  onClose,
  onSave,
  saveDetails,
  initialSeason = null,
  title = "Add Season",
  submitLabel = "Save Season",
}) => {
  const [season, setSeason] = useState<string>(initialSeason?.season ?? pullNextSeasonFromSave(saveDetails));
  const [leaguePosition, setLeaguePosition] = useState<number | "">("");
  const [promoted, setPromoted] = useState(false);
  const [relegated, setRelegated] = useState(false);
  const [cupResults, setCupResults] = useState<CupResultInput[]>([]);
  const [saving, setSaving] = useState(false);
  const uniqueTeams = getUniqueTeams();
  
  // New state for team and league selection
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(initialSeason?.team ?? null);
  const [selectedLeague, setSelectedLeague] = useState<CompetitionGroup | null>(initialSeason?.leagueResult?.competition ?? null);

  useEffect(() => {
    if (!open) return;

    if (initialSeason) {
      setSeason(initialSeason.season);
      setSelectedTeam(initialSeason.team);
      setSelectedLeague(initialSeason.leagueResult?.competition ?? null);
      setLeaguePosition(initialSeason.leagueResult?.position ?? "");
      setPromoted(initialSeason.leagueResult?.promoted ?? false);
      setRelegated(initialSeason.leagueResult?.relegated ?? false);
      setCupResults(
        initialSeason.cupResults.map((cup) => ({
          competitionId: String(cup.competitionId),
          countryCode: cup.competition.countryCode,
          reachedRound: cup.reachedRound as CupRound,
        }))
      );
      return;
    }

    setSeason(pullNextSeasonFromSave(saveDetails));
    setLeaguePosition("");
    setPromoted(false);
    setRelegated(false);
    setCupResults([]);
    setSelectedTeam(null);
    setSelectedLeague(null);
  }, [open, initialSeason, saveDetails]);

  const handleAddCup = () => {
    setCupResults([
      ...cupResults,
      { competitionId: "", countryCode: "", reachedRound: CUP_ROUNDS[0] },
    ]);
  };

  const handleCupChange = (
    idx: number,
    field: "reachedRound" | "competition",
    value: CompetitionGroup | CupRound | string
  ) => {
    const updated = [...cupResults];
    if (field === "reachedRound") {
      updated[idx][field] = value as CupRound;
    } 
    else if (field === "competition") {
      const competition = value as CompetitionGroup;
      updated[idx]["competitionId"] = String(competition.id);
      updated[idx]["countryCode"] = competition.countryCode;
    }
    setCupResults(updated);
  };

  const handleRemoveCup = (idx: number) => {
    setCupResults(cupResults.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedTeam) {
      alert("Please select a team.");
      return;
    }
    if (!season) {
      alert("Please fill in all required fields.");
      return;
    }
    if ((selectedLeague && leaguePosition === "") || (!selectedLeague && leaguePosition !== "")) {
      alert("League and league position must be provided together.");
      return;
    }

    const hasInvalidCup = cupResults.some((cup) => !cup.competitionId || Number(cup.competitionId) <= 0);
    if (hasInvalidCup) {
      alert("Please select a valid competition for every cup result.");
      return;
    }

    setSaving(true);
    try {
      const seasonResult: SeasonInput = {
        season,
        teamId: String(selectedTeam.id),
        cupResults,
      };

      if (selectedLeague && leaguePosition !== "") {
        seasonResult.leagueId = String(selectedLeague.id);
        seasonResult.leaguePosition = Number(leaguePosition);
        seasonResult.promoted = promoted;
        seasonResult.relegated = relegated;
      }

      const didSave = await onSave(seasonResult);
      if (didSave) onClose();
    } catch (error) {
      console.error('Error saving season:', error);
      alert('Failed to save season. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  {/* Get unique teams from career stints */}
  function getUniqueTeams(): Team[] {
    if (!saveDetails.careerStints) return [];
    const uniqueMap = new Map<number, Team>();
    saveDetails.careerStints.forEach((stint) => {
      if (!uniqueMap.has(stint.teamId)) {
        uniqueMap.set(stint.teamId, stint.team);
      }
    });
    return Array.from(uniqueMap.values());
  }

  if (!open) return null;
  
  return (
    <BaseModal open={open} onClose={onClose} title={title}>
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
          {saveDetails.careerStints && saveDetails.careerStints.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={(e) => {
                const teamId = e.target.value;
                console.log("Selected team ID:", teamId);
                if (teamId) {
                  const careerStint: FullCareerStint | undefined = saveDetails.careerStints.find((stint: FullCareerStint) => stint.teamId === Number(teamId));
                  console.log("Found career stint for selected team:", careerStint);
                  if (careerStint) {
                    const team: Team = careerStint.team;
                    console.log("Setting selected team to:", team);
                    setSelectedTeam(team);
                    setSelectedLeague(null); // Reset league when team changes
                  }
                } 
                else {
                  setSelectedTeam(null);
                  setSelectedLeague(null);
                }
              }}
              className="w-full border-2 border-[var(--color-primary)] rounded-lg p-3 bg-[var(--color-darker)] text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            >
              <option value="">-- Select a team --</option>
              {uniqueTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
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

        {/* League Selection - optional, only show if team is selected */}
        {selectedTeam ? (
          <div>
            <label className="block text-sm mb-2 font-medium text-gray-200">League (optional)</label>
            <CompetitionDropdown
              type="DOMESTIC_LEAGUE"
              country={selectedTeam.countryCode}
              value={selectedLeague?.id ? String(selectedLeague.id) : ""}
              onChange={(competition: CompetitionGroup) => {
                setSelectedLeague(competition);
                // Auto-clear promoted if user switches to a top-flight league.
                if (competition.tier === 1) setPromoted(false);
              }}
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
              <label className={`flex items-center space-x-2 ${selectedLeague?.tier === 1 ? 'cursor-not-allowed opacity-40' : 'text-gray-200'}`}>
                <input
                  type="checkbox"
                  checked={promoted}
                  disabled={selectedLeague?.tier === 1}
                  onChange={(e) => setPromoted(e.target.checked)}
                  className="rounded border-[var(--color-primary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] disabled:cursor-not-allowed"
                />
                <span>Promoted</span>
                {selectedLeague?.tier === 1 && (
                  <span className="ml-1 text-xs text-[var(--color-text-muted)]">(top flight)</span>
                )}
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
                  type="DOMESTIC_CUP"
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
          disabled={!season || !selectedTeam || saving}
          isLoading={saving}
          loadingText={initialSeason ? "Updating Season..." : "Saving Season..."}
        >
          {submitLabel}
        </LoadingButton>
      </form>
    </BaseModal>
  );
};

export default AddSeasonModal;
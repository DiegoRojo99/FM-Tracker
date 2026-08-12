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
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

        {/* Season */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Season</label>
          <input
            type="text"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="2023/24"
            className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            pattern="^\d{4}/\d{2}$"
            title="Season must be in the format YYYY/YY (e.g., 2023/24)"
            required
          />
        </div>

        {/* Team */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Team</label>
          {saveDetails.careerStints && saveDetails.careerStints.length > 0 ? (
            <select
              value={selectedTeam ? selectedTeam.id : ''}
              onChange={(e) => {
                const teamId = e.target.value;
                if (teamId) {
                  const careerStint: FullCareerStint | undefined = saveDetails.careerStints.find((stint: FullCareerStint) => stint.teamId === Number(teamId));
                  if (careerStint) {
                    setSelectedTeam(careerStint.team);
                    setSelectedLeague(null);
                    setCupResults([]);
                  }
                } else {
                  setSelectedTeam(null);
                  setSelectedLeague(null);
                  setCupResults([]);
                }
              }}
              className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Select a team</option>
              {uniqueTeams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              No teams found. Add a career stint first.
            </p>
          )}
          {selectedTeam && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2">
              <Image src={selectedTeam.logo} alt={selectedTeam.name} width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
              <span className="text-sm font-semibold text-white">{selectedTeam.name}</span>
            </div>
          )}
        </div>

        {/* League */}
        {selectedTeam ? (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">League <span className="normal-case font-normal">(optional)</span></label>
            <CompetitionDropdown
              type="DOMESTIC_LEAGUE"
              country={selectedTeam.countryCode}
              isFemale={selectedTeam.isFemale === true ? true : false}
              value={selectedLeague?.id ? String(selectedLeague.id) : ""}
              onChange={(competition: CompetitionGroup) => {
                setSelectedLeague(competition);
                if (competition.tier === 1) setPromoted(false);
              }}
            />
            {selectedLeague && (
              <p className="mt-1.5 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm font-semibold text-white">
                {selectedLeague.name}
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
            Select a team to choose a league
          </p>
        )}

        {/* League position + checkboxes */}
        {selectedLeague && (
          <div className="space-y-4 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">League Position</label>
              <input
                type="number"
                min={1}
                value={leaguePosition}
                onChange={(e) => setLeaguePosition(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className={`flex cursor-pointer items-center gap-2 text-sm ${selectedLeague?.tier === 1 ? 'cursor-not-allowed opacity-40' : 'text-white'}`}>
                <input
                  type="checkbox"
                  checked={promoted}
                  disabled={selectedLeague?.tier === 1}
                  onChange={(e) => setPromoted(e.target.checked)}
                  className="rounded border-[var(--color-surface-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] disabled:cursor-not-allowed"
                />
                Promoted
                {selectedLeague?.tier === 1 && <span className="text-xs text-[var(--color-text-muted)]">(top flight)</span>}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={relegated}
                  onChange={(e) => setRelegated(e.target.checked)}
                  className="rounded border-[var(--color-surface-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                Relegated
              </label>
            </div>
          </div>
        )}

        {/* Cup results */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Cup Results</p>
          {!selectedTeam && cupResults.length === 0 && (
            <p className="mb-3 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              Select a team to add cup results
            </p>
          )}
          <div className="space-y-3">
            {cupResults.map((cup, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Competition</label>
                {selectedTeam ? (
                  <CompetitionWithWorldDropdown
                    type="DOMESTIC_CUP,CONTINENTAL_CLUB"
                    country={selectedTeam.countryCode}
                    isFemale={selectedTeam.isFemale === true ? true : false}
                    value={cup.competitionId}
                    onChange={(value) => handleCupChange(idx, "competition", value)}
                    placeholder="Select cup competition"
                  />
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">Select a team first</p>
                )}
                <label className="mb-1.5 mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Round Reached</label>
                <select
                  value={cup.reachedRound}
                  onChange={(e) => handleCupChange(idx, "reachedRound", e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
                >
                  {CUP_ROUNDS.map(round => (
                    <option key={round} value={round}>{round}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveCup(idx)}
                  className="mt-3 text-xs font-semibold text-rose-400 transition hover:text-rose-300"
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
            className="mt-3 text-sm font-semibold text-[var(--color-accent)] transition hover:text-[var(--color-highlight)] disabled:cursor-not-allowed disabled:opacity-40"
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
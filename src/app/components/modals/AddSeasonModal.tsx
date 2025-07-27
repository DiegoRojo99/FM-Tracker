import React, { useState } from "react";
import { CUP_ROUNDS, CupRound, SeasonInput, CupResultInput } from "@/lib/types/Season";
import CompetitionDropdown from "../dropdowns/CompetitionDropdown";
import { Competition } from "@/lib/types/Country&Competition";
import { SaveLeague, SaveTeam, SaveWithChildren } from "@/lib/types/Save";
import BaseModal from "./BaseModal";

type AddSeasonModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (season: SeasonInput) => void;
  saveDetails: SaveWithChildren;
};

function getNextSeason(season: string): string {
  if (!season) return "2023/24";
  const [year, nextYear] = season.split("/");
  if (!year || !nextYear) return "";
  const nextSeason = parseInt(nextYear) + 1;
  return `${parseInt(year) + 1}/${String(nextSeason).slice(-2)}`;
}

export const AddSeasonModal: React.FC<AddSeasonModalProps> = ({
  open,
  onClose,
  onSave,
  saveDetails,
}) => {
  const [season, setSeason] = useState(getNextSeason(saveDetails.season));
  const [leaguePosition, setLeaguePosition] = useState<number | "">("");
  const [promoted, setPromoted] = useState(false);
  const [relegated, setRelegated] = useState(false);
  const [cupResults, setCupResults] = useState<CupResultInput[]>([]);

  const team: SaveTeam | null = saveDetails.currentClub;
  const league: SaveLeague | null = saveDetails.currentLeague ?? null;

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

  const handleSave = () => {
    if (!team) return;
    if (!season || leaguePosition === "") {
      alert("Please fill in all required fields.");
      return;
    }

    const leagueId = league?.id ? String(league.id) : String(saveDetails.leagueId);

    const seasonResult: SeasonInput = {
      season,
      teamId: String(team.id),
      leagueId,
      leaguePosition: Number(leaguePosition),
      promoted,
      relegated,
      cupResults,
    };

    onSave(seasonResult);
    onClose();
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

        {/* Display team and league information */}
        <div className="bg-[var(--color-darker)] rounded-lg p-4 border border-[var(--color-primary)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-200">Team</label>
              <div className="text-white font-semibold"> {team?.name} </div>
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-200">League</label>
              <div className="text-white font-semibold"> {league?.name} </div>
            </div>
          </div>
        </div>

        {league?.id ? (
          <div className="grid grid-cols-2 gap-4">
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
              />
            </div>
            <div className="flex items-end space-x-4 pb-3">
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
          <div className="overflow-y-auto max-h-60 space-y-3">
          {cupResults.map((cup, idx) => (
            <div key={idx} className="border-2 border-[var(--color-primary)] rounded-lg p-4 bg-[var(--color-darker)]">
              <label className="block text-sm mb-2 font-medium text-gray-200">Cup</label>
              <CompetitionDropdown
                type="Cup"
                value={cup.competitionId}
                onChange={(value) => handleCupChange(idx, "competition", value)}
              />
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
            className="text-[var(--color-accent)] hover:text-[var(--color-highlight)] text-sm mt-3 transition-colors duration-200"
          >
            + Add Cup Result
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] text-white font-bold py-3 px-6 rounded-lg hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          disabled={!season || !team?.id}
        >
          Save Season
        </button>
      </form>
    </BaseModal>
  );
};

export default AddSeasonModal;
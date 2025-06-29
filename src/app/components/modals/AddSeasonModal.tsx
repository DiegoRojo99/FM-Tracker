import React, { useState } from "react";
import { CUP_ROUNDS, CupRound, SeasonInput, CupResultInput } from "@/lib/types/Season";
import CompetitionDropdown from "../dropdowns/CompetitionDropdown";
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Competition } from "@/lib/types/Country&Competition";
import { SaveLeague, SaveTeam, SaveWithChildren } from "@/lib/types/Save";

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
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto bg-black/70">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="w-full max-w-2xl max-h-[80vh] h-fit my-auto bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl relative">
          <button
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
          <Dialog.Title className="text-xl font-bold mb-4">Add Season</Dialog.Title>

          <form className="space-y-4 overflow-y-auto max-h-[70vh]" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div>
              <label className="block text-sm mb-1">Season (e.g. 2023/24)</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2023/24"
                className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                pattern="^\d{4}/\d{2}$"
                title="Season must be in the format YYYY/YY (e.g., 2023/24)"
                required
              />
            </div>

            {/* Display team and league information */}
            <div className="flex flex-col space-y-2">
              <label className="block text-sm mb-1">Team</label>
              <div> {team?.name} </div>
              <label className="block text-sm mb-1">League</label>
              <div> {league?.name} </div>
            </div>

            {league?.id ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">League Position</label>
                  <input
                    type="number"
                    min={1}
                    value={leaguePosition}
                    onChange={(e) =>
                      setLeaguePosition(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                  />
                </div>
                <div className="flex items-center space-x-4 mt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={promoted}
                      onChange={(e) => setPromoted(e.target.checked)}
                    />
                    <span>Promoted</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={relegated}
                      onChange={(e) => setRelegated(e.target.checked)}
                    />
                    <span>Relegated</span>
                  </label>
                </div>
              </div>
            ) : (<></>)}

            <div>
              <h3 className="font-semibold text-sm mb-2">Cup Results</h3>
              <div className="overflow-y-auto max-h-60">
              {cupResults.map((cup, idx) => (
                <div key={idx} className="border rounded p-3 mb-2 bg-zinc-100 dark:bg-zinc-800">
                  <label className="block text-sm mb-1">Cup</label>
                  <CompetitionDropdown
                    type="Cup"
                    value={cup.competitionId}
                    onChange={(value) => handleCupChange(idx, "competition", value)}
                  />
                  <label className="block text-sm mt-2 mb-1">Round Reached</label>
                  <select
                    value={cup.reachedRound}
                    onChange={(e) => handleCupChange(idx, "reachedRound", e.target.value)}
                    className="w-full border rounded p-2 bg-white dark:bg-zinc-700"
                  >
                    {CUP_ROUNDS.map(round => (
                      <option key={round} value={round}>{round}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveCup(idx)}
                    className="text-red-600 text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              </div>
              <button
                type="button"
                onClick={handleAddCup}
                className="text-purple-600 hover:underline text-sm"
              >
                + Add Cup Result
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded p-2"
              disabled={!season || !team?.id}
            >
              Save Season
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddSeasonModal;
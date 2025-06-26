import React, { useState } from "react";
import { CUP_ROUNDS, CupRound, CupResult, SeasonInput, CupResultInput } from "@/lib/types/Season";
import CompetitionDropdown from "../dropdowns/CompetitionDropdown";
import TeamSearchDropdown from "../algolia/TeamSearchDropdown";
import { Team } from "@/lib/types/Team";
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Competition } from "@/lib/types/Country&Competition";

type AddSeasonModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (season: SeasonInput) => void;
};

export const AddSeasonModal: React.FC<AddSeasonModalProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [season, setSeason] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [league, setLeague] = useState<Competition | null>(null);
  const [leaguePosition, setLeaguePosition] = useState<number | "">("");
  const [promoted, setPromoted] = useState(false);
  const [relegated, setRelegated] = useState(false);
  const [cupResults, setCupResults] = useState<CupResultInput[]>([]);
  const [isCurrent, setIsCurrent] = useState(false);

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
    if (!league?.id && leaguePosition !== "") {
      alert("Please select a league if you want to specify a league position.");
      return;
    }

    const seasonResult: SeasonInput = {
      season,
      teamId: team?.id ? String(team.id) : "",
      leagueId: String(league?.id) || "",
      leaguePosition: Number(leaguePosition),
      promoted,
      relegated,
      cupResults,
      isCurrent,
    };

    onSave(seasonResult);
    onClose();
  };

  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="w-full max-w-2xl h-[80vh] bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl relative">
          <button
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
          <Dialog.Title className="text-xl font-bold mb-4">Add Season</Dialog.Title>

          <form className="space-y-4 overflow-y-auto max-h-[70vh]" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div>
              <label className="block text-sm mb-1">Season (e.g. 2026/27)</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2026/27"
                className="w-full border rounded p-2 bg-zinc-100 dark:bg-zinc-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Team</label>
              <TeamSearchDropdown onTeamSelect={setTeam} />
            </div>

            <div>
              <label className="block text-sm mb-1">League</label>
              <CompetitionDropdown type="League" value={league?.id ? String(league.id) : undefined} onChange={setLeague} />
            </div>

            {league?.id && (
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
            )}

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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
              />
              <span className="text-sm">Is Current Season</span>
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
import ConfirmationModal from "@/app/components/modals/ConfirmationModal";
import { useState } from "react";
import Image from "next/image";
import { SeasonSummary } from "@/lib/types/prisma/Season";
import { ArrowDown, ArrowUp, Medal, Pencil, Trash2, Trophy } from "lucide-react";

type SeasonCardProps = {
  season: SeasonSummary;
  onDelete?: (season: SeasonSummary) => void;
  onEdit?: (season: SeasonSummary) => void;
};

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}


export function SeasonCard({ season, onDelete, onEdit }: SeasonCardProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const leagueResult = season.leagueResult;
  const cupResults = season.cupResults;
  const hasCupRuns = Boolean(cupResults?.length);

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete?.(season);
    setShowDeleteConfirmation(false);
  };

  const hasLeagueTitle = leagueResult?.position === 1;
  const movementLabel = leagueResult?.promoted
    ? "Promoted"
    : leagueResult?.relegated
      ? "Relegated"
      : null;

  const movementClass = leagueResult?.promoted
    ? "bg-emerald-500/15 text-emerald-300"
    : "bg-rose-500/15 text-rose-300";

  return (
    <div className="glass-panel h-full w-full overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex h-full w-full flex-col gap-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {season.season}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(season)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] transition-colors hover:text-white"
                aria-label="Edit season"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 transition-colors hover:bg-rose-500/20"
                aria-label="Delete season"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 border-b border-[var(--color-surface-border)] pb-3">
          <Image
            src={season.team.logo}
            alt={season.team.name}
            className="h-12 w-12 shrink-0 rounded-lg object-contain"
            width={96}
            height={96}
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Club</p>
            <p className="truncate text-base font-bold text-white">{season.team.name}</p>
          </div>
        </div>

        {leagueResult && (
          <div className={`space-y-2 ${hasCupRuns ? "border-b border-[var(--color-surface-border)] pb-3" : ""}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">League</h3>
              {movementLabel ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${movementClass}`}>
                  {leagueResult.promoted && <ArrowUp className="h-3 w-3" />}
                  {leagueResult.relegated && <ArrowDown className="h-3 w-3" />}
                  {movementLabel}
                </span>
              ) : null}
            </div>

            <div className="flex min-w-0 items-center gap-3">
              {leagueResult.competition.logoUrl && (
                <Image
                  src={leagueResult.competition.logoUrl}
                  alt={leagueResult.competition.name ?? "League Logo"}
                  className="h-9 w-9 shrink-0 object-contain"
                  width={72}
                  height={72}
                  unoptimized
                />
              )}
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{leagueResult.competition.name}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-2 py-1 text-xs font-bold text-[var(--color-text-muted)]">
                <Medal className="h-3.5 w-3.5" />
                {leagueResult.position ? getOrdinal(leagueResult.position) : "N/A"}
              </span>
            </div>

            {hasLeagueTitle && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Champions
              </div>
            )}
          </div>
        )}

        {hasCupRuns ? (
          <>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Cup Runs</h3>
            {cupResults.map((cup) => (
              <div key={cup.competitionId} className="flex min-w-0 items-center gap-3 py-1">
                {cup.competition.logoUrl && (
                  <Image
                    src={cup.competition.logoUrl}
                    alt={cup.competition.name}
                    className="h-8 w-8 shrink-0 object-contain"
                    width={64}
                    height={64}
                    unoptimized
                  />
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{cup.competition.name}</p>
                <span className={`shrink-0 text-xs font-semibold ${cup.reachedRound !== "Winners" ? "text-[var(--color-text-muted)]" : "text-green-400"}`}>
                  {cup.reachedRound}
                </span>
              </div>
            ))}
          </>
        ) : null}
      </div>

      <ConfirmationModal
        open={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Delete Season"
        message={`Are you sure you want to delete the ${season.season} season for ${season.team.name}? This action cannot be undone.`}
        confirmText="Delete"
        destructive={true}
      />
    </div>
  )
}
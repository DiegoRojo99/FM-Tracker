import React, { useMemo, useState } from "react";
import AddSeasonModal from "@/app/components/modals/AddSeasonModal";
import { useAuth } from "@/app/components/AuthProvider";
import { FullDetailsSaveWithOwnership } from "@/lib/types/prisma/Save";
import { SeasonInput, SeasonSummary, SeasonUpdateInput } from "@/lib/types/prisma/Season";
import { SeasonCard } from "./SeasonCard";
import GradientButton from "@/app/components/GradientButton";
import { CalendarDays, ChevronDown, Trophy, TrendingUp } from "lucide-react";

interface SeasonSectionProps {
  saveDetails: FullDetailsSaveWithOwnership;
  setRefresh: (refresh: boolean) => void; // Prop for refreshing
}

const SeasonSection: React.FC<SeasonSectionProps> = ({ saveDetails, setRefresh }) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<SeasonSummary | null>(null);

  const sortedSeasons = useMemo(() => {
    return [...(saveDetails.seasons ?? [])].sort((a, b) => {
      return b.season.localeCompare(a.season);
    });
  }, [saveDetails.seasons]);

  const seasonCount = sortedSeasons.length;
  const leagueTitles = sortedSeasons.filter((season) => season.leagueResult?.position === 1).length;
  const promotedCount = sortedSeasons.filter((season) => Boolean(season.leagueResult?.promoted)).length;
  const relegatedCount = sortedSeasons.filter((season) => Boolean(season.leagueResult?.relegated)).length;

  async function onAddSeason(season: SeasonInput) {
    try {
      if (!user) throw new Error("User is not authenticated");
      if (!saveDetails.id) throw new Error("Save ID is not available");

      console.log("Adding season:", season);

      const token = await user.getIdToken();
      const response = await fetch(`/api/saves/${saveDetails.id}/seasons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(season),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload && typeof payload.error === "string" ? payload.error : "Failed to add season";
        throw new Error(message);
      }

      await response.json();
      return true;
    } 
    catch (error) {
      alert(error instanceof Error ? error.message : "Error adding season. Please try again.");
      console.error(error);
      return false;
    }      
  }

  const handleAddSeason = async (season: SeasonInput) => {
    const result = await onAddSeason(season);
    if (!result) return;
    setRefresh(true);
    setModalOpen(false);
    return true;
  };

  const handleUpdateSeason = async (season: SeasonUpdateInput) => {
    try {
      if (!user) throw new Error("User is not authenticated");
      if (!saveDetails.id) throw new Error("Save ID is not available");

      const token = await user.getIdToken();
      const response = await fetch(`/api/saves/${saveDetails.id}/seasons`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(season),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload && typeof payload.error === "string" ? payload.error : "Failed to update season";
        throw new Error(message);
      }

      setRefresh(true);
      setEditingSeason(null);
      setModalOpen(false);
      return true;
    }
    catch (error) {
      alert(error instanceof Error ? error.message : "Error updating season. Please try again.");
      console.error(error);
      return false;
    }
  };

  const handleSaveSeason = async (season: SeasonInput) => {
    if (!editingSeason) {
      return await handleAddSeason(season);
    }

    return await handleUpdateSeason({
      ...season,
      seasonId: editingSeason.id,
    });
  };

  const handleDeleteSeason = async (season: SeasonSummary) => {
    try {
      if (!user) throw new Error("User is not authenticated");
      if (!saveDetails.id) throw new Error("Save ID is not available");

      const token = await user.getIdToken();
      const response = await fetch(`/api/saves/${saveDetails.id}/seasons`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          season: season.season,
          teamId: season.teamId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete season");
      }

      setRefresh(true);
    } catch (error) {
      alert("Error deleting season. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 mt-2 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            <CalendarDays className="h-3.5 w-3.5" />
            Campaign Log
          </p>
          <h2 className="mt-1 text-xl font-black text-white">Seasons</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Every campaign phase in one scan-friendly grid.</p>
        </div>

        {saveDetails.isOwner && (
          <GradientButton
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingSeason(null);
              setModalOpen(true);
            }}
          >
            + Add season
          </GradientButton>
        )}
      </div>

      {seasonCount > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <SeasonStatChip
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label="Seasons"
            value={seasonCount}
            accentClass="bg-sky-500/15 text-sky-300"
          />
          <SeasonStatChip
            icon={<Trophy className="h-3.5 w-3.5" />}
            label="League Titles"
            value={leagueTitles}
            accentClass="bg-amber-500/15 text-amber-300"
          />
          <SeasonStatChip
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Promotions"
            value={promotedCount}
            accentClass="bg-emerald-500/15 text-emerald-300"
          />
          <SeasonStatChip
            icon={<ChevronDown className="h-3.5 w-3.5" />}
            label="Relegations"
            value={relegatedCount}
            accentClass="bg-rose-500/15 text-rose-300"
          />
        </div>
      )}

      {!sortedSeasons.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-6 text-center">
          <p className='text-sm text-[var(--color-text-muted)]'>No seasons available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedSeasons.map((season) => (
            <SeasonCard
              key={`${String(season.teamId)}-${String(season.season)}`}
              season={season}
              onEdit={saveDetails.isOwner ? (seasonToEdit) => {
                setEditingSeason(seasonToEdit);
                setModalOpen(true);
              } : undefined}
              onDelete={saveDetails.isOwner ? handleDeleteSeason : undefined}
            />
          ))}
        </div>
      )}

      <AddSeasonModal 
        open={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditingSeason(null);
        }} 
        onSave={handleSaveSeason}
        saveDetails={saveDetails}
        initialSeason={editingSeason}
        title={editingSeason ? "Edit Season" : "Add Season"}
        submitLabel={editingSeason ? "Update Season" : "Save Season"}
      />
    </div>
  );
};

function SeasonStatChip({
  icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-3 py-2.5 sm:py-3">
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/5 blur-2xl transition-opacity duration-300 group-hover:opacity-80" />
      <div className="relative min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] sm:text-[11px]">{label}</p>
          <div className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${accentClass}`}>
            {icon}
          </div>
        </div>
        <p className="mt-1 text-xl font-black leading-none text-white sm:text-2xl">{value}</p>
      </div>
      <div className="sr-only">
        {label}: {value}
      </div>
    </div>
  );
}

export default SeasonSection;
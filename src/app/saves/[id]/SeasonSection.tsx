import React, { useState } from "react";
import AddSeasonModal from "@/app/components/modals/AddSeasonModal";
import { useAuth } from "@/app/components/AuthProvider";
import { FullDetailsSaveWithOwnership } from "@/lib/types/prisma/Save";
import { SeasonInput, SeasonSummary } from "@/lib/types/prisma/Season";
import { SeasonCard } from "./SeasonCard";
import GradientButton from "@/app/components/GradientButton";

interface SeasonSectionProps {
  saveDetails: FullDetailsSaveWithOwnership;
  setRefresh: (refresh: boolean) => void; // Prop for refreshing
}

const SeasonSection: React.FC<SeasonSectionProps> = ({ saveDetails, setRefresh }) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  async function onAddSeason(season: SeasonInput) {
    try {
      if (!user) throw new Error("User is not authenticated");
      if (!saveDetails.id) throw new Error("Save ID is not available");

      console.log("Adding season:", season);

      const token = await user.getIdToken();
      await fetch(`/api/saves/${saveDetails.id}/seasons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(season),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to add season");
        return res.json();
      });
      return true;
    } 
    catch (error) {
      alert("Error adding season. Please try again.");
      console.error(error);
      return false;
    }      
  }

  const handleAddSeason = async (season: SeasonInput) => {
    const result = await onAddSeason(season);
    if (!result) return;
    setRefresh(true);
    setModalOpen(false);
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
        <h2 className="text-xl font-semibold">Seasons</h2>
        {saveDetails.isOwner && (
          <GradientButton
            className="w-full sm:w-auto"
            onClick={() => setModalOpen(true)}
          >
            + Add season
          </GradientButton>
        )}
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex flex-row gap-4">
        {!saveDetails.seasons?.length ? (
          <p className='text-sm text-gray-500'>No seasons available.</p>
        ) : (
          saveDetails.seasons.sort((a, b) => a.season.localeCompare(b.season)).map((season) => (
            <SeasonCard
              key={`${String(season.teamId)}-${String(season.season)}`}
              season={season}
              onDelete={saveDetails.isOwner ? handleDeleteSeason : undefined}
            />
          ))
        )}
        </div>
      </div>

      <AddSeasonModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleAddSeason} 
        saveDetails={saveDetails}
      />
    </div>
  );
};

export default SeasonSection;
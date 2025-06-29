import React, { useState } from "react";
import AddSeasonModal from "@/app/components/modals/AddSeasonModal";
import { SeasonInput } from "@/lib/types/Season";
import { useAuth } from "@/app/components/AuthProvider";
import { SaveWithChildren } from "@/lib/types/Save";
import { SeasonCard } from "./SeasonCard";

interface SeasonSectionProps {
  saveDetails: SaveWithChildren;
  setRefresh: (refresh: boolean) => void; // Prop for refreshing
}

const SeasonSection: React.FC<SeasonSectionProps> = ({ saveDetails, setRefresh }) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  async function onAddSeason(season: SeasonInput) {
    try {
      if (!user) throw new Error("User is not authenticated");
      if (!saveDetails.id) throw new Error("Save ID is not available");

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ margin: 0 }}>Seasons</h2>
        <button
          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          +
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!saveDetails.seasons?.length ? (
          <p>No seasons available.</p>
        ) : (
          saveDetails.seasons.map((season) => (
            <SeasonCard
              key={`${String(season.teamId)}-${String(season.season)}`}
              season={season}
            />
          ))
        )}
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
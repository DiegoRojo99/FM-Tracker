import { Timestamp } from 'firebase-admin/firestore';
import { Save } from './Save.d';

export type Game = {
  id: string; // e.g., "fm24", "fm26", "fm24-touch"
  name: string; // e.g., "Football Manager 2024"
  shortName: string; // e.g., "FM24"
  version: string; // e.g., "2024"
  platform: "PC" | "Mobile" | "Console";
  variant?: "Standard" | "Touch"; // For different versions like FM Touch
  releaseDate: Timestamp;
  isActive: boolean; // For enabling/disabling games in UI
  logoUrl?: string;
  sortOrder: number; // For consistent ordering in dropdowns
}

export type GameInput = Omit<Game, 'id'>;

// For components that need game info with saves
export type SaveWithGame = Save & {
  game?: Game;
}
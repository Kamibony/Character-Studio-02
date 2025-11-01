
import { Timestamp } from "firebase/firestore";

export type CharacterStatus = "pending" | "training" | "ready" | "error";

export interface UserCharacter {
  id: string;
  userId: string;
  characterName: string;
  status: CharacterStatus;
  createdAt: Timestamp;
  description: string;
  keywords: string[];
  imagePreviewUrl: string; // This is a GCS path, not a downloadable URL
  adapterId: string | null;
}

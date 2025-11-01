
import { functions, httpsCallable } from './firebase';
import type { UserCharacter } from '../types';

// --- Function 1: Get Character Library ---
const getCharacterLibraryCallable = httpsCallable<void, UserCharacter[]>(functions, 'getCharacterLibrary');

export const api = {
  getCharacterLibrary: async (): Promise<UserCharacter[]> => {
    const result = await getCharacterLibraryCallable();
    return result.data;
  },

  // --- Function 2: Start Character Tuning ---
  startCharacterTuning: async (files: string[]): Promise<{ characterId: string }> => {
    const startTuningCallable = httpsCallable<{ files: string[] }, { characterId: string }>(functions, 'startCharacterTuning');
    const result = await startTuningCallable({ files });
    return result.data;
  },

  // --- Function 3: Generate Character Visualization ---
  generateCharacterVisualization: async (characterId: string, prompt: string): Promise<{ base64Image: string }> => {
    const generateVizCallable = httpsCallable<{ characterId: string; prompt: string }, { base64Image: string }>(functions, 'generateCharacterVisualization');
    const result = await generateVizCallable({ characterId, prompt });
    return result.data;
  },
};

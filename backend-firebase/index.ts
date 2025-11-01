
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { VertexAI, Modality } from "@google-cloud/vertexai";

// Definícia typov
type CharacterStatus = "pending" | "training" | "ready" | "error";
interface UserCharacter {
  id: string;
  userId: string;
  characterName: string;
  status: CharacterStatus;
  createdAt: admin.firestore.Timestamp;
  description: string;
  keywords: string[];
  imagePreviewUrl: string;
  adapterId: string | null;
}

// Inicializácia Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// --- Konfigurácia ---
const PROJECT_ID = "character-studio-comics";
const LOCATION = "us-central1";
const STORAGE_BUCKET = "character-studio-comics.appspot.com";
const regionalFunctions = functions.region(LOCATION);

// Helper na zistenie MIME typu
function getMimeType(filePath: string): string {
  if (filePath.toLowerCase().endsWith(".png")) return "image/png";
  if (filePath.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

// --- Funkcia 1: Získanie Knižnice Postáv ---
export const getCharacterLibrary = regionalFunctions.https.onCall(
  async (data, context): Promise<UserCharacter[]> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte byť prihlásený.");
      }
      const uid = context.auth.uid;

      // ZJEDNODUŠENÝ DOTAZ: Iba filter, žiadne .orderBy() na zabránenie chyby indexu.
      const snapshot = await db
        .collection("user_characters")
        .where("userId", "==", uid)
        .get();

      const characters = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserCharacter));
      
      return characters;

    } catch (error: any) {
        console.error("Error in getCharacterLibrary:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Nepodarilo sa načítať knižnicu postáv.", error.message);
    }
  }
);

// --- Funkcia 2: Spustenie Simulovaného Tréningu ---
export const startCharacterTuning = regionalFunctions.https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte byť prihlásený.");
      }
      const uid = context.auth.uid;
      const { files } = data; // Data sú už naparsované vďaka onCall
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Neboli poskytnuté žiadne súbory.");
      }

      const newCharRef = db.collection("user_characters").doc();
      const characterId = newCharRef.id;

      await newCharRef.set({
          userId: uid,
          status: "pending" as CharacterStatus,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          adapterId: null,
          characterName: "Spracováva sa...",
          description: "",
          keywords: [],
          imagePreviewUrl: files[0], // Uložíme GCS cestu k prvému obrázku
      });
      
      // Spustíme asynchrónne na pozadí, nečakáme na dokončenie
      simulateTraining(characterId, files);
      
      return { characterId };

    } catch (error: any) {
        console.error("Error in startCharacterTuning:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Nepodarilo sa spustiť tréning.", error.message);
    }
  }
);

// Asynchrónna pomocná funkcia (tréning)
async function simulateTraining(characterId: string, files: string[]) {
  const charRef = db.collection("user_characters").doc(characterId);
  try {
    // LAZY INITIALIZATION: Inicializujeme klienta až tu.
    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    
    await charRef.update({ status: "training" });
    
    // Simulácia času (5 sekúnd)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Tu by sme v reáli volali Vertex AI Model Tuning Job.
    // Namiesto toho analyzujeme obrázok a vygenerujeme dáta.
    const firstImageFile = files[0];
    if (!firstImageFile) {
        throw new Error("Pre simuláciu tréningu neboli poskytnuté žiadne súbory.");
    }
    const storage = getStorage();
    const bucket = storage.bucket(STORAGE_BUCKET);
    const file = bucket.file(firstImageFile);
    const [imageBuffer] = await file.download();
    const imageBase64 = imageBuffer.toString("base64");
    
    const imagePart = { inlineData: { mimeType: getMimeType(firstImageFile), data: imageBase64 } };
    const textPart = { text: `Analyzuj postavu na tomto obrázku. Vygeneruj JSON objekt s: 'characterName' (kreatívne meno postavy), 'description' (krátky, pútavý popis) a 'keywords' (pole 5 relevantných kľúčových slov).` };
    
    // FIX: Use gemini-2.5-flash's multimodal capabilities and JSON output mode.
    const generativeModel = vertexAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });
    
    const result = await generativeModel.generateContent({ contents: [{ role: 'user', parts: [textPart, imagePart] }] });
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let aiData = { characterName: "Hrdina Kódu", description: "Záhadná postava s nejasným pôvodom.", keywords: ["záhadný"] };
    if (responseText) {
      try {
          // The model is in JSON mode, so we can parse the whole response.
          aiData = JSON.parse(responseText);
      } catch (e) { console.warn("Nepodarilo sa parsovať AI odpoveď, použije sa záložná.", e); }
    }
    
    await charRef.update({ 
      status: "ready", 
      ...aiData, 
      adapterId: `simulated-adapter-${Date.now()}` 
    });

  } catch (error) {
    console.error("Simulácia tréningu zlyhala:", error);
    await charRef.update({ status: "error" });
  }
}

// --- Funkcia 3: Generovanie Obrázku ---
export const generateCharacterVisualization = regionalFunctions.runWith({timeoutSeconds: 120, memory: '1GB'}).https.onCall(
  async (data, context): Promise<{ base64Image: string }> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte byť prihlásený.");
      }
      
      const { characterId, prompt } = data;
      if (!characterId || !prompt) {
        throw new functions.https.HttpsError("invalid-argument", "Chýba 'characterId' alebo 'prompt'.");
      }
      
      const charDoc = await db.collection("user_characters").doc(characterId).get();
      if (!charDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Postava neexistuje.");
      }
      const character = charDoc.data() as UserCharacter;

      if (!character.imagePreviewUrl) {
          throw new functions.https.HttpsError("failed-precondition", "Postava nemá referenčný obrázok.");
      }

      // LAZY INITIALIZATION
      const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
      const storage = getStorage();

      const bucket = storage.bucket(STORAGE_BUCKET);
      const file = bucket.file(character.imagePreviewUrl);
      const [imageBuffer] = await file.download();
      const imageBase64FromStorage = imageBuffer.toString("base64");
      
      const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

      const generationPrompt = `Použi poskytnutý obrázok ako referenciu pre vzhľad postavy. Umiestni túto postavu do scény: "${prompt}".`;
      
      const imagePart = { inlineData: { mimeType: getMimeType(character.imagePreviewUrl), data: imageBase64FromStorage } };
      const textPart = { text: generationPrompt };

      // FIX: Removed invalid `config` property. It's not supported by the @google-cloud/vertexai SDK.
      const result = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [textPart, imagePart] }],
      });
      
      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate) {
          console.error("AI vrátilo prázdnu odpoveď:", JSON.stringify(response, null, 2));
          throw new functions.https.HttpsError("internal", "AI model nevrátil žiadnych kandidátov. Skúste to znova.");
      }
      
      if (candidate.finishReason && ['SAFETY', 'RECITATION'].includes(candidate.finishReason)) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              `Váš prompt bol zablakovaný z bezpečnostných dôvodov (${candidate.finishReason}). Upravte prompt a skúste to znova.`
          );
      }

      const imageBase64 = candidate.content?.parts?.find(part => part.inlineData)?.inlineData?.data;

      if (!imageBase64) {
        console.error("AI neodpovedalo obrázkom:", JSON.stringify(response, null, 2));
        throw new functions.https.HttpsError("internal", "AI nevygenerovalo obrázok. Skúste preformulovať prompt.");
      }
      
      return { base64Image: imageBase64 };

    } catch (error: any) {
        console.error("Kritická chyba v generateCharacterVisualization:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Neočakávaná chyba servera pri generovaní obrázku.", error.message);
    }
  }
);


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { api } from '../services/api';
import { UserCharacter } from '../types';
import Loader from '../components/Loader';
import { Sparkles, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const CharacterResultPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!characterId) {
        setError('Character ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'user_characters', characterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const charData = { id: docSnap.id, ...docSnap.data() } as UserCharacter;
          setCharacter(charData);
          if (charData.imagePreviewUrl) {
            const url = await getDownloadURL(ref(storage, charData.imagePreviewUrl));
            setCharacterImageUrl(url);
          }
        } else {
          setError('Character not found.');
        }
      } catch (err) {
        setError('Failed to load character data.');
      } finally {
        setLoading(false);
      }
    };
    fetchCharacter();
  }, [characterId]);

  const handleGenerate = async () => {
    if (!prompt || !characterId) return;
    setGenerating(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const result = await api.generateCharacterVisualization(characterId, prompt);
      setGeneratedImage(`data:image/png;base64,${result.base64Image}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center pt-20"><Loader text="Loading Character..." /></div>;
  }
  
  if (!character) {
    return <div className="text-center text-red-400 pt-20">{error || 'Character could not be loaded.'}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Panel: Character Info */}
      <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg border border-gray-700 self-start">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 mb-4">
          {characterImageUrl ? (
            <img src={characterImageUrl} alt={character.characterName} className="w-full h-full object-cover" />
          ) : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-16 h-16 text-gray-500"/></div>}
        </div>
        <h1 className="text-3xl font-bold text-white">{character.characterName}</h1>
        <p className="text-gray-400 mt-2">{character.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {character.keywords.map((kw) => (
            <span key={kw} className="bg-sky-900/50 text-sky-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Right Panel: Generation */}
      <div className="lg:col-span-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Generate Visualization</h2>
        <p className="mt-1 text-lg text-gray-400">Describe a scene or action for your character.</p>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., standing on a neon-lit rooftop"
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            <span>{generating ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>

        {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
        )}

        <div className="mt-8 w-full aspect-video bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden">
          {generating ? (
            <Loader text="Generating image with AI..." />
          ) : generatedImage ? (
            <img src={generatedImage} alt="Generated visualization" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto"/>
                <p className="mt-2 font-semibold">Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterResultPage;

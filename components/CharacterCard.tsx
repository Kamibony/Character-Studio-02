
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCharacter } from '../types';
import { storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { Image, Hourglass, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

const CharacterCard: React.FC<{ character: UserCharacter }> = ({ character }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (character.imagePreviewUrl) {
        try {
          const url = await getDownloadURL(ref(storage, character.imagePreviewUrl));
          setImageUrl(url);
        } catch (error) {
          console.error("Error fetching image URL:", error);
          setImageUrl(null); // Set to null on error
        } finally {
          setLoadingImage(false);
        }
      } else {
          setLoadingImage(false);
      }
    };
    
    fetchImageUrl();
  }, [character.imagePreviewUrl]);
  
  const statusInfo = {
    pending: { icon: <Hourglass className="w-4 h-4 text-yellow-400" />, text: 'Pending', color: 'bg-yellow-500/20 text-yellow-300' },
    training: { icon: <Hourglass className="w-4 h-4 text-blue-400 animate-spin" />, text: 'Training', color: 'bg-blue-500/20 text-blue-300' },
    ready: { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'Ready', color: 'bg-green-500/20 text-green-300' },
    error: { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: 'Error', color: 'bg-red-500/20 text-red-300' },
  };
  
  const currentStatus = statusInfo[character.status] || statusInfo.pending;

  const cardContent = (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 group transform hover:-translate-y-1">
      <div className="relative w-full h-48 bg-gray-700">
        {loadingImage ? (
          <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-gray-500 animate-pulse" /></div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={character.characterName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-gray-500" /></div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg truncate text-white" title={character.characterName}>{character.characterName}</h3>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.color}`}>
              {currentStatus.icon}
              {currentStatus.text}
            </span>
        </div>
        <p className="text-sm text-gray-400 mt-1 truncate">{character.description || 'No description yet.'}</p>
      </div>
    </div>
  );

  return character.status === 'ready' ? (
    <Link to={`/character/${character.id}`} className="block">{cardContent}</Link>
  ) : character.status === 'training' || character.status === 'pending' ? (
    <Link to={`/training/${character.id}`} className="block">{cardContent}</Link>
  ) : (
    <div className="opacity-70 cursor-not-allowed">{cardContent}</div>
  );
};

export default CharacterCard;

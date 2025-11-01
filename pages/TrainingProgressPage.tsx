
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserCharacter } from '../types';
import Loader from '../components/Loader';
import { AlertTriangle, CheckCircle, Hourglass } from 'lucide-react';

const TrainingProgressPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      setError("No character ID provided.");
      return;
    }

    const docRef = doc(db, 'user_characters', characterId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as UserCharacter;
        setCharacter(data);
        if (data.status === 'ready') {
          setTimeout(() => navigate(`/character/${characterId}`), 1500); // Navigate after a short delay
        }
        if (data.status === 'error') {
            setError("Training failed. Please try creating the character again.");
        }
      } else {
        setError("Character not found.");
      }
    }, (err) => {
      console.error("Snapshot error:", err);
      setError("Failed to listen for character updates.");
    });

    return () => unsubscribe();
  }, [characterId, navigate]);

  const statusInfo = {
    pending: {
      icon: <Hourglass className="w-16 h-16 text-yellow-400" />,
      text: "Pending...",
      message: "Your character training request has been queued."
    },
    training: {
      icon: <Loader text="" />,
      text: "Training in Progress...",
      message: "The AI is analyzing the images. This may take a few moments. Please don't close this page."
    },
    ready: {
        icon: <CheckCircle className="w-16 h-16 text-green-400" />,
        text: "Training Complete!",
        message: "Your character is ready. Redirecting..."
    },
    error: {
      icon: <AlertTriangle className="w-16 h-16 text-red-400" />,
      text: "Training Failed",
      message: error || "An unexpected error occurred during training."
    }
  };

  const currentStatusKey = character?.status || 'pending';
  const currentStatus = statusInfo[currentStatusKey];

  return (
    <div className="flex flex-col items-center justify-center text-center pt-20">
      <div className="bg-gray-800/60 p-10 rounded-xl shadow-lg border border-gray-700 max-w-lg">
        <div className="mb-6">{currentStatus.icon}</div>
        <h1 className="text-3xl font-bold text-white">{currentStatus.text}</h1>
        <p className="mt-2 text-gray-400">{currentStatus.message}</p>
      </div>
    </div>
  );
};

export default TrainingProgressPage;

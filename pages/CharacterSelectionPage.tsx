
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { UserCharacter } from '../types';
import CharacterCard from '../components/CharacterCard';
import Loader from '../components/Loader';
import { PlusCircle, ListFilter } from 'lucide-react';

const CharacterSelectionPage: React.FC = () => {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const fetchedCharacters = await api.getCharacterLibrary();
        setCharacters(fetchedCharacters);
      } catch (err: any) {
        setError(err.message || 'Failed to load characters.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        case 'oldest':
          return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
        case 'name':
          return a.characterName.localeCompare(b.characterName);
        default:
          return 0;
      }
    });
  }, [characters, sortOrder]);

  if (loading) {
    return <div className="flex justify-center items-center pt-20"><Loader text="Loading Library..." /></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 pt-20">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Your Characters</h1>
            <p className="mt-2 text-lg text-gray-400">Select a character to continue or create a new one.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'name')}
                className="pl-10 pr-4 py-2 w-full appearance-none bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">By Name (A-Z)</option>
            </select>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold transition-colors shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>New Character</span>
          </button>
        </div>
      </div>
      
      {sortedCharacters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedCharacters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-300">No Characters Found</h2>
          <p className="mt-2 text-gray-500">Get started by creating your first character.</p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-6 flex items-center mx-auto gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Create New Character
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterSelectionPage;

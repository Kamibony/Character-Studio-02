
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clapperboard } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-50 p-4 flex justify-between items-center border-b border-gray-700">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <Clapperboard className="w-8 h-8 text-sky-400" />
        <h1 className="text-2xl font-bold text-white tracking-tight">Character Studio</h1>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </header>
  );
};

export default Header;

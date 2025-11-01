
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CharacterSelectionPage from './pages/CharacterSelectionPage';
import FileUploadPage from './pages/FileUploadPage';
import TrainingProgressPage from './pages/TrainingProgressPage';
import CharacterResultPage from './pages/CharacterResultPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import Loader from './components/Loader';
import Header from './components/Header';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        {user && <Header />}
        <main className="p-4 md:p-8">
          <Routes>
            <Route path="/" element={user ? <CharacterSelectionPage /> : <LoginPage />} />
            
            <Route path="/upload" element={
              <ProtectedRoute>
                <FileUploadPage />
              </ProtectedRoute>
            } />
            <Route path="/training/:characterId" element={
              <ProtectedRoute>
                <TrainingProgressPage />
              </ProtectedRoute>
            } />
            <Route path="/character/:characterId" element={
              <ProtectedRoute>
                <CharacterResultPage />
              </ProtectedRoute>
            } />
            
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;

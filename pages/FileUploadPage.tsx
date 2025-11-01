
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import FileUploadPreview from '../components/FileUploadPreview';
import { UploadCloud, X, AlertTriangle } from 'lucide-react';
import Loader from '../components/Loader';

const FileUploadPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true,
  });

  const handleUploadAndTrain = async () => {
    if (!files.length || !user) return;

    setLoading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => {
        const filePath = `user_uploads/${user.uid}/${uuidv4()}-${file.name}`;
        const storageRef = ref(storage, filePath);
        return uploadBytes(storageRef, file).then(() => filePath);
      });

      const filePaths = await Promise.all(uploadPromises);

      const { characterId } = await api.startCharacterTuning(filePaths);

      navigate(`/training/${characterId}`);
    } catch (err: any) {
      console.error("Upload and train error:", err);
      setError(err.message || 'An unknown error occurred.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center pt-20"><Loader text="Uploading files & starting training..." /></div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-white">Create a New Character</h1>
        <p className="mt-2 text-lg text-gray-400">Upload one or more reference images for your character. The AI will analyze them to learn its appearance.</p>

      <div {...getRootProps()} className={`mt-8 p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-sky-500 bg-sky-900/50' : 'border-gray-600 hover:border-sky-600'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto w-12 h-12 text-gray-400" />
        {isDragActive ? (
          <p className="mt-4 text-lg text-sky-300">Drop the files here ...</p>
        ) : (
          <p className="mt-4 text-lg text-gray-400">Drag 'n' drop some files here, or click to select files</p>
        )}
        <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP accepted</p>
      </div>

      <FileUploadPreview files={files} />

      {error && (
        <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={() => setFiles([])} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
            Clear
          </button>
          <button
            onClick={handleUploadAndTrain}
            disabled={loading}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed"
          >
            Upload and Train
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadPage;

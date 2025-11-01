import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, AuthError } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Clapperboard, AlertTriangle, Copy, Check } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const requiredDomain = 'google-aistudio.web.app';

  const handleCopy = () => {
    navigator.clipboard.writeText(requiredDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setIsDomainError(false);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      const authError = err as AuthError;
      console.error("Login failed:", authError.code, authError.message);
      if (authError.code === 'auth/unauthorized-domain') {
        setIsDomainError(true);
        setError(`This domain is not authorized for authentication. Please add it to your Firebase project's allowlist.`);
      } else {
        setError(authError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl shadow-sky-900/20 border border-gray-700">
        <div className="text-center">
            <Clapperboard className="w-16 h-16 mx-auto text-sky-400" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Welcome to Character Studio
            </h2>
            <p className="mt-2 text-sm text-gray-400">
            Sign in to bring your characters to life
            </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
            {isDomainError && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">
                  Add the following domain to your Firebase project's authorized domains:
                </p>
                <div className="w-full bg-gray-900/70 rounded-md p-2 flex items-center justify-between">
                  <code className="text-sky-300 font-mono">{requiredDomain}</code>
                  <button 
                    onClick={handleCopy} 
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                 <p className="text-xs text-gray-400 mt-2">
                  Find this setting under: <br/> Authentication → Settings → Authorized domains.
                 </p>
              </div>
            )}
          </div>
        )}

        <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-gray-900 transition-all duration-300"
        >
          {loading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
            </>
          ) : (
            <>
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571c0.001-0.001 0.002-0.001 0.003-0.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                <span>Sign in with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
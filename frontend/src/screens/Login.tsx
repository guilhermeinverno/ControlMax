import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import type { AuthError } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Rate limiting visual states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        clearInterval(interval);
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleLogin = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setFailedAttempts(0);
      onSuccess();
    } catch (err) {
      const authError = err as AuthError;
      let message = 'Erro ao fazer login. Tente novamente.';
      
      if (
        authError.code === 'auth/invalid-credential' || 
        authError.code === 'auth/wrong-password' ||
        authError.code === 'auth/user-not-found'
      ) {
        message = 'Email ou senha incorretos.';
      } else if (authError.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas. Aguarde alguns minutos.';
      } else if (authError.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      } else if (authError.code === 'auth/network-request-failed') {
        message = 'Erro de conexão. Verifique sua internet.';
      }
      
      setError(message);
      
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 60000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLocked) return;
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ControlMax
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  disabled={loading || isLocked}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6A008A] focus:border-[#6A008A] sm:text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  disabled={loading || isLocked}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6A008A] focus:border-[#6A008A] sm:text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isLocked && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded p-3 text-sm font-medium">
                Muitas tentativas. Tente novamente em {remainingSeconds}s.
              </div>
            )}

            {error && !isLocked && (
              <div className="bg-red-50 border border-red-300 text-red-800 rounded p-3 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || isLocked}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6A008A] hover:bg-[#52006A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6A008A] ${
                  (loading || isLocked) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continuar con</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading || isLocked}
                className={`w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6A008A] ${
                  (loading || isLocked) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Google
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

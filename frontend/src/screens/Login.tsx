import { useState } from 'react';
import type { FormEvent } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import type { AuthError } from 'firebase/auth';
import { Sparkles, LogIn, Eye, EyeOff, Download } from 'lucide-react';
import { useLayoutUi } from '../hooks/useLayoutUi';
import { forceRefreshIdToken } from '../utils/authToken';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const { handleInstallClick } = useLayoutUi();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState(false);
  const [googleOperationNotAllowedError, setGoogleOperationNotAllowedError] = useState(false);

  const handleEmailPasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setUnauthorizedDomainError(false);
    setGoogleOperationNotAllowedError(false);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // ENT-04: garante claims frescas no ID token após login
      await forceRefreshIdToken().catch(() => undefined);
      onSuccess();
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.warn('Email/Password login failed:', authError.code);

      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setError('E-mail ou senha incorretos. Se não possui cadastro, contate o administrador.');
          break;
        case 'auth/invalid-email':
          setError('Formato de e-mail inválido.');
          break;
        case 'auth/too-many-requests':
          setError('Muitas tentativas sem sucesso. Tente novamente mais tarde.');
          break;
        default:
          setError(authError.message || 'Erro ao entrar. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setUnauthorizedDomainError(false);
    setGoogleOperationNotAllowedError(false);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      await forceRefreshIdToken().catch(() => undefined);
      onSuccess();
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.warn("Google login failed:", authError);
      if (
        authError.code === 'auth/unauthorized-domain' ||
        authError.message?.includes('unauthorized-domain')
      ) {
        setUnauthorizedDomainError(true);
        setError('Firebase: Error (auth/unauthorized-domain).');
      } else if (
        authError.code === 'auth/operation-not-allowed' ||
        authError.message?.includes('operation-not-allowed')
      ) {
        setGoogleOperationNotAllowedError(true);
        setError('Firebase: Error (auth/operation-not-allowed).');
      } else {
        setError(authError.message || 'Erro ao entrar com Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Elegant Prominent Logo Header */}
        <div className="flex items-center justify-center mb-4">
          <img src="/new_logo.jpg" alt="ControlMax Logo" className="h-40 sm:h-48 max-w-full w-auto object-contain drop-shadow-lg rounded-2xl hover:scale-105 transition-transform duration-300" />
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
          Iniciar Sesión
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 font-medium">
          Acceso corporativo y administración
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 flex flex-col items-stretch space-y-5">
          
          <div className="text-center text-xs text-gray-400 py-1 border-b border-gray-100 font-medium leading-relaxed">
            Inicie sesión con su correo corporativo o a través de su cuenta de Google.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {unauthorizedDomainError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 text-xs space-y-3 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Sparkles size={14} className="text-amber-600 animate-pulse" />
                <span>Configuração de Domínio Autorizado Requerida</span>
              </div>
              <p className="leading-relaxed">
                O erro <strong>auth/unauthorized-domain</strong> ocorre porque o domínio desta visualização temporária não está autorizado no seu projeto do Firebase.
              </p>
              <p className="font-semibold">Como resolver no Console do Firebase:</p>
              <ol className="list-decimal pl-4 space-y-1 font-medium text-amber-950">
                <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-amber-700 font-bold">Console do Firebase</a>.</li>
                <li>Vá em <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized domains</strong> (Domínios autorizados).</li>
                <li>Clique em <strong>Add domain</strong> (Adicionar domínio) e adicione o seguinte domínio:
                  <div className="mt-1 bg-amber-100 p-1.5 rounded font-mono text-[10px] text-amber-950 font-bold select-all border border-amber-200 w-full truncate">
                    {typeof window !== 'undefined' ? window.location.hostname : ''}
                  </div>
                </li>
              </ol>
            </div>
          )}

          {googleOperationNotAllowedError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 text-xs space-y-3 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#6A008A]">
                <Sparkles size={14} className="text-purple-600 animate-pulse" />
                <span>Login com Google Não Ativo (operation-not-allowed)</span>
              </div>
              <p className="leading-relaxed">
                O erro <strong>auth/operation-not-allowed</strong> ocorre porque o provedor de login com o Google não está ativo nas configurações do seu projeto do Firebase.
              </p>
              <p className="font-semibold">Como ativar o login com o Google no Console do Firebase:</p>
              <ol className="list-decimal pl-4 space-y-1 font-medium text-amber-950">
                <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-amber-700 font-bold">Console do Firebase</a>.</li>
                <li>Selecione o seu projeto.</li>
                <li>Vá em <strong>Build</strong> &gt; <strong>Authentication</strong> &gt; <strong>Sign-in method</strong>.</li>
                <li>Clique em <strong>Add new provider</strong> (Adicionar novo provedor) e selecione <strong>Google</strong>.</li>
                <li>Ative o provedor do Google (configure o e-mail de suporte se solicitado) e clique em <strong>Save</strong> (Salvar).</li>
              </ol>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                E-mail corporativo
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#6A008A] bg-gray-50/50"
                placeholder="Ex: seu.nome@empresa.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-[#6A008A] bg-gray-50/50"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#6A008A] hover:bg-[#52006A] text-white py-3.5 px-4 rounded-xl text-sm font-extrabold shadow-sm hover:shadow-md transition-all active:scale-98 flex justify-center items-center gap-2 cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading && !error ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divider "OU" */}
          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 font-bold uppercase tracking-wider">OU</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl shadow-xs text-sm font-extrabold text-gray-700 bg-white hover:bg-gray-50 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6A008A] transition-all cursor-pointer ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading && error ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-gray-800">Iniciar Sesión con Google</span>
          </button>

          {/* PWA INSTALL / DOWNLOAD BUTTON ON LOGIN SCREEN */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full bg-[#8CC63F] hover:bg-[#7cb332] active:bg-[#6ca028] text-slate-900 font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center space-x-2 border border-[#7cb332]"
            >
              <Download className="w-4.5 h-4.5 text-slate-900" strokeWidth={2.5} />
              <span>Baixar / Instalar Aplicativo (App PWA)</span>
            </button>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
            <LogIn size={11} />
            <span>Sistema seguro operado con Firebase</span>
          </div>

        </div>
      </div>
    </div>
  );
}

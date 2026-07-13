import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { auth, db, triggerAuthListeners, getDemoUser, startDemoMode } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import type { AuthError } from 'firebase/auth';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { seedDemoData } from '../utils/seedDemoData';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('demo@controlmax.dev');
  const [password, setPassword] = useState('DemoControlMax2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom states for showing Firebase console setup helper
  const [showAuthInstructions, setShowAuthInstructions] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState(false);
  const [googleOperationNotAllowedError, setGoogleOperationNotAllowedError] = useState(false);

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

    const isDemoEmail = email.trim().toLowerCase() === 'demo@controlmax.dev';

    if (isDemoEmail) {
      console.log("Demo email detected. Automatically logging in using Local Offline Demo Mode...");
      try {
        await startDemoMode();
        await seedDemoData();
        const demoUser = getDemoUser();
        triggerAuthListeners(demoUser);
        onSuccess();
        return;
      } catch (demoErr: any) {
        console.error("Local demo fallback failed:", demoErr);
      }
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setFailedAttempts(0);
      onSuccess();
    } catch (err: any) {
      console.warn("Login attempt failed:", err);
      
      // If it is a Firebase config/restriction/network error, automatically log them in as a demo user
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('operation-not-allowed') ||
        err.message?.includes('admin-restricted-operation')
      ) {
        console.log("Firebase restricted or unconfigured. Automatically falling back to Local Offline Demo Mode...");
        try {
          localStorage.setItem('controlmax_demo_email', email.trim().toLowerCase());
          await startDemoMode();
          await seedDemoData();
          const demoUser = getDemoUser();
          triggerAuthListeners(demoUser);
          onSuccess();
          return;
        } catch (demoErr: any) {
          console.error("Local demo fallback failed:", demoErr);
        }
      }

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
    setUnauthorizedDomainError(false);
    setGoogleOperationNotAllowedError(false);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
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

  const handleSuperAdminOfflineBypass = async () => {
    setError('');
    setUnauthorizedDomainError(false);
    setLoading(true);
    try {
      localStorage.setItem('controlmax_demo_email', 'controlmaxia@gmail.com');
      await startDemoMode();
      await seedDemoData();
      const demoUser = getDemoUser();
      triggerAuthListeners(demoUser);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar modo demo local de Superadmin.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDemoBypass = async () => {
    setError('');
    setLoading(true);
    try {
      await startDemoMode();
      await seedDemoData();
      const demoUser = getDemoUser();
      triggerAuthListeners(demoUser);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar modo demo local.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    if (isLocked) return;
    setError('');
    setShowAuthInstructions(false);
    setLoading(true);
    try {
      const demoEmail = 'demo@controlmax.dev';
      const demoPassword = 'DemoControlMax2026!';
      
      let userCredential = null;

      try {
        // 1. Try traditional email/password login
        userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (signInErr: any) {
        console.warn("First signIn attempt failed:", signInErr.code || signInErr);
        
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential' || 
          signInErr.code === 'auth/wrong-password' ||
          signInErr.code === 'auth/invalid-email'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          } catch (signUpErr: any) {
            console.warn("SignUp also failed:", signUpErr.code || signUpErr);
            throw signUpErr;
          }
        } else if (signInErr.code === 'auth/operation-not-allowed') {
          // 2. Email-password is disabled in Firebase Console. Try Anonymous Auth as seamless backup!
          console.log("Email/Password is disabled. Attempting anonymous authentication as a fallback...");
          try {
            userCredential = await signInAnonymously(auth);
          } catch (anonErr: any) {
            console.warn("Anonymous authentication also failed:", anonErr.code || anonErr);
            throw signInErr; // throw original operation-not-allowed to trigger helper guide
          }
        } else {
          throw signInErr;
        }
      }

      // Seed all test data (5 sellers, 10 customers, 10 sales, routes, boxes, collections)
      await seedDemoData();

      // Ensure user profile exists in Firestore
      const user = userCredential?.user;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          email: demoEmail,
          role: 'admin',
          tenantId: 'tenant_demo',
          name: 'Admin Demo',
          userName: 'Admin Demo',
          username: 'demo_admin',
          firstName: 'Admin',
          lastName1: 'Demo',
          active: true,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }

      onSuccess();
    } catch (err: any) {
      console.warn('Error in test login / seeding, falling back automatically to local offline demo mode:', err);
      
      if (
        err.code === 'auth/operation-not-allowed' || 
        err.message?.includes('operation-not-allowed') ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('admin-restricted-operation')
      ) {
        // Retrieve the current Firebase Project ID dynamically to render personalized step-by-step instructions
        const currentProjId = auth.app?.options?.projectId || 'gen-lang-client-0671272791';
        setProjectId(currentProjId);
        setShowAuthInstructions(true);
        
        console.log("Auto-initiating Local Offline Demo Mode bypass...");
        try {
          await startDemoMode();
          await seedDemoData();
          const demoUser = getDemoUser();
          triggerAuthListeners(demoUser);
          onSuccess();
          return;
        } catch (demoErr: any) {
          console.error("Local demo fallback failed too:", demoErr);
        }
        setError('El inicio de sesión de prueba de Firebase requiere configuración.');
      } else {
        console.log("Auto-initiating Local Offline Demo Mode bypass...");
        try {
          await startDemoMode();
          await seedDemoData();
          const demoUser = getDemoUser();
          triggerAuthListeners(demoUser);
          onSuccess();
          return;
        } catch (demoErr: any) {
          console.error("Local demo fallback failed too:", demoErr);
        }
        setError(err.message || 'Erro ao preparar ambiente de teste.');
      }
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

            {unauthorizedDomainError && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 text-xs space-y-2.5 shadow-sm my-4">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Sparkles size={14} className="text-amber-600 animate-pulse" />
                  <span>Configuração de Domínio Autorizado Requerida</span>
                </div>
                <p className="text-amber-855 leading-relaxed text-amber-900">
                  O erro <strong>auth/unauthorized-domain</strong> ocorre porque o domínio desta visualização temporária não está autorizado no seu projeto do Firebase.
                </p>
                <p className="font-semibold text-amber-900">Como resolver no Console do Firebase:</p>
                <ol className="list-decimal pl-4 space-y-1 text-amber-950 font-medium">
                  <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-amber-700 font-bold">Console do Firebase</a>.</li>
                  <li>Vá em <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized domains</strong> (Domínios autorizados).</li>
                  <li>Clique em <strong>Add domain</strong> (Adicionar domínio) e adicione o seguinte domínio:
                    <div className="mt-1 bg-amber-100 p-1.5 rounded font-mono text-[10px] text-amber-950 font-bold select-all border border-amber-250 w-full truncate">
                      {typeof window !== 'undefined' ? window.location.hostname : ''}
                    </div>
                  </li>
                </ol>
                <div className="pt-2.5 border-t border-amber-250/60 flex flex-col gap-2">
                  <p className="text-[10px] text-amber-700 font-medium">
                    Quer testar o painel corporativo completo como <strong>Superadmin</strong> agora mesmo? Ignore e entre no modo simulação local offline:
                  </p>
                  <button
                    type="button"
                    onClick={handleSuperAdminOfflineBypass}
                    className="w-full text-center py-2 px-3 border border-transparent rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all animate-bounce mt-1"
                  >
                    Entrar como Superadmin (Offline Demo) 🚀
                  </button>
                </div>
              </div>
            )}

            {googleOperationNotAllowedError && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 text-xs space-y-2.5 shadow-sm my-4">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Sparkles size={14} className="text-amber-600 animate-pulse" />
                  <span>Login com Google Não Ativo (operation-not-allowed)</span>
                </div>
                <p className="text-amber-855 leading-relaxed text-amber-900">
                  O erro <strong>auth/operation-not-allowed</strong> ocorre porque o provedor de login com o Google não está ativo nas configurações do seu projeto do Firebase.
                </p>
                <p className="font-semibold text-amber-900">Como ativar o login com o Google no Console do Firebase:</p>
                <ol className="list-decimal pl-4 space-y-1 text-amber-950 font-medium">
                  <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-amber-700 font-bold">Console do Firebase</a>.</li>
                  <li>Selecione o seu projeto.</li>
                  <li>Vá em <strong>Build</strong> &gt; <strong>Authentication</strong> &gt; <strong>Sign-in method</strong>.</li>
                  <li>Clique em <strong>Add new provider</strong> (Adicionar novo provedor) e selecione <strong>Google</strong>.</li>
                  <li>Ative o provedor do Google (configure o e-mail de suporte do projeto se solicitado) e clique em <strong>Save</strong> (Salvar).</li>
                </ol>
                <div className="pt-2.5 border-t border-amber-250/60 flex flex-col gap-2">
                  <p className="text-[10px] text-amber-700 font-medium">
                    Quer testar o painel corporativo completo como <strong>Superadmin</strong> agora mesmo? Ignore e entre no modo simulação local offline:
                  </p>
                  <button
                    type="button"
                    onClick={handleSuperAdminOfflineBypass}
                    className="w-full text-center py-2 px-3 border border-transparent rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all animate-bounce mt-1"
                  >
                    Entrar como Superadmin (Offline Demo) 🚀
                  </button>
                </div>
              </div>
            )}

            {showAuthInstructions && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-xs space-y-2 shadow-sm my-4">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Sparkles size={14} className="text-amber-600 animate-pulse" />
                  <span>Configuración de Firebase Requerida</span>
                </div>
                <p className="text-amber-850 leading-relaxed">
                  Para usar el <strong>Acceso de Prueba</strong> con base de datos real, habilita el proveedor de <strong>E-mail/senha</strong> en tu Consola de Firebase:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-amber-950 font-medium">
                  <li>Entra en <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-amber-700 font-semibold">Firebase Console</a>.</li>
                  <li>Selecciona tu proyecto: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[10px] select-all">{projectId}</code>.</li>
                  <li>Ve a <strong>Build &gt; Authentication &gt; Sign-in method</strong>.</li>
                  <li>Haz clic en <strong>Agregar nuevo proveedor</strong>, selecciona <strong>Correo electrónico/Contraseña</strong> (Email/Password), actívalo y haz clic en <strong>Guardar</strong>.</li>
                </ol>
                <div className="pt-2.5 border-t border-amber-200/60 flex flex-col gap-2">
                  <p className="text-[10px] text-amber-700 font-medium">
                    O si prefieres probar la app de inmediato sin configurar Firebase, inicia en el simulador local:
                  </p>
                  <button
                    type="button"
                    onClick={handleLocalDemoBypass}
                    className="w-full text-center py-1.5 px-3 border border-transparent rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm transition-all"
                  >
                    Iniciar en Modo Demo Local (Simulado)
                  </button>
                </div>
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

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || isLocked}
                className={`w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6A008A] ${
                  (loading || isLocked) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Google
              </button>

              <button
                type="button"
                onClick={handleTestLogin}
                disabled={loading || isLocked}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all ${
                  (loading || isLocked) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Sparkles size={16} className="animate-pulse" />
                <span>{loading ? 'Preparando Demo...' : 'Acceso de Prueba (Modo Demo)'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

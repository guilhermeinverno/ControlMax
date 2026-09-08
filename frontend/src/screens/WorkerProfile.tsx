import { useState, useEffect } from 'react';
import { ArrowLeft, User, Key, Check, Loader2, AlertCircle, LogOut, Download } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { auth } from '../lib/firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { useLayoutUi } from '../hooks/useLayoutUi';

export function WorkerProfile() {
  const { navigate } = useNavigation();
  const user = auth.currentUser;
  
  const [nomes, setNomes] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Real Profile fetch
  useEffect(() => {
    if (!user) return;
    import('firebase/firestore').then(({ doc, getDoc }) => {
      import('../lib/firebase').then(({ db }) => {
        getDoc(doc(db, 'users', user.uid)).then(snap => {
          if (snap.exists()) {
            const data = snap.data();
            setNomes(data.name || '');
            setTelefone(data.phone || '');
          }
          setLoadingProfile(false);
        }).catch(() => setLoadingProfile(false));
      });
    });
  }, [user]);

  const [documento, setDocumento] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const { handleInstallClick } = useLayoutUi();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await setDoc(doc(db, 'users', user.uid), {
        name: nomes,
        phone: telefone,
      }, { merge: true });
      import('react-hot-toast').then(({ toast }) => toast.success('Perfil salvo com sucesso!'));
      
      // If they just completed first access
      const { role } = await import('../hooks/useTenantHelpers').then(m => m.mapRoleFromFirestore('collector', user.email || ''));
      navigate('dashboard');
    } catch (err) {
      console.error(err);
      import('react-hot-toast').then(({ toast }) => toast.error('Erro ao salvar perfil.'));
    }
    setSavingProfile(false);
  };

  // Generate a mock PIN based on user metadata or static reference
  const pinCode = user?.uid ? `CM${user.uid.substring(0, 10).toUpperCase()}` : 'CM65BKKQ2073';

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setUpdatingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      if (user) {
        await updatePassword(user, newPassword);
        setPasswordSuccess('Senha alterada com sucesso! Você pode fechar esta tela.');
        setNewPassword('');
      } else {
        setPasswordError('Nenhum usuário logado.');
      }
    } catch (err: any) {
      setPasswordError(
        err.code === 'auth/requires-recent-login'
          ? 'Você precisa fazer login novamente para alterar a senha.'
          : 'Erro ao alterar a senha. Tente novamente.'
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F5F5F7] min-h-screen text-[#333333] -m-4 pb-16 relative">

      {/* Header Banner - Matches screenshot purple style */}
      <div className="bg-[#6A008A] text-white pt-4 pb-6 px-4 shadow-sm relative flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('dashboard')}
            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black tracking-wide lowercase text-center flex-1 pr-8">
            perfil do trabalhador
          </h1>
        </div>

        {/* PIN Identifier */}
        <div className="text-white font-bold text-sm tracking-widest mt-2 uppercase">
          PIN: {pinCode}
        </div>
      </div>

      {/* Main Profile Card Layout */}
      <div className="px-4 -mt-3 relative z-10 max-w-md mx-auto w-full">
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 border border-slate-100 space-y-5">
          {/* Section title with customized personal avatar icon */}
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-slate-800" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Informação pessoal
            </h2>
          </div>

          {/* Form Fields - Matches the nested-label-in-border screenshot look */}
          <div className="space-y-4 pt-1">
            {/* Nomes */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                Nomes
              </label>
              <input
                type="text"
                value={nomes}
                onChange={(e) => setNomes(e.target.value)}
                placeholder="Ex: Jose"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
                required
              />
            </div>

            {/* Telefone */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                Telefone
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 61998132100"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col space-y-2">
            <button
              type="submit"
              className="w-full bg-[#6A008A] hover:bg-[#580073] active:bg-[#48005e] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-all uppercase tracking-wider text-xs cursor-pointer"
            >
              Salvar Alterações
            </button>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full border border-[#6A008A] text-[#6A008A] hover:bg-purple-50 active:bg-purple-100 font-extrabold py-3 px-4 rounded-xl transition-all uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Alterar Senha</span>
            </button>
          </div>
        </form>

        {/* PROMINENT LOGOUT / CERRAR SESION BUTTON */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              signOut(auth);
              navigate('dashboard');
            }}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black py-4 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-sm border-none outline-none"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión (Sair da Conta)</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center">
              <Key className="w-4 h-4 mr-2 text-[#6A008A]" />
              Alterar a sua Senha
            </h3>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-xs mb-3 flex items-center">
                <Check className="w-4 h-4 mr-2 shrink-0 text-green-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative mt-2">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                  Nova Senha (mínimo 6 dígitos)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] font-mono"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex-1 bg-[#6A008A] hover:bg-[#52006A] text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center cursor-pointer"
                >
                  {updatingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

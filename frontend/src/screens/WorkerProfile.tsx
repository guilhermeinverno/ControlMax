import { useState } from 'react';
import { ArrowLeft, User, Key, Check, Loader2, AlertCircle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { auth } from '../lib/firebase';
import { updatePassword } from 'firebase/auth';

export function WorkerProfile() {
  const { navigate } = useNavigation();
  const user = auth.currentUser;

  // Split name for mock display if firebase names aren't set
  const fullName = user?.displayName || 'Jose Alvares';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'jose';
  const lastName = nameParts.slice(1).join(' ') || 'alvares';

  // Local editable form state
  const [nomes, setNomes] = useState(firstName);
  const [sobrenomes, setSobrenomes] = useState(lastName);
  const [documento, setDocumento] = useState('00793275164');
  const [apelido, setApelido] = useState(firstName.toLowerCase());
  const [telefone, setTelefone] = useState('61998132100');
  const [email, setEmail] = useState(user?.email || 'maildojg@gmail.com');

  // Change password states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Generate a mock PIN based on user metadata or static reference
  const pinCode = user?.uid ? `TC${user.uid.substring(0, 10).toUpperCase()}` : 'TC65BKKQ2073';

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      if (user) {
        await updatePassword(user, newPassword);
        setPasswordSuccess('Senha atualizada com sucesso!');
        setNewPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess(null);
        }, 1800);
      } else {
        throw new Error('Usuário não autenticado');
      }
    } catch (err: any) {
      console.error('Error updating password:', err);
      setPasswordError(err?.message || 'Erro ao atualizar a senha. Tente fazer login novamente.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col bg-[#F5F5F7] min-h-screen text-[#333333] -m-4 pb-16 relative">
      {/* Dynamic Saving Toast Notification */}
      {showSaveToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#6A008A] text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-[#8CC63F]" strokeWidth={3} />
          <span>Perfil salvo com sucesso!</span>
        </div>
      )}

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

            {/* Sobrenomes */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                Sobrenomes
              </label>
              <input
                type="text"
                value={sobrenomes}
                onChange={(e) => setSobrenomes(e.target.value)}
                placeholder="Ex: Alvares"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
                required
              />
            </div>

            {/* Documento */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                Documento
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ex: 00793275164"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
              />
            </div>

            {/* Apelido */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                Apelido
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: jose"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
              />
            </div>

            {/* Telefone */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                Teléfono Telefone
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 61998132100"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
              />
            </div>

            {/* E-mail */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-500 font-semibold tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: maildojg@gmail.com"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col space-y-3">
            <button
              type="submit"
              className="w-full bg-[#6A008A] hover:bg-[#52006A] text-white font-black text-xs uppercase tracking-wide py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full border-2 border-[#6A008A] text-[#6A008A] bg-transparent hover:bg-purple-50 font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Key className="w-4 h-4" />
              <span>alterar a senha</span>
            </button>
          </div>
        </form>
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

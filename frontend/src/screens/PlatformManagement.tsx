import { useState, useEffect } from 'react';
import type { FormOrButtonEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { db } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Sliders, 
  Save, 
  RefreshCw, 
  Building2, 
  Phone, 
  Mail, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  MessageSquare, 
  Clock, 
  Megaphone, 
  Info, 
  AppWindow, 
  Lock, 
  CheckCircle, 
  CheckSquare, 
  Sparkles,
  Map,
  Shield,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlatformManagementProps {
  onNavigate?: (screen: Screen) => void;
}

interface PlatformSettings {
  platformName: string;
  supportPhone: string;
  supportEmail: string;
  logoUrl: string;
  slogan: string;
  currency: string;
  defaultMonthlyInterest: number;
  defaultLateFeePercentage: number;
  allowRefinance: boolean;
  maxCreditLimit: number; // in cents
  enableInsurance: boolean;
  enableFinance: boolean;
  enableMap: boolean;
  enableWhatsAppAlerts: boolean;
  maintenanceMode: boolean;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  bannerMessage: string;
  requireDeviceVerification: boolean;
  allowOfflineSync: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'ControlMax',
  supportPhone: '+5511999999999',
  supportEmail: 'suporte@controlmax.com',
  logoUrl: '',
  slogan: 'Gestión Inteligente de Cobranzas y Microcréditos',
  currency: 'COP',
  defaultMonthlyInterest: 20,
  defaultLateFeePercentage: 5,
  allowRefinance: true,
  maxCreditLimit: 10000000, // $100.000,00
  enableInsurance: true,
  enableFinance: true,
  enableMap: true,
  enableWhatsAppAlerts: true,
  maintenanceMode: false,
  operatingHoursStart: '06:00',
  operatingHoursEnd: '21:00',
  bannerMessage: '¡Bienvenidos al panel unificado de ControlMax!',
  requireDeviceVerification: false,
  allowOfflineSync: true
};

export function PlatformManagement({ onNavigate }: PlatformManagementProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active sub-section
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'modules' | 'security'>('general');

  // Load platform settings for the tenant
  useEffect(() => {
    if (!tenantId) return;

    const loadSettings = async () => {
      setLoadingSettings(true);
      setErrorMsg(null);
      try {
        const settingsDocRef = doc(db, 'platform_settings', tenantId);
        const snap = await getDoc(settingsDocRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            platformName: data.platformName || DEFAULT_SETTINGS.platformName,
            supportPhone: data.supportPhone || DEFAULT_SETTINGS.supportPhone,
            supportEmail: data.supportEmail || DEFAULT_SETTINGS.supportEmail,
            logoUrl: data.logoUrl || DEFAULT_SETTINGS.logoUrl,
            slogan: data.slogan || DEFAULT_SETTINGS.slogan,
            currency: data.currency || DEFAULT_SETTINGS.currency,
            defaultMonthlyInterest: data.defaultMonthlyInterest !== undefined ? Number(data.defaultMonthlyInterest) : DEFAULT_SETTINGS.defaultMonthlyInterest,
            defaultLateFeePercentage: data.defaultLateFeePercentage !== undefined ? Number(data.defaultLateFeePercentage) : DEFAULT_SETTINGS.defaultLateFeePercentage,
            allowRefinance: data.allowRefinance !== undefined ? Boolean(data.allowRefinance) : DEFAULT_SETTINGS.allowRefinance,
            maxCreditLimit: data.maxCreditLimit !== undefined ? Number(data.maxCreditLimit) : DEFAULT_SETTINGS.maxCreditLimit,
            enableInsurance: data.enableInsurance !== undefined ? Boolean(data.enableInsurance) : DEFAULT_SETTINGS.enableInsurance,
            enableFinance: data.enableFinance !== undefined ? Boolean(data.enableFinance) : DEFAULT_SETTINGS.enableFinance,
            enableMap: data.enableMap !== undefined ? Boolean(data.enableMap) : DEFAULT_SETTINGS.enableMap,
            enableWhatsAppAlerts: data.enableWhatsAppAlerts !== undefined ? Boolean(data.enableWhatsAppAlerts) : DEFAULT_SETTINGS.enableWhatsAppAlerts,
            maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : DEFAULT_SETTINGS.maintenanceMode,
            operatingHoursStart: data.operatingHoursStart || DEFAULT_SETTINGS.operatingHoursStart,
            operatingHoursEnd: data.operatingHoursEnd || DEFAULT_SETTINGS.operatingHoursEnd,
            bannerMessage: data.bannerMessage || DEFAULT_SETTINGS.bannerMessage,
            requireDeviceVerification: data.requireDeviceVerification !== undefined ? Boolean(data.requireDeviceVerification) : DEFAULT_SETTINGS.requireDeviceVerification,
            allowOfflineSync: data.allowOfflineSync !== undefined ? Boolean(data.allowOfflineSync) : DEFAULT_SETTINGS.allowOfflineSync
          });
        } else {
          // If no doc exists, we persist the default one
          await setDoc(settingsDocRef, { ...DEFAULT_SETTINGS, tenantId });
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err: unknown) {
        console.error("Error loading platform settings:", err);
        setErrorMsg("Error al conectar con Firestore. Usando parámetros locales de respaldo.");
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [tenantId]);

  const handleSave = async (e: FormOrButtonEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const settingsDocRef = doc(db, 'platform_settings', tenantId);
      await setDoc(settingsDocRef, {
        ...settings,
        tenantId,
        updatedAt: new Date()
      }, { merge: true });

      // If they changed the platform name, also update the main tenant name
      const tenantDocRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantDocRef, {
        name: settings.platformName
      }).catch(err => console.log("Non-blocking error updating tenant name:", err));

      setSuccessMsg("¡Configuración de la plataforma guardada y aplicada con éxito!");
      
      // Auto-clear message
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err: unknown) {
      console.error("Error saving platform settings:", err);
      setErrorMsg("No se pudo persistir la configuración. Verifique los permisos administrativos.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PlatformSettings, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (tenantLoading || loadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#333333]">
        <div className="w-10 h-10 border-4 border-[#6A008A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Cargando gestión de plataforma...</p>
      </div>
    );
  }

  // Double check authorization (only admins and superadmins can access this)
  const isAuthorized = role === 'admin' || isSuperAdmin;
  if (!isAuthorized) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg mx-auto text-center shadow-md">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-base font-black text-red-600 uppercase tracking-wide">Acceso Restringido</h3>
        <p className="text-xs text-gray-650 mt-2">
          Lo sentimos, el panel de <strong>Gestión de la Plataforma</strong> está reservado únicamente para Administradores de Cuenta y propietarios de licencias SaaS.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="mt-6 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs py-2 px-4 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden flex flex-col min-h-[600px]">
      
      {/* 1. BRAND HEADER */}
      <div className="bg-[#6A008A] p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#52006A] shadow-inner relative overflow-hidden">
        
        {/* Abstract design elements */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
            <Sliders className="w-6 h-6 text-[#8CC63F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Gestión de la Plataforma</h2>
              <span className="bg-[#8CC63F] text-[#4A0063] font-black text-[9px] px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-widest">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-purple-100/90 mt-1 font-medium">
              Ajustes globales de marca, topes de operación, módulos del ecosistema e índices de seguridad de su empresa.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#8CC63F] hover:bg-[#7cb337] active:scale-98 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider shrink-0 relative z-10 cursor-pointer disabled:opacity-50 border border-white/10"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Guardar Configuración</span>
        </button>
      </div>

      {/* 2. LIVE NOTIFICATIONS */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border-b border-rose-100 text-rose-800 px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SUB-MENU LAYOUT & SETTINGS CONTROLS */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation Sidebar inside screen */}
        <aside className="w-full lg:w-64 bg-gray-50 border-r border-gray-200 shrink-0 flex flex-row lg:flex-col py-1.5 lg:py-4 px-2.5 gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-x-visible">
          
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'general'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>1. Datos de Identidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'financial'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>2. Reglas Financieras</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'modules'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <AppWindow className="w-4 h-4 shrink-0" />
            <span>3. Módulos & Alertas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'security'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>4. Control & Horario</span>
          </button>

        </aside>

        {/* Form Body View */}
        <form onSubmit={handleSave} className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
          
          <AnimatePresence mode="wait">
            
            {/* SUB-TAB 1: GENERAL IDENTITY BRAND */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8CC63F]" />
                    Branding & Identidad Corporativa
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Personalice la firma, el logotipo de soporte y el nombre representativo que verán los operadores.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Nombre de la Plataforma / Empresa *
                    </label>
                    <input 
                      type="text"
                      required
                      value={settings.platformName}
                      onChange={(e) => handleInputChange('platformName', e.target.value)}
                      placeholder="Ej. ControlMax Nordeste"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Slogan o Frase Descriptiva
                    </label>
                    <input 
                      type="text"
                      value={settings.slogan}
                      onChange={(e) => handleInputChange('slogan', e.target.value)}
                      placeholder="Ej. Eficacia y Control en Microfinanzas"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-850 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Teléfono de Soporte (WhatsApp) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        required
                        value={settings.supportPhone}
                        onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                        placeholder="Ej. +5511999999999"
                        className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Usado para redirigir en el botón flotante del asistente. Formato internacional con código de país.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Correo Electrónico de Contacto
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="email"
                        required
                        value={settings.supportEmail}
                        onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                        placeholder="Ej. soporte@empresa.com"
                        className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                    URL de Logotipo Corporativo (Opcional)
                  </label>
                  <input 
                    type="url"
                    value={settings.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://su-plataforma.com/logo.png"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs font-mono"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Introduzca una URL directa para reemplazar el logotipo por defecto del menú principal.
                  </span>
                </div>

                <div className="bg-[#FAF5FF] border border-purple-200 rounded-xl p-4 flex gap-3 text-xs text-[#6A008A]">
                  <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5 uppercase tracking-wider text-[10px]">Anuncio Corporativo Integrado</strong>
                    <p className="text-gray-650 leading-relaxed">
                      El banner global configurado se mostrará para mantener al tanto de las novedades a todos los colaboradores con sesión activa.
                    </p>
                    <input 
                      type="text"
                      value={settings.bannerMessage}
                      onChange={(e) => handleInputChange('bannerMessage', e.target.value)}
                      placeholder="Ej. ¡Felicitaciones al equipo! Meta de recaudo superada ayer."
                      className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 mt-2.5 outline-none focus:border-[#6A008A] text-xs font-bold text-gray-800"
                    />
                  </div>
                </div>

              </motion.div>
            )}

            {/* SUB-TAB 2: GLOBAL FINANCIAL PARAMETERS */}
            {activeTab === 'financial' && (
              <motion.div
                key="financial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#8CC63F]" />
                    Parámetros Operativos & Finanzas
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Configure las tasas mensuales base, el recargo regulado de mora y los límites operacionales de cartera de su inquilino.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Divisa Predeterminada
                    </label>
                    <select 
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none bg-white text-gray-800 shadow-xs"
                    >
                      <option value="COP">COP ($ Peso Colombiano)</option>
                      <option value="BRL">BRL (R$ Real Brasileño)</option>
                      <option value="USD">USD ($ Dólar Americano)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                      <option value="MXN">MXN ($ Peso Mexicano)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Límite Máximo de Crédito por Solicitud ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 text-gray-400 font-extrabold text-xs top-1/2 -translate-y-1/2">$</span>
                      <input 
                        type="number"
                        value={settings.maxCreditLimit / 100}
                        onChange={(e) => handleInputChange('maxCreditLimit', Math.round(Number(e.target.value) * 100))}
                        placeholder="Ej. 100000"
                        className="w-full border border-gray-300 rounded-xl pl-7.5 pr-3.5 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-850 shadow-xs"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Tope de control interno para la aprobación masiva y automática de solicitudes de crédito.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Tasa de Interés Base Mensual (%)
                    </label>
                    <div className="relative">
                      <span className="absolute right-3.5 text-gray-400 font-bold text-xs top-1/2 -translate-y-1/2">% mes</span>
                      <input 
                        type="number"
                        value={settings.defaultMonthlyInterest}
                        onChange={(e) => handleInputChange('defaultMonthlyInterest', Number(e.target.value))}
                        placeholder="Ej. 20"
                        className="w-full border border-gray-300 rounded-xl pl-3.5 pr-14 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Tasa de Recargo de Mora Diario (%)
                    </label>
                    <div className="relative">
                      <span className="absolute right-3.5 text-gray-400 font-bold text-xs top-1/2 -translate-y-1/2">% diario</span>
                      <input 
                        type="number"
                        value={settings.defaultLateFeePercentage}
                        onChange={(e) => handleInputChange('defaultLateFeePercentage', Number(e.target.value))}
                        placeholder="Ej. 5"
                        className="w-full border border-gray-300 rounded-xl pl-3.5 pr-16 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex gap-3">
                    <Percent className="w-5 h-5 text-[#6A008A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Refinanciación de Contratos</strong>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Permitir que el administrador supervisor refinancie de forma masiva cobros atrasados.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('allowRefinance', !settings.allowRefinance)}
                    className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.allowRefinance ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.allowRefinance ? 'translate-x-5.5' : 'translate-x-0'}`} />
                  </button>
                </div>

              </motion.div>
            )}

            {/* SUB-TAB 3: MODULES & WHATSAPP SETTING */}
            {activeTab === 'modules' && (
              <motion.div
                key="modules"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AppWindow className="w-4 h-4 text-[#8CC63F]" />
                    Gestión de Módulos & Integraciones
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Habilite o restrinja módulos del sistema según el flujo y las prioridades comerciales de su equipo.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Module 1: Maps */}
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
                    <div className="flex gap-3">
                      <Map className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Módulo de Mapas y Geolocalización</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Seguimiento cartográfico en tiempo real de los cobradores e impresión de rutas comerciales.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('enableMap', !settings.enableMap)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.enableMap ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.enableMap ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Module 2: Insurance */}
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Módulo de Seguros Obligatorios</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Gestión y recaudo de pólizas de deudores para mitigar el riesgo de incumplimiento por fallecimiento.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('enableInsurance', !settings.enableInsurance)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.enableInsurance ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.enableInsurance ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Module 3: Finance */}
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
                    <div className="flex gap-3">
                      <DollarSign className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Módulo de Finanzas y Tesorería Central</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Auditoría de activos circulantes, caja menor y transferencias interbancarias en el panel.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('enableFinance', !settings.enableFinance)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.enableFinance ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.enableFinance ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Integration 1: WhatsApp alerts */}
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
                    <div className="flex gap-3">
                      <MessageSquare className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Alertas de Notificaciones por WhatsApp</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Envío automático de recibo digital al cliente inmediatamente después del registro de su pago.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('enableWhatsAppAlerts', !settings.enableWhatsAppAlerts)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.enableWhatsAppAlerts ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.enableWhatsAppAlerts ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-650 flex gap-2">
                  <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                  <span>
                    La inhabilitación de un módulo lo ocultará automáticamente del menú general para todos los operadores de menor rango. Sus registros existentes permanecerán seguros e inalterados en la base de datos Firestore.
                  </span>
                </div>

              </motion.div>
            )}

            {/* SUB-TAB 4: OPERATIONAL SECURITY HOURLY WINDOW */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#8CC63F]" />
                    Seguridad Operativa & Control Horario
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Configure las restricciones de seguridad para resguardar la caja y prevenir fraudes operacionales fuera de horarios comerciales.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Inicio de Jornada Permitido (Hora)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="time"
                        value={settings.operatingHoursStart}
                        onChange={(e) => handleInputChange('operatingHoursStart', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
                      Límite de Cierre de Jornada (Hora)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="time"
                        value={settings.operatingHoursEnd}
                        onChange={(e) => handleInputChange('operatingHoursEnd', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Maintenance block */}
                  <div className="border border-red-200 bg-red-50/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex gap-3">
                      <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-red-700 uppercase tracking-wide">Modo de Bloqueo de Emergencia</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Bloquear temporalmente a todos los cobradores y vendedores para auditorías de caja repentinas.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Device registration requirement */}
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex gap-3">
                      <HelpCircle className="w-5 h-5 text-[#6A008A] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Verificación de Dispositivo Requerida</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Restringir el acceso exclusivo al aplicativo únicamente a teléfonos y tablets registrados y homologados.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('requireDeviceVerification', !settings.requireDeviceVerification)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.requireDeviceVerification ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.requireDeviceVerification ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Offline local synchronization */}
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex gap-3">
                      <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Permitir Sincronización Offline de Recaudos</strong>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Habilitar el almacenamiento temporal cifrado de recibos locales cuando no haya cobertura a internet.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('allowOfflineSync', !settings.allowOfflineSync)}
                      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${settings.allowOfflineSync ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings.allowOfflineSync ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

          {/* Form Actions Footer */}
          <div className="border-t border-gray-200 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all uppercase tracking-wide"
            >
              Cerrar Panel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#6A008A] hover:bg-[#52006A] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Todo</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}

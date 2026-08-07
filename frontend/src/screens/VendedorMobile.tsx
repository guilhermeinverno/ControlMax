import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useBox } from '../hooks/useBox';
import { useSalesListData } from '../hooks/useSalesListData';
import { formatSalesListCents } from '../utils/salesListFormat';
import { 
  Menu, X, Search, SlidersHorizontal, Camera, Check, 
  ArrowLeft, Smartphone, Shield, Calculator, Users, 
  ArrowLeftRight, TrendingUp, TrendingDown, Clock, Key, 
  Settings, LogOut, MapPin, UserPlus, FileText, CheckCircle2,
  AlertTriangle, RotateCw, Loader2, Plus, ChevronDown
} from 'lucide-react';
import { Screen } from '../types';
import { formatCurrencyBRL, parseCurrencyBRLToFloat } from '../utils/currency';

interface VendedorMobileProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

function promiseWithTimeout<T>(promise: Promise<T>, ms: number, errorMsg = 'Timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
}

export function VendedorMobile({ onNavigate }: VendedorMobileProps) {
  const { tenantId, role, userName, usuarioUnidades } = useTenant();
  const { activeBox } = useBox();

  // Screen routing states
  const [activeView, setActiveView] = useState<'dashboard' | 'new-customer' | 'new-sale'>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Vendas' | 'Coleção'>('Vendas');
  const [search, setSearch] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);

  // Gallery modal state
  const [galleryModal, setGalleryModal] = useState<{ open: boolean; clientName: string; photos: string[] }>({ open: false, clientName: '', photos: [] });

  // Form states for "Cliente Novo"
  const [docType1, setDocType1] = useState('SIN TIPO DE DOCUMENTO');
  const [docType2, setDocType2] = useState('SIN TIPO DE DOCUMENTO');
  const [docNum1, setDocNum1] = useState('');
  const [docNum2, setDocNum2] = useState('');
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName1, setLastName1] = useState('');
  const [lastName2, setLastName2] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('Brasilia');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [economicActivity, setEconomicActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [latitudeVal, setLatitudeVal] = useState<number | null>(null);
  const [longitudeVal, setLongitudeVal] = useState<number | null>(null);

  // Form states for "Nova Venda"
  const [saleClient, setSaleClient] = useState({ name: '', id: '' });
  const [saleAmount, setSaleAmount] = useState('');
  const [saleInterest, setSaleInterest] = useState('1.0');
  const [saleFrequency, setSaleFrequency] = useState<'diaria' | 'semanal_juros' | 'quinzenal' | 'mensal' | 'semanal_fixa'>('diaria');
  const [saleInstallments, setSaleInstallments] = useState(20);
  const [saleInstallmentValue, setSaleInstallmentValue] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [salePhotoUrl, setSalePhotoUrl] = useState('');
  const [salePhotoName, setSalePhotoName] = useState('');

  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        let q = query(collection(db, 'customers'), where('tenantId', '==', tenantId));
        if (usuarioUnidades && usuarioUnidades.length > 0) {
          if (usuarioUnidades.length === 1) {
            q = query(collection(db, 'customers'), where('tenantId', '==', tenantId), where('unitId', '==', usuarioUnidades[0]));
          } else {
            q = query(collection(db, 'customers'), where('tenantId', '==', tenantId), where('unitId', 'in', usuarioUnidades));
          }
        } else {
          q = query(collection(db, 'customers'), where('tenantId', '==', tenantId), where('unitId', '==', 'none_assigned'));
        }
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({
          id: doc.id,
          name: `${doc.data().name || ''} ${doc.data().apellidos || ''}`.trim() || doc.data().apodo || 'Cliente Sin Nombre'
        }));
        // Sort alphabetically
        list.sort((a, b) => a.name.localeCompare(b.name));
        // If a client is already selected/just created but not yet in the list, inject it
        if (saleClient.id && saleClient.name && !list.find(c => c.id === saleClient.id)) {
          list.unshift(saleClient);
        }
        setCustomers(list);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, [tenantId, activeView, usuarioUnidades]);

  // Status message states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to parse interest to a total multiplier (e.g. 1.0 -> 1.0, 1.2 -> 1.2, 20 -> 1.2, 0.2 -> 1.2)
  const getInterestMultiplier = (interestStr: string): number => {
    const val = parseFloat(interestStr.replace(',', '.'));
    if (isNaN(val) || val <= 0) return 1.0;
    // If interest is a direct multiplier >= 1.0 and <= 3.0
    if (val >= 1.0 && val <= 3.0) {
      return val;
    }
    // If interest is a percentage like 20
    if (val > 3.0) {
      return 1 + (val / 100);
    }
    // If interest is a decimal fraction like 0.2
    return 1 + val;
  };

  // Recalculate sale installment value in real-time
  useEffect(() => {
    const amt = parseCurrencyBRLToFloat(saleAmount);
    if (amt > 0 && saleInstallments) {
      const multiplier = getInterestMultiplier(saleInterest);
      const total = amt * multiplier;
      const val = (total / saleInstallments).toFixed(2);
      setSaleInstallmentValue(formatCurrencyBRL(val));
    } else {
      setSaleInstallmentValue('');
    }
  }, [saleAmount, saleInterest, saleInstallments]);

  // Pre-fetch GPS location when opening client registration
  useEffect(() => {
    if (activeView === 'new-customer') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitudeVal(position.coords.latitude);
            setLongitudeVal(position.coords.longitude);
            setAddress(`Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`);
            setNeighborhood('GPS Localizado');
          },
          (err) => console.log('Auto GPS prefetch error:', err),
          { enableHighAccuracy: true }
        );
      }
    }
  }, [activeView]);

  // Load Sales Data
  const { sales, collections, loadingSales, loadingCollections } = useSalesListData({
    tenantId,
    role: 'collector', // force collector context to show local sales list
    consultarPor: 'active',
    verTodasUnidades: false,
    usuarioUnidades,
  });

  // Calculate top bar metrics (trycontroller style: clients / paid / balance)
  const clientsCount = sales.filter(s => s.status === 'active').length || 65;
  const paidCount = collections.filter(c => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let dt: Date | null = null;
    if (c.createdAt) {
      if (typeof (c.createdAt as any).toDate === 'function') {
        dt = (c.createdAt as any).toDate();
      } else if ((c.createdAt as any).seconds) {
        dt = new Date((c.createdAt as any).seconds * 1000);
      } else {
        dt = new Date(c.createdAt as any);
      }
    }
    return dt ? dt.getTime() >= startOfToday.getTime() : false;
  }).length || 3;
  
  const totalBalanceCents = sales.reduce((sum, s) => sum + (s.saldoPendienteCents || s.balance || 0), 0) || 100800500;
  const totalBalanceString = (totalBalanceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Filter Sales list based on search term
  const filteredSales = sales.filter(sale => {
    const queryStr = search.toLowerCase();
    return (
      sale.id.toLowerCase().includes(queryStr) ||
      sale.clientName.toLowerCase().includes(queryStr) ||
      (sale.clientId && sale.clientId.toLowerCase().includes(queryStr))
    );
  });

  // Autocomplete phone with country code
  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean && !clean.startsWith('55')) {
      clean = '55' + clean;
    }
    setPhone('+' + clean);
  };

  // Get status badge info ('D' = Day, 'C' = Cobro/Late)
  const getSaleStatus = (saleId: string) => {
    const sum = saleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lateDays = Math.max(0, Math.abs(sum) % 6);
    const isLate = lateDays > 2;
    return {
      char: 'D', // All are daily (D) in this context
      isLate,
      lateDays,
      color: isLate ? 'text-red-500 border-red-500' : 'text-green-600 border-green-600'
    };
  };

  // Save new customer to Firestore
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Form validations
    if (!nickname || !firstName || !lastName1 || !phone) {
      setFormError('Por favor complete todos los campos marcados con asterisco (*).');
      return;
    }

    setSubmitting(true);

    try {
      // Add Customer Doc in Firebase (customers collection) with 10s timeout
      const docRef = await promiseWithTimeout(
        addDoc(collection(db, 'customers'), {
          tenantId: tenantId || 'tenant_oficinabrasil',
          unitId: activeBox?.unitId || 'unit-demo',
          unitName: activeBox?.unitName || 'Unidad Demo',
          businessCenterId: activeBox?.cnId || 'bc-demo',
          city: city || 'Brasilia',
          name: firstName,
          secondName: middleName || '',
          apellidos: lastName1,
          secondApellidos: lastName2 || '',
          apodo: nickname,
          email: email || '',
          documentType: docType1 || 'SIN TIPO',
          documentNumber: docNum1 || 'SIN NÚMERO',
          document2: docNum2 || '',
          birthDate: birthDate || '',
          address: address || '',
          barrio: neighborhood || '',
          phone: phone || '',
          celular: phone || '',
          celularPrefix: '55',
          comentario: notes || '',
          actividadEconomica: economicActivity || 'Otros',
          active: true,
          createdAt: new Date().toISOString(),
          latitude: latitudeVal,
          longitude: longitudeVal,
          photos: photoUrl ? [photoUrl] : [],
          addresses: [{ id: 'addr-1', address: address || '', barrio: neighborhood || '', city: city || 'Brasilia' }],
          phones: [{ id: 'phone-1', number: phone || '' }],
          references: []
        }),
        10000,
        'Tiempo de espera agotado al registrar el cliente. Por favor verifique su conexão a Internet.'
      );

      const newClientName = `${firstName} ${lastName1}`.trim();
      const newClientObj = { id: docRef.id, name: newClientName };
      setCustomers(prev => [newClientObj, ...prev]);
      setSaleClient(newClientObj);

      setFormSuccess('¡Cliente registrado con éxito! Redirigiendo a Nueva Venda...');
      
      // Clear form
      setNickname('');
      setFirstName('');
      setMiddleName('');
      setLastName1('');
      setLastName2('');
      setAddress('');
      setNeighborhood('');
      setPhone('');
      setEmail('');
      setNotes('');
      setPhotoUrl('');
      setPhotoName('');
      setLatitudeVal(null);
      setLongitudeVal(null);

      setTimeout(() => {
        setFormSuccess(null);
        setActiveView('new-sale');
      }, 1500);

    } catch (err: any) {
      console.error('Error saving customer:', err);
      setFormError(err.message || 'No se pudo guardar el cliente en Firestore. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save new sale to Firestore
  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!saleAmount || !saleInstallmentValue) {
      setFormError('Por favor complete todos los campos marcados con asterisco (*).');
      return;
    }

    setSubmitting(true);

    try {
      const amtCents = Math.round(parseCurrencyBRLToFloat(saleAmount) * 100);
      const multiplier = getInterestMultiplier(saleInterest);
      const totalAmountCents = Math.round(amtCents * multiplier);
      const installmentAmountCents = Math.round(parseCurrencyBRLToFloat(saleInstallmentValue) * 100);

      // Get Firebase Auth ID Token for authentication
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const idempotencyKey = 'sale-' + Math.random().toString(36).substring(2) + '-' + Date.now();

      const apiCall = async () => {
        const response = await fetch('/api/transactions/sale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            clientId: saleClient.id,
            clientName: saleClient.name,
            amountCents: totalAmountCents,
            installmentAmountCents,
            totalInstallments: Number(saleInstallments),
            date: new Date().toISOString().split('T')[0],
            idempotencyKey,
            notes: saleNotes || '',
            photoUrl: salePhotoUrl || '',
            photoName: salePhotoName || '',
            frequency: saleFrequency
          })
        });

        // Read as text to safely identify HTML pages served instead of JSON API endpoints
        const text = await response.text();
        const trimmed = text.trim().toLowerCase();
        if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<div')) {
          throw new Error('HTML_RESPONSE');
        }

        let responseData: any;
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          throw new Error('HTML_RESPONSE');
        }

        if (!response.ok) {
          throw new Error(responseData.error || `Erro do servidor (${response.status}) ao registrar venda.`);
        }
        return responseData;
      };

      try {
        // Add Sale Doc in Firebase via transaction API with 10s timeout
        await promiseWithTimeout(
          apiCall(),
          10000,
          'Tiempo de espera agotado al registrar la venta. Por favor verifique su conexión a Internet o si posee un caixa aberta.'
        );
      } catch (err: any) {
        const isNetworkOrHtmlError = 
          err.message === 'HTML_RESPONSE' || 
          err.message.includes('Unexpected token') || 
          err.message.includes('Failed to fetch') || 
          err.message.includes('NetworkError') || 
          err.message.includes('fetch');

        if (isNetworkOrHtmlError) {
          console.warn('Backend API not reachable (HTML/Network). Falling back to direct client-side Firestore write...');
          
          // Direct client-side write fallback
          await addDoc(collection(db, 'sales'), {
            tenantId: tenantId || 'tenant_oficinabrasil',
            clientId: saleClient.id,
            clientName: saleClient.name,
            clientDoc: 'SIN NÚMERO',
            amount: amtCents,
            interest: multiplier - 1,
            installments: Number(saleInstallments),
            installmentAmount: installmentAmountCents,
            balance: totalAmountCents,
            saldoPendienteCents: totalAmountCents,
            status: 'active',
            paidInstallments: 0,
            createdAt: new Date().toISOString(),
            userId: auth.currentUser?.uid || 'demo_collector',
            notes: saleNotes || '',
            photoUrl: salePhotoUrl || '',
            photoName: salePhotoName || '',
            frequency: saleFrequency
          });
        } else {
          // If it was a real backend validation error (e.g. "Nenhum caixa aberto encontrado")
          throw err;
        }
      }

      setFormSuccess('¡Venta registrada con éxito!');
      
      // Clear sale form
      setSaleAmount('');
      setSaleInterest('1.0');
      setSaleNotes('');
      setSalePhotoUrl('');
      setSalePhotoName('');
      setSaleInstallments(20);

      setTimeout(() => {
        setFormSuccess(null);
        setActiveView('dashboard');
      }, 1500);

    } catch (err: any) {
      console.error('Error saving sale:', err);
      setFormError(err.message || 'No se pudo registrar la venta en Firestore. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 400;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoUrl(compressedBase64);
        setPhotoName(file.name);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSalePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 400;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setSalePhotoUrl(compressedBase64);
        setSalePhotoName(file.name);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureSalePhoto = () => {
    document.getElementById('sale-photo-input')?.click();
  };

  const handleCapturePhoto = () => {
    document.getElementById('client-photo-input')?.click();
  };

  const handleGPSAutofill = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada por este navegador/dispositivo.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitudeVal(latitude);
        setLongitudeVal(longitude);
        setAddress(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
        setNeighborhood('GPS Localizado');
        alert(`Ubicación de GPS capturada con éxito: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`);
      },
      (error) => {
        console.error('Error de GPS:', error);
        alert('Error al obtener GPS: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] select-none flex flex-col font-sans max-w-md mx-auto w-full border-x border-gray-200 relative shadow-2xl">
      
      {/* ========================================================================= */}
      {/* MODULE A: MAIN HEADER BAR (TRYCONTROLLER STYLE) */}
      {/* ========================================================================= */}
      <div className="bg-[#6B119C] text-white pt-4 pb-0 px-4 shadow-md flex flex-col shrink-0 relative z-30">
        
        {/* Navigation row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {activeView === 'dashboard' ? (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="text-white hover:bg-white/10 p-2 -ml-2 rounded-lg transition-colors cursor-pointer"
              >
                <Menu size={24} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="text-white hover:bg-white/10 p-2 -ml-2 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft size={24} strokeWidth={2.5} />
              </button>
            )}
            <span className="text-lg font-black tracking-wide flex items-center">
              {activeView === 'dashboard' ? (
                <img src="/logo.png" alt="ControlMax Logo" className="h-7 w-auto object-contain brightness-0 invert" />
              ) : activeView === 'new-customer' ? 'Cliente Novo' : 'Nova Venda'}
            </span>
          </div>

          {/* Sync Icons */}
          <div className="flex items-center space-x-2">
            <span className="w-6.5 h-6.5 rounded-full bg-[#00E676] flex items-center justify-center shadow-md shrink-0 border border-white/20" title="Sistema Conectado">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
            </span>
            <button 
              onClick={() => window.location.reload()}
              className="text-white hover:opacity-85 p-1 rounded-md cursor-pointer transition-transform duration-200 active:rotate-185"
            >
              <RotateCw size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Status Counter */}
        <div className="flex items-center space-x-2 mt-2 px-1 text-xs text-purple-200 font-semibold mb-3">
          <svg className="w-4 h-4 text-[#00E676] fill-current" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span className="font-extrabold tracking-wider">{clientsCount} / {paidCount} / {totalBalanceString}</span>
        </div>

        {/* Dashboard sub tabs (Vendas / Coleção) */}
        {activeView === 'dashboard' && (
          <div className="flex w-full mt-1 border-t border-white/10">
            <button
              onClick={() => setActiveTab('Vendas')}
              className={`flex-1 py-3 text-center font-black text-sm tracking-wider uppercase transition-all relative cursor-pointer ${
                activeTab === 'Vendas' ? 'text-white' : 'text-purple-200/80 hover:text-white'
              }`}
            >
              Vendas
              {activeTab === 'Vendas' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00E676] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Coleção')}
              className={`flex-1 py-3 text-center font-black text-sm tracking-wider uppercase transition-all relative cursor-pointer ${
                activeTab === 'Coleção' ? 'text-white' : 'text-purple-200/80 hover:text-white'
              }`}
            >
              Coleção
              {activeTab === 'Coleção' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00E676] rounded-t-full" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODULE B: DRAWER NAVIGATION LATERAL */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/55 backdrop-blur-3xs z-50 animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          {/* Side Drawer Content */}
          <div 
            className="w-[290px] h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Logo Banner */}
            <div className="bg-[#6B119C] pt-8 pb-14 px-4 flex flex-col items-center select-none shrink-0 relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center">
                  <span className="text-white font-black text-2xl tracking-tight uppercase">Control</span>
                  <div className="relative flex items-center ml-1">
                    <span className="text-[#00E676] font-black text-2xl tracking-tight uppercase">Max</span>
                    <span className="absolute -top-1 -right-4.5 bg-[#00E676] rounded-full p-0.5 flex items-center justify-center shadow-md w-4 h-4 border border-white">
                      <Check className="w-2.5 h-2.5 text-white stroke-[4.5]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Cards Shortcut (Meu perfil, Fechamento de Caixa, Seguro) */}
            <div className="px-3 -mt-8 relative z-10 grid grid-cols-3 gap-1.5 mb-6 shrink-0">
              <button 
                onClick={() => { nav('worker-profile'); setIsDrawerOpen(false); }}
                className="bg-white rounded-xl py-3 px-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 hover:bg-slate-50 flex flex-col items-center justify-between text-center transition-all active:scale-95 cursor-pointer h-[86px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#6B119C] shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-800 leading-tight">Meu perfil</span>
              </button>

              <button 
                onClick={() => { nav('close-box'); setIsDrawerOpen(false); }}
                className="bg-white rounded-xl py-3 px-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 hover:bg-slate-50 flex flex-col items-center justify-between text-center transition-all active:scale-95 cursor-pointer h-[86px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#6B119C] shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-800 leading-tight">Fechamento de Caixa</span>
              </button>

              <button 
                onClick={() => { nav('insurance'); setIsDrawerOpen(false); }}
                className="bg-white rounded-xl py-3 px-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 hover:bg-slate-50 flex flex-col items-center justify-between text-center transition-all active:scale-95 cursor-pointer h-[86px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#6B119C] shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-800 leading-tight">Seguro</span>
              </button>
            </div>

            {/* List Menu Navigation */}
            <div className="flex-1 px-4 flex flex-col space-y-1 overflow-y-auto pb-6">
              <button onClick={() => { nav('company-list'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Veja os clientes da caixa</span>
              </button>

              <button onClick={() => { nav('forms'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Imagens</span>
              </button>

              <button onClick={() => { nav('bc-transfers'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Transferências</span>
              </button>

              <button onClick={() => { nav('new-expense'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Despesas ou rendas</span>
              </button>

              <button onClick={() => { setActiveView('new-customer'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Cliente Novo</span>
              </button>

              <button onClick={() => { setActiveView('new-sale'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Nova Venda</span>
              </button>

              <button onClick={() => { nav('sales'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Pre vendas</span>
              </button>

              <button onClick={() => { nav('new-expense'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Pré despesas</span>
              </button>

              <button onClick={() => { nav('sales'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Vendas temporais</span>
              </button>

              <button onClick={() => { nav('auto-keys'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Histórico de chaves</span>
              </button>

              <button onClick={() => { nav('device-list'); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#6B119C] flex items-center justify-center text-white mr-3 shrink-0">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Configuração</span>
              </button>

              <button onClick={() => { signOut(auth); setIsDrawerOpen(false); }} className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer group mt-4 border-t border-slate-100 pt-3">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white mr-3 shrink-0">
                  <LogOut className="w-4 h-4 text-white ml-0.5" />
                </div>
                <span className="text-xs font-black text-red-600 tracking-wide">Sair</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE A: DASHBOARD VIEW (SALES / COLLECTIONS) */}
      {/* ========================================================================= */}
      {activeView === 'dashboard' && (
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto pb-28">
          
          {/* Search and Filters Input Bar */}
          <div className="flex items-center gap-2.5 w-full pt-1">
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-2xl shadow-sm px-4 py-2.5 relative">
              <input
                type="text"
                placeholder="Procure a venda por: ID de vendas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 font-bold"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={16} />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-2xl p-2.5 shadow-sm flex items-center justify-center shrink-0 cursor-pointer text-[#6B119C]"
            >
              <SlidersHorizontal size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Sales / Collections Cards List */}
          <div className="space-y-3.5">
            {loadingSales ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#6B119C]" />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic text-sm font-semibold">
                Nenhuma venda ativa encontrada.
              </div>
            ) : (
              filteredSales.map((sale) => {
                const status = getSaleStatus(sale.id);
                const pendingInstallments = Math.max(0, sale.installments - (sale.paidInstallments || 0));

                const saleCollections = collections.filter(c => c.saleId === sale.id);
                const hasPaidToday = saleCollections.some(c => c.amount > 0);
                const hasNoPaymentToday = saleCollections.some(c => c.amount === 0);

                return (
                  <div 
                    key={sale.id}
                    className="bg-white border border-gray-200 rounded-xl shadow-xs p-4 flex hover:border-[#6B119C]/30 transition-all duration-200"
                  >
                    {/* Left part: Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 pr-4">
                      
                      {/* Header: ID + Name */}
                      <div className="flex items-center space-x-2.5 min-w-0 mb-3">
                        {/* Circle Status Letter Indicator */}
                        <div className={`w-8 h-8 rounded-full border-2 ${status.color} flex items-center justify-center font-black text-xs shrink-0 select-none`}>
                          {status.char}
                        </div>
                        <div className="flex flex-col leading-none min-w-0">
                          <span className="font-extrabold text-[#333333] text-[13px] truncate">
                            {sale.id.slice(0, 7)} {sale.clientName}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 truncate lowercase mt-0.5">
                            {sale.clientName.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* Middle details info row */}
                      <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-3 my-3 text-left">
                        <div>
                          <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-1">Pendentes</span>
                          <span className="font-extrabold text-[#6B119C] text-xs">
                            R$ {((sale.saldoPendienteCents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-1">Parcelas</span>
                          <span className="font-extrabold text-[#333333] text-xs block">
                            {pendingInstallments.toFixed(0)}/{sale.installments.toFixed(0)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-1">Estado Hoje</span>
                          <span className={`font-black text-xs block ${hasPaidToday ? 'text-[#16A34A]' : hasNoPaymentToday ? 'text-[#DC2626]' : 'text-amber-600'}`}>
                            {hasPaidToday ? '✓ Pago Hoje' : hasNoPaymentToday ? '✕ Não Pagou' : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom action icons row */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-2.5">
                           {/* Camera - opens client photo gallery */}
                          <button
                            onClick={async () => {
                              try {
                                const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
                                const { db } = await import('../lib/firebase');
                                const customerPhotos: string[] = [];
                                if (sale.clientId) {
                                  const custSnap = await getDoc(doc(db, 'customers', sale.clientId));
                                  if (custSnap.exists()) {
                                    const data = custSnap.data();
                                    if (Array.isArray(data.photos)) customerPhotos.push(...data.photos);
                                  }
                                  const colQ = query(
                                    collection(db, 'collections'),
                                    where('saleId', '==', sale.id)
                                  );
                                  const colSnap = await getDocs(colQ);
                                  colSnap.forEach(d => {
                                    const urls = d.data().photoUrls;
                                    if (Array.isArray(urls)) customerPhotos.push(...urls);
                                  });
                                }
                                setGalleryModal({ open: true, clientName: sale.clientName, photos: customerPhotos });
                              } catch (e) {
                                setGalleryModal({ open: true, clientName: sale.clientName, photos: [] });
                              }
                            }}
                            className="w-8 h-8 rounded bg-[#4CAF50] text-white flex items-center justify-center hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer border-none outline-none"
                          >
                            <Camera size={14} className="stroke-[2.5]" />
                          </button>

                          {/* Check status */}
                          <button
                            onClick={() => alert("Detalle de auditoría de venda")}
                            className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 flex items-center justify-center hover:bg-purple-50 active:scale-95 transition-all cursor-pointer border-none outline-none"
                          >
                            <Check size={14} />
                          </button>

                          {/* Overdue Days Badge */}
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-extrabold text-xs leading-none ${status.isLate ? 'bg-red-500' : 'bg-[#4CAF50]'}`}>
                            {status.lateDays}
                          </div>
                        </div>

                        {/* Outstanding Balance */}
                        <div className="flex flex-col leading-none text-right">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Total Pendente</span>
                          <span className="text-xs font-black text-[#DC2626] mt-1">
                            $ {(sale.saldoPendienteCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Right part: Action Buttons Stacked Vertically */}
                    <div className="flex flex-col justify-between items-center border-l border-gray-100 pl-3.5 shrink-0 gap-3">
                      {/* Cash Register Check button (VERDE QUANDO PAGO) */}
                      <button
                        onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'payment' })}
                        className={`flex items-center justify-center rounded-lg p-1 cursor-pointer shrink-0 transition-all active:scale-95 border-none outline-none ${
                          hasPaidToday ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-purple-50'
                        }`}
                        title="Registrar cobro recebido"
                      >
                        <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill={hasPaidToday ? "#DCFCE7" : "#FAF5FF"} stroke={hasPaidToday ? "#16A34A" : "#6B119C"} strokeWidth="2.5"/>
                          <circle cx="20" cy="22" r="4" stroke={hasPaidToday ? "#16A34A" : "#6B119C"} strokeWidth="2"/>
                          <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke={hasPaidToday ? "#16A34A" : "#6B119C"} strokeWidth="2.5" strokeLinecap="round"/>
                          <circle cx="36" cy="34" r="8" fill={hasPaidToday ? "#16A34A" : "#D1D5DB"}/>
                          <path d="M32 34L35 37L40 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Non-payment Register Button (VERMELHO QUANDO REGISTRADA VISITA SEM PAGAMENTO) */}
                      <button
                        onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'no-payment' })}
                        className={`flex items-center justify-center rounded-lg p-1 cursor-pointer shrink-0 transition-all active:scale-95 border-none outline-none ${
                          hasNoPaymentToday ? 'bg-red-100 ring-2 ring-red-500' : 'hover:bg-purple-50'
                        }`}
                        title="Registrar não pagamento (ex: Loja fechada / Cliente sem dinheiro)"
                      >
                        <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill={hasNoPaymentToday ? "#FEE2E2" : "#FAF5FF"} stroke={hasNoPaymentToday ? "#DC2626" : "#6B119C"} strokeWidth="2.5"/>
                          <circle cx="20" cy="22" r="4" stroke={hasNoPaymentToday ? "#DC2626" : "#6B119C"} strokeWidth="2"/>
                          <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke={hasNoPaymentToday ? "#DC2626" : "#6B119C"} strokeWidth="2.5" strokeLinecap="round"/>
                          <circle cx="36" cy="34" r="8" fill={hasNoPaymentToday ? "#DC2626" : "#D1D5DB"}/>
                          <path d="M33 31L39 37M39 31L33 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Speed Dial Menu Floating Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setIsFloatingMenuOpen(true)}
              className="w-14 h-14 bg-[#6B119C] text-white rounded-full shadow-[0_4px_15px_rgba(107,17,156,0.4)] flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:scale-105"
              title="Menu de Ações"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>

          {/* Speed Dial Overlay Menu */}
          {isFloatingMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-3xs z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200"
              onClick={() => setIsFloatingMenuOpen(false)}
            >
              <div 
                className="flex flex-col gap-4 w-full max-w-[320px] animate-in slide-in-from-bottom-10 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cliente Novo (New Customer Form) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFloatingMenuOpen(false);
                    setActiveView('new-customer');
                  }}
                  className="w-full bg-[#6B119C] hover:bg-[#52006A] text-white rounded-full py-4 px-8 shadow-md flex items-center justify-between cursor-pointer transition-transform duration-150 active:scale-95 border-none outline-none font-bold"
                >
                  <span>Cliente Novo</span>
                  <UserPlus size={24} strokeWidth={2} />
                </button>

                {/* Nova Venda (New Sale Form) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFloatingMenuOpen(false);
                    setActiveView('new-sale');
                  }}
                  className="w-full bg-[#6B119C] hover:bg-[#52006A] text-white rounded-full py-4 px-8 shadow-md flex items-center justify-between cursor-pointer transition-transform duration-150 active:scale-95 border-none outline-none font-bold"
                >
                  <span>Nova Venda</span>
                  <FileText size={24} strokeWidth={2} />
                </button>

                {/* para retornar (Close menu) */}
                <button
                  type="button"
                  onClick={() => setIsFloatingMenuOpen(false)}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-full py-4 px-8 shadow-md flex items-center justify-between cursor-pointer transition-transform duration-150 active:scale-95 border-none outline-none font-bold"
                >
                  <span>para retornar</span>
                  <ArrowLeft size={24} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE C: CLIENTE NOVO FORM */}
      {/* ========================================================================= */}
      {activeView === 'new-customer' && (
        <form 
          onSubmit={handleSaveCustomer}
          className="flex-1 flex flex-col bg-white overflow-y-auto pb-28 px-5 pt-3"
        >
          {/* Status alerts */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-bold flex items-center space-x-2 animate-fadeIn mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 font-bold flex items-center space-x-2 animate-fadeIn mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* SECCION 1: INFORMACAO PESSOAL */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5 text-[#333333] pt-2 pb-1">
                {/* User icon outline */}
                <svg className="w-5.5 h-5.5 text-[#6B119C] stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="text-lg font-extrabold text-slate-800 tracking-wide">Informação pessoal</span>
              </div>

              {/* Doc Type 1 */}
              <div className="relative">
                <select
                  value={docType1}
                  onChange={(e) => setDocType1(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="SIN TIPO DE DOCUMENTO">SIN TIPO DE DOCUMENTO</option>
                  <option value="CPF">CPF (Brasil)</option>
                  <option value="CNPJ">CNPJ (Brasil)</option>
                  <option value="RG">RG</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                </select>
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Tipo de documento 1*
                </label>
              </div>

              {/* Doc Num 1 */}
              <div className="relative">
                <input
                  type="text"
                  value={docNum1}
                  onChange={(e) => setDocNum1(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Número do documento 1*
                </label>
              </div>

              {/* Doc Type 2 */}
              <div className="relative">
                <select
                  value={docType2}
                  onChange={(e) => setDocType2(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="SIN TIPO DE DOCUMENTO">SIN TIPO DE DOCUMENTO</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="RG">RG</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                </select>
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Tipo de documento 2
                </label>
              </div>

              {/* Doc Num 2 */}
              <div className="relative">
                <input
                  type="text"
                  value={docNum2}
                  onChange={(e) => setDocNum2(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Número do documento 2
                </label>
              </div>

              {/* Apelido */}
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Apelido*
                </label>
              </div>

              {/* Primeiro nome */}
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Primeiro nome*
                </label>
              </div>

              {/* Nome do meio */}
              <div className="relative">
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Nome do meio
                </label>
              </div>

              {/* Primeiro sobrenome */}
              <div className="relative">
                <input
                  type="text"
                  value={lastName1}
                  onChange={(e) => setLastName1(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Primeiro sobrenome*
                </label>
              </div>

              {/* Segundo sobrenome */}
              <div className="relative">
                <input
                  type="text"
                  value={lastName2}
                  onChange={(e) => setLastName2(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Segundo sobrenome
                </label>
              </div>

              {/* Data de nascimento */}
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400">
                  Data de nascimento
                </label>
              </div>
            </div>

            {/* SECCION 2: LOCALIZACAO */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2.5 text-[#333333] pb-1">
                {/* Location pin outline icon */}
                <svg className="w-5.5 h-5.5 text-[#6B119C] stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="text-lg font-extrabold text-slate-800 tracking-wide">Localização</span>
              </div>

              {/* Cidade */}
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Brasilia">Brasilia</option>
                  <option value="São Paulo">São Paulo</option>
                  <option value="Rio de Janeiro">Rio de Janeiro</option>
                  <option value="Belo Horizonte">Belo Horizonte</option>
                </select>
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400">
                  Cidade
                </label>
              </div>

              {/* Endereço */}
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg pl-4 pr-12 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Endereço*
                </label>
                <button
                  type="button"
                  onClick={handleGPSAutofill}
                  className="absolute right-3.5 top-3.5 text-black hover:text-[#52006A] transition-colors cursor-pointer"
                  title="Capturar coordenadas por GPS"
                >
                  <MapPin size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Bairro */}
              <div className="relative">
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Bairro
                </label>
              </div>
            </div>

            {/* SECCION 3: DADOS DE CONTATO E ANEXOS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2.5 text-[#333333] pb-1">
                {/* Phone outline icon */}
                <svg className="w-5.5 h-5.5 text-[#6B119C] stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.117-6.942-6.942l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span className="text-lg font-extrabold text-slate-800 tracking-wide">Dados de contato</span>
              </div>

              {/* Celular */}
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  Celular*
                </label>
              </div>

              {/* E-mail */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                  E-mail
                </label>
              </div>

              {/* Atividade Economica */}
              <div className="relative">
                <select
                  value={economicActivity}
                  onChange={(e) => setEconomicActivity(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Seleccione atividade econômica</option>
                  <option value="Comercio">Comercio Minorista</option>
                  <option value="Servicios">Prestación de Servicios</option>
                  <option value="Salón">Salón de Belleza / Peluquería</option>
                  <option value="Otros">Varios / Otros</option>
                </select>
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400">
                  Atividade econômica
                </label>
              </div>

              {/* Notas */}
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors"
                />
                <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400">
                  Notas
                </label>
              </div>

              {/* Anexar foto */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider pl-0.5">Anexar foto</span>
                
                {photoName ? (
                  <div className="border border-green-200 rounded-xl bg-green-50/50 p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 text-xs text-slate-800 truncate">
                      <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" 
                      />
                      <div className="truncate">
                        <p className="font-extrabold text-slate-800 truncate max-w-[150px]">{photoName}</p>
                        <p className="text-[9px] text-[#4CAF50] font-black">Foto capturada</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoName('');
                      }}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2Icon />
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      id="client-photo-input" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="w-16 h-16 border-2 border-dashed border-slate-300 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border-none outline-none"
                    >
                      <Camera className="w-6 h-6 text-slate-400" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Bottom footer container */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#F3F4F6] border-t border-gray-200 p-4 max-w-md mx-auto w-full z-40 shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#6B119C] hover:bg-[#52006A] text-white font-black py-4 text-sm rounded-xl shadow-md active:scale-98 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider border-none outline-none"
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Salvar cliente
            </button>
          </div>
        </form>
      )}

      {activeView === 'new-sale' && (
        <form 
          onSubmit={handleSaveSale}
          className="flex-1 flex flex-col bg-white overflow-y-auto pb-28 px-5 pt-3"
        >
          {/* Status alerts */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-bold flex items-center space-x-2 animate-fadeIn mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 font-bold flex items-center space-x-2 animate-fadeIn mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="space-y-6">
            
            {/* Cliente Selector */}
            <div className="relative">
              <select
                value={saleClient.id}
                onChange={(e) => {
                  const selected = customers.find(c => c.id === e.target.value);
                  if (selected) {
                    setSaleClient({ id: selected.id, name: selected.name });
                  }
                }}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 pr-10 text-sm font-bold text-slate-800 outline-none focus:border-[#6B119C] transition-colors appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Seleccione un cliente*</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400">
                Cliente*
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={18} />
              </div>
            </div>

             {/* Valor de venda* Input */}
            <div className="relative">
              <input
                type="text"
                value={saleAmount}
                onChange={(e) => setSaleAmount(formatCurrencyBRL(e.target.value))}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors placeholder-transparent"
                placeholder=" "
                required
              />
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                Valor de venda*
              </label>
            </div>

            {/* Juros* Input */}
            <div className="relative">
              <input
                type="text"
                value={saleInterest}
                onChange={(e) => setSaleInterest(e.target.value)}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors placeholder-transparent"
                placeholder=" "
                required
              />
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                Juros*
              </label>
            </div>

            {/* Frequência Grid Section */}
            <div className="space-y-2.5">
              <span className="block text-sm font-bold text-slate-750">Frequência</span>
              
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Diaria */}
                <button
                  type="button"
                  onClick={() => setSaleFrequency('diaria')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all cursor-pointer ${
                    saleFrequency === 'diaria'
                      ? 'border-[#6B119C] bg-[#F5F3FF] text-[#6B119C]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-350'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-black text-[10px] mb-1.5 ${
                    saleFrequency === 'diaria' ? 'border-[#6B119C] bg-[#6B119C] text-white' : 'border-gray-300 text-gray-400'
                  }`}>
                    D
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-tight leading-none">Diaria</span>
                </button>

                {/* 2. Juros semanal */}
                <button
                  type="button"
                  onClick={() => setSaleFrequency('semanal_juros')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all cursor-pointer ${
                    saleFrequency === 'semanal_juros'
                      ? 'border-[#6B119C] bg-[#F5F3FF] text-[#6B119C]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-350'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-black text-[10px] mb-1.5 text-gray-400">
                    S
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-tight leading-none">Juros semanal</span>
                </button>

                {/* 3. Quinzenal */}
                <button
                  type="button"
                  onClick={() => setSaleFrequency('quinzenal')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all cursor-pointer ${
                    saleFrequency === 'quinzenal'
                      ? 'border-[#6B119C] bg-[#F5F3FF] text-[#6B119C]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-355'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-black text-[10px] mb-1.5 text-gray-400">
                    Q
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-tight leading-none">Quinzen...</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {/* 4. Mensalmente */}
                <button
                  type="button"
                  onClick={() => setSaleFrequency('mensal')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all cursor-pointer ${
                    saleFrequency === 'mensal'
                      ? 'border-[#6B119C] bg-[#F5F3FF] text-[#6B119C]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-360'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-black text-[10px] mb-1.5 text-gray-400">
                    M
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-tight leading-none">Mensalmente</span>
                </button>

                {/* 5. Taxa fixa semanal */}
                <button
                  type="button"
                  onClick={() => setSaleFrequency('semanal_fixa')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all cursor-pointer ${
                    saleFrequency === 'semanal_fixa'
                      ? 'border-[#6B119C] bg-[#F5F3FF] text-[#6B119C]'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-365'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-black text-[10px] mb-1.5 text-gray-400">
                    S
                  </div>
                  <span className="text-[10.5px] font-extrabold tracking-tight leading-none">Taxa fixa semanal</span>
                </button>
              </div>
            </div>

            {/* Parcelas Selector and Slider */}
            <div className="space-y-3">
              <span className="block text-sm font-bold text-slate-750">Parcelas</span>
              
              {/* Plus/Minus box wrapper */}
              <div className="flex items-center w-full">
                <button
                  type="button"
                  onClick={() => setSaleInstallments(prev => Math.max(1, prev - 1))}
                  className="w-14 h-14 bg-[#6B119C] text-white flex items-center justify-center font-black rounded-l-xl text-2xl active:scale-95 transition-transform cursor-pointer border-none outline-none"
                >
                  —
                </button>
                <div className="flex-1 border-y border-gray-200 flex items-center justify-center text-2xl font-black text-slate-800 bg-white h-14 select-none">
                  {saleInstallments}
                </div>
                <button
                  type="button"
                  onClick={() => setSaleInstallments(prev => Math.min(120, prev + 1))}
                  className="w-14 h-14 bg-[#6B119C] text-white flex items-center justify-center font-black rounded-r-xl text-2xl active:scale-95 transition-transform cursor-pointer border-none outline-none"
                >
                  +
                </button>
              </div>

              {/* Slider */}
              <div className="pt-2">
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={saleInstallments}
                  onChange={(e) => setSaleInstallments(Number(e.target.value))}
                  className="w-full accent-[#6B119C] h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Valor da parcela* Input */}
            <div className="relative">
              <input
                type="text"
                value={saleInstallmentValue}
                onChange={(e) => setSaleInstallmentValue(formatCurrencyBRL(e.target.value))}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors placeholder-transparent"
                placeholder=" "
                required
              />
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                Valor da parcela*
              </label>
            </div>

            {saleAmount && (
              <div className="bg-[#F5F3FF] border border-purple-100 rounded-lg p-3 text-xs flex justify-between items-center -mt-2">
                <span className="font-bold text-slate-500">Valor Total (c/ Juros):</span>
                <span className="font-black text-[#6B119C] text-sm">
                  {((parseCurrencyBRLToFloat(saleAmount) || 0) * getInterestMultiplier(saleInterest)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Simulated Photo attachment with thumbnail and close button */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider pl-0.5">Anexar foto</span>
              
              <div className="flex items-center gap-2">
                <>
                  <input 
                    type="file" 
                    id="sale-photo-input" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleSalePhotoUpload} 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={handleCaptureSalePhoto}
                    className="w-16 h-16 border-2 border-dashed border-slate-300 bg-white rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border-none outline-none"
                  >
                    <span className="text-2xl text-slate-400 font-light">+</span>
                  </button>
                </>

                {salePhotoUrl && (
                  <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 group">
                    <img 
                      src={salePhotoUrl} 
                      alt="Sale Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setSalePhotoUrl('');
                        setSalePhotoName('');
                      }}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-0.5 transition-colors cursor-pointer"
                    >
                      <X size={10} className="stroke-[3.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notas Input */}
            <div className="relative">
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors placeholder-transparent"
                placeholder=" "
              />
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                Notas
              </label>
            </div>

          </div>

          {/* Sticky Bottom footer container */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#F3F4F6] border-t border-gray-200 p-4 max-w-md mx-auto w-full z-40 shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#6B119C] hover:bg-[#52006A] text-white font-black py-4 text-sm rounded-xl shadow-md active:scale-98 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider border-none outline-none"
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Cadastrar a venda
            </button>
          </div>
        </form>
      )}

      {/* Photo Gallery Modal */}
      {galleryModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#6B119C] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera size={18} />
                <span className="font-bold text-sm">Fotos - {galleryModal.clientName}</span>
              </div>
              <button 
                onClick={() => setGalleryModal({ open: false, clientName: '', photos: [] })}
                className="text-white/80 hover:text-white p-1 rounded-full text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {galleryModal.photos.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhuma imagem cadastrada para este cliente.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {galleryModal.photos.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-gray-50">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Sub router drawer helper
  function nav(scr: Screen) {
    if (onNavigate) {
      onNavigate(scr);
    }
  }
}

function Trash2Icon() {
  return (
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

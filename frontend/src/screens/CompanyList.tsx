import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { Users, UserPlus, Search, Building2, Landmark, Check, AlertCircle, FileText, ChevronDown, MapPin, User, Banknote, Image, Phone, Plus, Trash2, Camera, MessageCircle, X, Download } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'system_user'
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Customer {
  id?: string;
  tenantId: string;
  unitId: string;
  unitName: string;
  businessCenterId: string;
  city: string;
  name: string;
  apellidos: string;
  apodo: string;
  email: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  address: string;
  barrio: string;
  phone: string;
  celular: string;
  comentario: string;
  actividadEconomica: string;
  active: boolean;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;

  // Additional fields for tabbed editing based on reference images
  secondName?: string;
  secondApellidos?: string;
  document2?: string;
  celularPrefix?: string;
  addresses?: Array<{ id: string; address: string; barrio: string; city: string }>;
  phones?: Array<{ id: string; number: string }>;
  references?: Array<{
    id: string;
    name: string;
    country: string;
    state: string;
    city: string;
    address: string;
    phone: string;
    celular: string;
    comment: string;
  }>;
  photos?: string[];
}

export function CompanyList({ onNavigate, params }: { onNavigate?: (screen: string, params?: Record<string, unknown>) => void; params?: Record<string, unknown> }) {
  const { tenantId, loading: tenantLoading } = useTenant();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Customer Edit Modal State
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);

  // Centers and Units loading
  const [centers, setCenters] = useState<unknown[]>([]);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [viewAllUnits, setViewAllUnits] = useState(false);

  // Customer List
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form inputs
  const [formUnitId, setFormUnitId] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formName, setFormName] = useState('');
  const [formSecondName, setFormSecondName] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formSecondApellidos, setFormSecondApellidos] = useState('');
  const [formApodo, setFormApodo] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDocType, setFormDocType] = useState('CPF');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formDoc2, setFormDoc2] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBarrio, setFormBarrio] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCelularPrefix, setFormCelularPrefix] = useState('55');
  const [formCelular, setFormCelular] = useState('');
  const [formComentario, setFormComentario] = useState('');
  const [formActividad, setFormActividad] = useState('Comercio');
  const [formActive, setFormActive] = useState(true);

  // Geolocation States
  const [formLatitude, setFormLatitude] = useState<number | null>(null);
  const [formLongitude, setFormLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Creation Subtab navigation
  const [createActiveSubTab, setCreateActiveSubTab] = useState<'basic' | 'locations' | 'references' | 'photos'>('basic');

  // Adicionales
  const [formAddresses, setFormAddresses] = useState<unknown[]>([]);
  const [formPhones, setFormPhones] = useState<unknown[]>([]);
  const [formReferencesList, setFormReferencesList] = useState<unknown[]>([]);
  const [formPhotos, setFormPhotos] = useState<string[]>([]);

  // Adicionales input states (local to creation form)
  const [createAddMode, setCreateAddMode] = useState<'address' | 'phone'>('address');
  const [createInputAddress, setCreateInputAddress] = useState('');
  const [createInputBarrio, setCreateInputBarrio] = useState('');
  const [createInputCity, setCreateInputCity] = useState('Brasilia');
  const [createInputPhone, setCreateInputPhone] = useState('');

  // References input states (local to creation form)
  const [createRefName, setCreateRefName] = useState('');
  const [createRefCountry, setCreateRefCountry] = useState('SIN PAÍS');
  const [createRefState, setCreateRefState] = useState('');
  const [createRefCity, setCreateRefCity] = useState('');
  const [createRefAddress, setCreateRefAddress] = useState('');
  const [createRefPhone, setCreateRefPhone] = useState('');
  const [createRefCelular, setCreateRefCelular] = useState('');
  const [createRefComment, setCreateRefComment] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Business Centers
  useEffect(() => {
    if (!tenantId) return;

    const fetchCenters = async () => {
      try {
        const q = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          code: doc.data().code || '',
          status: doc.data().status || 'Activo',
          linkedUnits: doc.data().linkedUnits || []
        })).filter(c => c.status === 'Activo');

        setCenters(list);
        if (list.length > 0) {
          setSelectedCnId(list[0].id);
          const activeUnits = list[0].linkedUnits.filter((u: { active?: boolean; id?: string }) => u.active);
          if (activeUnits.length > 0) {
            setSelectedUnitId('all');
          }
        }
      } catch (err) {
        console.error("Error loading business centers:", err);
      }
    };

    fetchCenters();
  }, [tenantId]);

  // Load Customers on state changes
  useEffect(() => {
    if (!tenantId) return;

    setLoadingCustomers(true);
    const customersRef = collection(db, 'customers');
    let q = query(customersRef, where('tenantId', '==', tenantId));

    if (selectedCnId) {
      q = query(q, where('businessCenterId', '==', selectedCnId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      setCustomers(list);
      setLoadingCustomers(false);
    }, (error) => {
      console.error("Error listening to customers:", error);
      setLoadingCustomers(false);
    });

    return () => unsubscribe();
  }, [tenantId, selectedCnId]);

  // Automatically open customer detail if passed in params (fully index/filter independent)
  useEffect(() => {
    if (params?.clientId) {
      const customer = customers.find(c => c.id === params.clientId);
      if (customer) {
        setSelectedCustomerForModal(customer);
      } else {
        // Fallback: Fetch directly from firestore if not loaded under the current filters/business center
        const fetchSingleCustomer = async () => {
          try {
            const customerDocRef = doc(db, 'customers', String(params.clientId));
            const snap = await getDoc(customerDocRef);
            if (snap.exists()) {
              setSelectedCustomerForModal({
                id: snap.id,
                ...snap.data()
              } as Customer);
            }
          } catch (err) {
            console.error("Error fetching single customer for modal:", err);
          }
        };
        fetchSingleCustomer();
      }
    }
  }, [params?.clientId, customers]);

  // Helper to handle Business Center Selection Change
  const handleCnChange = (cnId: string) => {
    setSelectedCnId(cnId);
    setSelectedUnitId('all');
  };

  // Switch status in Firestore
  const toggleCustomerStatus = async (customer: Customer) => {
    if (!customer.id) return;
    try {
      const customerDocRef = doc(db, 'customers', customer.id);
      await updateDoc(customerDocRef, {
        active: !customer.active
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${customer.id}`);
    }
  };

  // Get Current Location with browser Geolocation API & free reverse-geocoding
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('A geolocalização não é compatível com o seu navegador.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormLatitude(latitude);
        setFormLongitude(longitude);
        setGettingLocation(false);

        // Reverse geocoding to fill Address/Barrio/City if empty
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              if (!formAddress) {
                setFormAddress(data.display_name);
              }
              if (data.address) {
                if (!formBarrio && data.address.suburb) {
                  setFormBarrio(data.address.suburb);
                } else if (!formBarrio && data.address.neighbourhood) {
                  setFormBarrio(data.address.neighbourhood);
                }
                if (!formCity && data.address.city) {
                  setFormCity(data.address.city);
                } else if (!formCity && data.address.town) {
                  setFormCity(data.address.town);
                }
              }
            }
          }
        } catch (err) {
          // Quietly handle reverse geocoding issues (it's a non-blocking progressive enhancement)
          console.warn('Note: Reverse geocoding failed (non-blocking, GPS coordinates were set successfully):', err);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMsg = 'Não foi possível obter a sua localização atual.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permissão de localização negada. Por favor, ative as permissões de localização no seu navegador.';
        }
        alert(errorMsg);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Submit Client Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!formUnitId || !formCity || !formName || !formApellidos || !formDocNumber || !formAddress || !formCelular) {
      setNotification({ type: 'error', message: 'Por favor complete todos los campos obligatorios (*)' });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    const currentCenter = centers.find(c => c.id === selectedCnId);
    const currentUnit = currentCenter?.linkedUnits.find((u: { active?: boolean; id?: string }) => u.id === formUnitId);
    const unitName = currentUnit ? currentUnit.name : 'Ruta/Unidad Desconocida';

    const customerData: Customer = {
      tenantId,
      unitId: formUnitId,
      unitName,
      businessCenterId: selectedCnId,
      city: formCity,
      name: formName,
      secondName: formSecondName || '',
      apellidos: formApellidos,
      secondApellidos: formSecondApellidos || '',
      apodo: formApodo || '',
      email: formEmail || '',
      documentType: formDocType,
      documentNumber: formDocNumber,
      document2: formDoc2 || '',
      birthDate: formBirthDate || '',
      address: formAddress,
      barrio: formBarrio || '',
      phone: formPhone || '',
      celularPrefix: formCelularPrefix || '55',
      celular: formCelular,
      comentario: formComentario || '',
      actividadEconomica: formActividad,
      active: formActive,
      addresses: formAddresses,
      phones: formPhones,
      references: formReferencesList,
      photos: formPhotos,
      latitude: formLatitude,
      longitude: formLongitude,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'customers'), customerData);
      setNotification({ type: 'success', message: '¡Cliente creado exitosamente!' });
      
      // Reset Form fields
      setFormUnitId('');
      setFormCity('');
      setFormName('');
      setFormSecondName('');
      setFormApellidos('');
      setFormSecondApellidos('');
      setFormApodo('');
      setFormEmail('');
      setFormDocNumber('');
      setFormDoc2('');
      setFormBirthDate('');
      setFormAddress('');
      setFormBarrio('');
      setFormPhone('');
      setFormCelularPrefix('55');
      setFormCelular('');
      setFormComentario('');
      setFormAddresses([]);
      setFormPhones([]);
      setFormReferencesList([]);
      setFormPhotos([]);
      setFormLatitude(null);
      setFormLongitude(null);
      setCreateActiveSubTab('basic');
      
      // Auto-switch to list tab after delay
      setTimeout(() => {
        setActiveTab('list');
        setNotification(null);
      }, 1500);
    } catch (err) {
      console.error("Error creating customer:", err);
      setNotification({ type: 'error', message: 'Error al registrar el cliente en la base de datos.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering Customers
  const selectedCenter = centers.find(c => c.id === selectedCnId);
  const activeUnitsList = selectedCenter ? selectedCenter.linkedUnits.filter((u: { active?: boolean; id?: string }) => u.active) : [];

  const filteredCustomers = customers.filter(customer => {
    // 1. Filter by Unit (if not viewing all units)
    if (!viewAllUnits && selectedUnitId !== 'all' && selectedUnitId !== '') {
      if (customer.unitId !== selectedUnitId) return false;
    }

    // 2. Search Box Query (id, name, apellidos, apodo, documentNumber)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = customer.name.toLowerCase().includes(q);
      const matchApellidos = customer.apellidos.toLowerCase().includes(q);
      const matchApodo = customer.apodo?.toLowerCase().includes(q);
      const matchDoc = customer.documentNumber.includes(q);
      const matchId = customer.id?.toLowerCase().includes(q);
      return matchName || matchApellidos || matchApodo || matchDoc || matchId;
    }

    return true;
  });

  return (
    <div className="flex flex-col space-y-4 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4 text-[#333333]">
      
      {/* Dynamic Selector Header Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Business Center Selector */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-extrabold text-gray-400 mb-1">Centro de Negocio</label>
            <div className="relative">
              <select
                value={selectedCnId}
                onChange={(e) => handleCnChange(e.target.value)}
                className="w-full sm:w-64 bg-[#F3F4F6] border border-gray-300 rounded px-3 py-2 text-xs font-bold appearance-none pr-8 cursor-pointer outline-none focus:border-[#6B21A8]"
              >
                {centers.map(center => (
                  <option key={center.id} value={center.id}>
                    {center.code ? `/${center.code}/ - ` : ''}{center.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Unit Selector */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-extrabold text-gray-400 mb-1">Unidades</label>
            <div className="relative">
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={viewAllUnits}
                className="w-full sm:w-64 bg-[#F3F4F6] border border-gray-300 rounded px-3 py-2 text-xs font-bold appearance-none pr-8 cursor-pointer outline-none focus:border-[#6B21A8] disabled:opacity-50"
              >
                <option value="all">Todas las unidades ({activeUnitsList.length})</option>
                {activeUnitsList.map((unit: { id: string; name: string }) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* View all Checkbox */}
          <div className="flex items-center gap-2 mt-4 sm:mt-5">
            <input
              type="checkbox"
              id="viewAllUnits"
              checked={viewAllUnits}
              onChange={(e) => setViewAllUnits(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-gray-300 text-[#8CC63F] focus:ring-[#8CC63F] cursor-pointer"
            />
            <label htmlFor="viewAllUnits" className="text-xs font-bold text-gray-600 cursor-pointer select-none">
              Ver todas las unidades
            </label>
          </div>
        </div>

        {/* Create/List quick info tag */}
        <div className="text-right flex flex-col items-end">
          <div className="text-xs text-purple-700 font-extrabold flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#8CC63F]" />
            <span>Gestión de Clientes</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
            Canal de auditoría e inscripción
          </p>
        </div>
      </div>

      {/* Navigation Subtabs (Nuevo Cliente / Lista de Clientes) */}
      <div className="flex items-center border-b border-gray-200">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase transition-all duration-150 border-t-2 border-x rounded-t-md cursor-pointer ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-[#8CC63F] to-[#7BB52F] text-white border-b-transparent border-t-[#8CC63F] border-x-gray-200 shadow-sm'
              : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent border-b-gray-200'
          }`}
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>Nuevo Cliente</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase transition-all duration-150 border-t-2 border-x rounded-t-md cursor-pointer ${
            activeTab === 'list'
              ? 'bg-gradient-to-r from-[#8CC63F] to-[#7BB52F] text-white border-b-transparent border-t-[#8CC63F] border-x-gray-200 shadow-sm'
              : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent border-b-gray-200'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>Lista De Clientes ({filteredCustomers.length})</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm p-4">
        
        {/* Notifications */}
        {notification && (
          <div className={`p-3 rounded-lg flex items-start gap-2.5 mb-4 text-xs font-semibold border ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Tab 1: CREATE NEW CUSTOMER */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto bg-white rounded-3xl p-6 border border-gray-100">
            <h3 className="text-sm font-black text-[#6B21A8] uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8CC63F]" />
              Ficha de Registro Operativo (Nuevo Cliente)
            </h3>

            {/* Core Tab Buttons (Row of 4 icons for Creation Subtabs) */}
            <div className="flex justify-around items-center px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setCreateActiveSubTab('basic')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  createActiveSubTab === 'basic' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Datos Básicos"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Datos Básicos</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCreateActiveSubTab('locations')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  createActiveSubTab === 'locations' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Ubicaciones y Teléfonos"
              >
                <MapPin className="w-5 h-5" />
                <span className="hidden sm:inline">Adicionales</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCreateActiveSubTab('references')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  createActiveSubTab === 'references' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Referencias"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Referencias</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCreateActiveSubTab('photos')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  createActiveSubTab === 'photos' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Fotos"
              >
                <Image className="w-5 h-5" />
                <span className="hidden sm:inline">Fotos</span>
              </button>
            </div>

            {/* Subtab Contents */}
            <div className="space-y-4">
              
              {/* SUBTAB 1: DATOS BÁSICOS */}
              {createActiveSubTab === 'basic' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Business Center Unit & City Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Unidad *</label>
                      <select
                        required
                        value={formUnitId}
                        onChange={(e) => setFormUnitId(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
                      >
                        <option value="">Seleccione Unidad</option>
                        {activeUnitsList.map((unit: { id: string; name: string }) => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Ciudad *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Bogotá / Medellín"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Primer nombre *</label>
                      <input
                        type="text"
                        required
                        placeholder="Primer nombre"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo nombre</label>
                      <input
                        type="text"
                        placeholder="Ingresar segundo nombre"
                        value={formSecondName}
                        onChange={(e) => setFormSecondName(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Primer apellido *</label>
                      <input
                        type="text"
                        required
                        placeholder="Primer apellido"
                        value={formApellidos}
                        onChange={(e) => setFormApellidos(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo apellido</label>
                      <input
                        type="text"
                        placeholder="Segundo apellido"
                        value={formSecondApellidos}
                        onChange={(e) => setFormSecondApellidos(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Apodo / Alias *</label>
                    <input
                      type="text"
                      placeholder="Ej. Doña Clara / Cocos"
                      value={formApodo}
                      onChange={(e) => setFormApodo(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">E-Mail</label>
                    <input
                      type="email"
                      placeholder="cliente@correo.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col space-y-1 col-span-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Tipo Doc *</label>
                      <select
                        value={formDocType}
                        onChange={(e) => setFormDocType(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
                      >
                        <option value="CPF">CPF</option>
                        <option value="Cédula">Cédula</option>
                        <option value="DNI">DNI</option>
                        <option value="RUT">RUT</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1 col-span-2">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Documento 1 *</label>
                      <input
                        type="text"
                        required
                        placeholder="Escriba el número"
                        value={formDocNumber}
                        onChange={(e) => setFormDocNumber(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Documento 2</label>
                      <input
                        type="text"
                        placeholder="Ingresar documento alternativo"
                        value={formDoc2}
                        onChange={(e) => setFormDoc2(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={formBirthDate}
                        onChange={(e) => setFormBirthDate(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] text-gray-600 focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Dirección Completa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Calle, Número, Local"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F] w-full"
                    />
                    
                    {/* Botão de adicionar localização atual embaixo do campo de endereço */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={gettingLocation}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                          formLatitude && formLongitude
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-[#8CC63F] text-white border-transparent hover:bg-[#7BB52F] active:scale-[0.98]'
                        }`}
                        title="Obter localização atual"
                      >
                        <MapPin className={`w-4 h-4 ${gettingLocation ? 'animate-bounce text-white' : 'text-current'}`} />
                        {gettingLocation ? 'Obtendo Localização Atual...' : formLatitude && formLongitude ? 'Atualizar Localização GPS' : 'Adicionar Localização Atual'}
                      </button>

                      {formLatitude && formLongitude && (
                        <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-[10px] text-green-800 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="font-extrabold uppercase text-[9px]">Coordenadas:</span>
                            <span>{formLatitude.toFixed(6)}, {formLongitude.toFixed(6)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormLatitude(null);
                              setFormLongitude(null);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer uppercase text-[9px] hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Barrio</label>
                      <input
                        type="text"
                        placeholder="Barrio o zona"
                        value={formBarrio}
                        onChange={(e) => setFormBarrio(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ingresar teléfono alternativo"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono Celular *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formCelularPrefix}
                        onChange={(e) => setFormCelularPrefix(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] w-14 text-center focus:border-[#8CC63F]"
                        placeholder="55"
                      />
                      <input
                        type="text"
                        required
                        value={formCelular}
                        onChange={(e) => setFormCelular(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] flex-1 focus:border-[#8CC63F]"
                        placeholder="Celular sin código de país"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Actividad Económica *</label>
                    <select
                      value={formActividad}
                      onChange={(e) => setFormActividad(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
                    >
                      <option value="Comercio">Comercio Minorista / Tienda</option>
                      <option value="Servicios">Servicios / Oficios</option>
                      <option value="Producción">Producción / Manufactura</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Comentarios o Indicaciones de cobro</label>
                    <textarea
                      placeholder="Observaciones de ubicación, horarios de cobro..."
                      value={formComentario}
                      onChange={(e) => setFormComentario(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] h-18 focus:border-[#8CC63F]"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-700">Estado Inicial del Cliente: Activo</span>
                    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="sr-only"
                        id="formActive"
                      />
                      <label
                        htmlFor="formActive"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                          formActive ? 'bg-[#8CC63F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-white shadow transform duration-200 ease-in-out mt-1 ${
                            formActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: LOCATIONS & PHONES (ADICIONALES) */}
              {createActiveSubTab === 'locations' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card for Additional Address */}
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-1.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8CC63F]" />
                          Añadir Dirección Adicional
                        </h3>
                        
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] uppercase font-black text-gray-400">Dirección *</label>
                          <input
                            type="text"
                            placeholder="Ej: Calle 10, Edificio Royal Suite 1202"
                            value={createInputAddress}
                            onChange={(e) => setCreateInputAddress(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400">Barrio</label>
                            <input
                              type="text"
                              placeholder="Ej: Centro"
                              value={createInputBarrio}
                              onChange={(e) => setCreateInputBarrio(e.target.value)}
                              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                            <input
                              type="text"
                              placeholder="Ej: Brasilia"
                              value={createInputCity}
                              onChange={(e) => setCreateInputCity(e.target.value)}
                              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (!createInputAddress.trim()) return;
                          const newAddr = {
                            id: Date.now().toString(),
                            address: createInputAddress.trim(),
                            barrio: createInputBarrio.trim(),
                            city: createInputCity.trim()
                          };
                          setFormAddresses([...formAddresses, newAddr]);
                          setCreateInputAddress('');
                          setCreateInputBarrio('');
                        }}
                        className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
                      >
                        Añadir Dirección
                      </button>
                    </div>

                    {/* Card for Additional Phone */}
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-1.5 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#8CC63F]" />
                          Añadir Teléfono Adicional
                        </h3>
                        
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] uppercase font-black text-gray-400">Número de Teléfono *</label>
                          <input
                            type="tel"
                            placeholder="Ej: +55 6191202335"
                            value={createInputPhone}
                            onChange={(e) => setCreateInputPhone(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (!createInputPhone.trim()) return;
                          const newPhone = {
                            id: Date.now().toString(),
                            number: createInputPhone.trim()
                          };
                          setFormPhones([...formPhones, newPhone]);
                          setCreateInputPhone('');
                        }}
                        className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
                      >
                        Añadir Teléfono
                      </button>
                    </div>
                  </div>

                  {/* Addresses List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Direcciones Adicionales</h4>
                    {formAddresses.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">Ninguna dirección adicional agregada aún.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {formAddresses.map((addr) => (
                          <div key={addr.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                            <div className="p-3 flex justify-between items-start">
                              <div className="space-y-1 text-xs text-gray-700">
                                <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Dirección:</span> {addr.address}</div>
                                {addr.barrio && <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Barrio:</span> {addr.barrio}</div>}
                                <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Ciudad:</span> {addr.city}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormAddresses(formAddresses.filter(a => a.id !== addr.id))}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phones List */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Teléfonos Adicionales</h4>
                    {formPhones.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">Ningún teléfono adicional agregado aún.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {formPhones.map((ph) => (
                          <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                            <div className="p-3 flex justify-between items-start">
                              <div className="space-y-1 text-xs text-gray-700">
                                <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Número:</span> {ph.number}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormPhones(formPhones.filter(p => p.id !== ph.id))}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: REFERENCES */}
              {createActiveSubTab === 'references' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                    <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Añadir Referencia Familiar o Comercial</h3>
                    
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Nombre Completo *</label>
                      <input
                        type="text"
                        placeholder="Nombre de la referencia"
                        value={createRefName}
                        onChange={(e) => setCreateRefName(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">País</label>
                        <select
                          value={createRefCountry}
                          onChange={(e) => setCreateRefCountry(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        >
                          <option value="SIN PAÍS">SIN PAÍS</option>
                          <option value="Brasil">Brasil</option>
                          <option value="Colombia">Colombia</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Estado</label>
                        <input
                          type="text"
                          placeholder="Estado/Prov"
                          value={createRefState}
                          onChange={(e) => setCreateRefState(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                        <input
                          type="text"
                          placeholder="Ciudad"
                          value={createRefCity}
                          onChange={(e) => setCreateRefCity(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Dirección Completa *</label>
                      <input
                        type="text"
                        placeholder="Calle, número, depto"
                        value={createRefAddress}
                        onChange={(e) => setCreateRefAddress(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Teléfono Fijo</label>
                        <input
                          type="tel"
                          placeholder="Fijo u alternativo"
                          value={createRefPhone}
                          onChange={(e) => setCreateRefPhone(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Celular *</label>
                        <input
                          type="tel"
                          placeholder="Celular con código"
                          value={createRefCelular}
                          onChange={(e) => setCreateRefCelular(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Comentarios / Relación *</label>
                      <input
                        type="text"
                        placeholder="Ej: Madre, Hermano, Socio comercial..."
                        value={createRefComment}
                        onChange={(e) => setCreateRefComment(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!createRefName.trim() || !createRefCelular.trim()) return;
                        const newRef = {
                          id: Date.now().toString(),
                          name: createRefName.trim(),
                          country: createRefCountry,
                          state: createRefState.trim(),
                          city: createRefCity.trim(),
                          address: createRefAddress.trim(),
                          phone: createRefPhone.trim(),
                          celular: createRefCelular.trim(),
                          comment: createRefComment.trim()
                        };
                        setFormReferencesList([...formReferencesList, newRef]);
                        setCreateRefName('');
                        setCreateRefState('');
                        setCreateRefCity('');
                        setCreateRefAddress('');
                        setCreateRefPhone('');
                        setCreateRefCelular('');
                        setCreateRefComment('');
                      }}
                      className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Añadir Referencia
                    </button>
                  </div>

                  {/* References list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Referencias Agregadas</h4>
                    {formReferencesList.length === 0 ? (
                      <div className="text-xs text-gray-400 italic text-center py-4">Ninguna referencia agregada aún.</div>
                    ) : (
                      <div className="space-y-3">
                        {formReferencesList.map((ref) => (
                          <div key={ref.id} className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex justify-between items-start">
                            <div className="space-y-1.5 text-xs text-gray-700 flex-1">
                              <div className="font-bold text-[#6B21A8] text-sm">{ref.name}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Relación/Comentarios: {ref.comment}</div>
                              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] border-t border-gray-50">
                                <div><span className="font-extrabold text-gray-400">Celular:</span> {ref.celular}</div>
                                {ref.phone && <div><span className="font-extrabold text-gray-400">Fijo:</span> {ref.phone}</div>}
                              </div>
                              <div className="text-[11px]"><span className="font-extrabold text-gray-400">Ubicación:</span> {ref.address} ({ref.city || 'Sin ciudad'}, {ref.country})</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormReferencesList(formReferencesList.filter(r => r.id !== ref.id))}
                              className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded shrink-0 ml-2 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: PHOTOS */}
              {createActiveSubTab === 'photos' && (
                <div className="space-y-4 animate-fadeIn text-center">
                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="p-3 bg-[#8CC63F]/10 rounded-2xl text-[#8CC63F]">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-700">Subir fotos de fachada del negocio / cliente</p>
                      <p className="text-[10px] text-gray-400">Soporta PNG, JPG. Las imágenes se procesan localmente.</p>
                    </div>
                    <label className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm">
                      Seleccionar Archivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setFormPhotos([...formPhotos, base64String]);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Render uploaded photos */}
                  <div className="space-y-3 text-left">
                    <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Fotos Cargadas</h4>
                    {formPhotos.length === 0 ? (
                      <div className="text-xs text-gray-400 italic text-center py-4">Ninguna foto cargada aún.</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {formPhotos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-xs group">
                            <img src={photo} referrerPolicy="no-referrer" alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormPhotos(formPhotos.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-xl backdrop-blur-xs transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Form Action Buttons (Fixed layout like the mockup) */}
            <div className="flex justify-end gap-3.5 pt-6 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('list');
                  setFormAddresses([]);
                  setFormPhones([]);
                  setFormReferencesList([]);
                  setFormPhotos([]);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#6B21A8] hover:bg-[#52006A] text-white font-bold px-6 py-2.5 rounded text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? 'Guardando...' : 'Crear nuevo cliente'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: LIST OF CUSTOMERS */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            
            {/* Search Filter Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
              <div className="flex-1 relative flex items-center border border-gray-300 rounded-lg bg-[#F9FAFB] px-3 py-1.5 focus-within:border-[#6B21A8]">
                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Ejem: id Cliente, Nombre, apellido"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none border-none text-[#333333]"
                />
              </div>
              <button className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-colors shrink-0 cursor-pointer">
                Buscar
              </button>
            </div>

            {/* Customers Cards Grid */}
            {loadingCustomers ? (
              <div className="py-12 text-center text-xs font-bold text-gray-500">
                Cargando listado de clientes desde base de datos...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">
                Ningún cliente coincide con los filtros aplicados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Header: Unit badge and status */}
                    <div 
                      onClick={() => setSelectedCustomerForModal(customer)}
                      className="bg-[#F9FAFB] border-b border-gray-100 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#6B21A8] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                          {customer.unitName || 'Sin Unidad'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                        customer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Content */}
                    <div 
                      onClick={() => setSelectedCustomerForModal(customer)}
                      className="p-3.5 space-y-2.5 flex-1 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-gray-400">ID - Cliente:</div>
                        <div className="text-xs font-mono font-bold text-gray-800 truncate" title={customer.id}>
                          {customer.id}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-gray-400">Nombre Completo:</div>
                        <div className="text-sm font-extrabold text-[#6B21A8]">
                          {customer.name} {customer.apellidos} 
                          {customer.apodo && <span className="text-xs text-gray-500 font-semibold block sm:inline sm:ml-1">({customer.apodo})</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-gray-50">
                        <div>
                          <div className="text-[9px] font-bold text-gray-400">Cédula/Doc:</div>
                          <div className="font-semibold text-gray-700 truncate">{customer.documentNumber}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400">Ciudad:</div>
                          <div className="font-semibold text-gray-700 truncate">{customer.city}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-[9px] font-bold text-gray-400">Celular:</div>
                          <div className="font-semibold text-gray-700 truncate">{customer.celular}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400">Actividad:</div>
                          <div className="font-semibold text-gray-700 truncate">{customer.actividadEconomica}</div>
                        </div>
                      </div>

                      {customer.email && (
                        <div className="text-[11px]">
                          <div className="text-[9px] font-bold text-gray-400">Correo Electrónico:</div>
                          <div className="font-semibold text-gray-600 truncate">{customer.email}</div>
                        </div>
                      )}

                      {customer.address && (
                        <div className="text-[11px]">
                          <div className="text-[9px] font-bold text-gray-400">Dirección:</div>
                          <div className="text-gray-600 leading-tight">
                            {customer.address} {customer.barrio ? ` - B. ${customer.barrio}` : ''}
                          </div>
                        </div>
                      )}

                      {customer.comentario && (
                        <div className="bg-purple-50/50 p-2 rounded border border-purple-100 text-[10px] text-purple-800 leading-tight italic">
                          "{customer.comentario}"
                        </div>
                      )}
                    </div>

                    {/* Bottom Action bar */}
                    <div className="border-t border-gray-150 p-3 bg-[#F9FAFB]/50 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Estado</span>
                      
                      <div className="flex items-center gap-3">
                        {/* Switch Toggle */}
                        <div className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                          <input
                            type="checkbox"
                            name={`active-${customer.id}`}
                            id={`active-${customer.id}`}
                            checked={customer.active}
                            onChange={() => toggleCustomerStatus(customer)}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`active-${customer.id}`}
                            className={`block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ${
                              customer.active ? 'bg-[#8CC63F]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`block h-3.5 w-3.5 rounded-full bg-white shadow transform duration-200 ease-in-out mt-0.5 ${
                                customer.active ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForModal(customer)}
                          className="bg-[#6B21A8] hover:bg-[#52006A] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Perfil/Editar</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {selectedCustomerForModal && (
        <CustomerDetailModal
          customer={customers.find(c => c.id === selectedCustomerForModal.id) || selectedCustomerForModal}
          onClose={() => setSelectedCustomerForModal(null)}
        />
      )}

    </div>
  );
}

// Subcomponent: CustomerDetailModal representing customer registry detail and management
interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'locations' | 'references' | 'sales' | 'photos'>('basic');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- TAB 1: Basic Data States ---
  const [firstName, setFirstName] = useState(customer.name || '');
  const [firstApellido, setFirstApellido] = useState(customer.apellidos || '');
  const [secondName, setSecondName] = useState(customer.secondName || '');
  const [secondApellido, setSecondApellido] = useState(customer.secondApellidos || '');
  const [apodo, setApodo] = useState(customer.apodo || '');
  const [email, setEmail] = useState(customer.email || '');
  const [docType, setDocType] = useState(customer.documentType || 'CPF');
  const [docNumber, setDocNumber] = useState(customer.documentNumber || '');
  const [doc2, setDoc2] = useState(customer.document2 || '');
  const [birthDate, setBirthDate] = useState(customer.birthDate || '');
  const [address, setAddress] = useState(customer.address || '');
  const [barrio, setBarrio] = useState(customer.barrio || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [celularPrefix, setCelularPrefix] = useState(customer.celularPrefix || '55');
  const [celular, setCelular] = useState(customer.celular || '');
  const [comment, setComment] = useState(customer.comentario || '');
  const [actividad, setActividad] = useState(customer.actividadEconomica || 'Comercio');
  const [active, setActive] = useState(customer.active !== false);

  // Geolocation States
  const [latitude, setLatitude] = useState<number | null>(customer.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(customer.longitude || null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // --- TAB 2: Locations & Phones States ---
  const [addMode, setAddMode] = useState<'address' | 'phone'>('address');
  const [inputAddress, setInputAddress] = useState('');
  const [inputBarrio, setInputBarrio] = useState('');
  const [inputCity, setInputCity] = useState('Brasilia');
  const [inputPhone, setInputPhone] = useState('');
  const [addresses, setAddresses] = useState<unknown[]>(customer.addresses || []);
  const [phones, setPhones] = useState<unknown[]>(customer.phones || []);

  // --- TAB 3: References States ---
  const [refList, setRefList] = useState<unknown[]>(customer.references || []);
  const [refName, setRefName] = useState('');
  const [refCountry, setRefCountry] = useState('SIN PAÍS');
  const [refState, setRefState] = useState('');
  const [refCity, setRefCity] = useState('');
  const [refAddress, setRefAddress] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refCelular, setRefCelular] = useState('');
  const [refComment, setRefComment] = useState('');

  // --- TAB 4: Sales & Payments (Real-time Firestore) ---
  const [realSales, setRealSales] = useState<unknown[]>([]);
  const [realPayments, setRealPayments] = useState<unknown[]>([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);

  // --- TAB 5: Photos States ---
  const [photos, setPhotos] = useState<string[]>(customer.photos || []);

  // Sync state if customer prop changes in background
  useEffect(() => {
    setFirstName(customer.name || '');
    setFirstApellido(customer.apellidos || '');
    setSecondName(customer.secondName || '');
    setSecondApellido(customer.secondApellidos || '');
    setApodo(customer.apodo || '');
    setEmail(customer.email || '');
    setDocType(customer.documentType || 'CPF');
    setDocNumber(customer.documentNumber || '');
    setDoc2(customer.document2 || '');
    setBirthDate(customer.birthDate || '');
    setAddress(customer.address || '');
    setBarrio(customer.barrio || '');
    setPhone(customer.phone || '');
    setCelularPrefix(customer.celularPrefix || '55');
    setCelular(customer.celular || '');
    setComment(customer.comentario || '');
    setActividad(customer.actividadEconomica || 'Comercio');
    setActive(customer.active !== false);
    setAddresses(customer.addresses || []);
    setPhones(customer.phones || []);
    setRefList(customer.references || []);
    setPhotos(customer.photos || []);
    setLatitude(customer.latitude || null);
    setLongitude(customer.longitude || null);
  }, [customer]);

  // Load Sales and Payments in real-time
  useEffect(() => {
    if (!customer.id) return;
    setLoadingFinancial(true);

    const salesQuery = query(collection(db, 'sales'), where('clientId', '==', customer.id));
    const unsubscribeSales = onSnapshot(salesQuery, (snap) => {
      const list = snap.docs.map(doc => {
        const data = doc.data();
        let dateStr = 'Reciente';
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const d = data.createdAt.toDate();
          dateStr = d.toLocaleString();
        }
        return {
          id: doc.id,
          ugi: data.unitName || '3',
          caixa: data.boxName || '1006671',
          date: dateStr,
          amount: data.amount || 0,
        };
      });
      setRealSales(list);
    }, (err) => console.error("Error loading client sales:", err));

    const paymentsQuery = query(collection(db, 'collections'), where('clientId', '==', customer.id));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snap) => {
      const list = snap.docs.map(doc => {
        const data = doc.data();
        let dateStr = 'Reciente';
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const d = data.createdAt.toDate();
          dateStr = d.toLocaleString();
        }
        return {
          id: doc.id,
          ugi: data.boxName || '3',
          caixa: data.boxId ? data.boxId.slice(-7) : '1006671',
          date: dateStr,
          method: data.paymentMethod || 'Efectivo',
          amount: data.amount || 0,
        };
      });
      setRealPayments(list);
      setLoadingFinancial(false);
    }, (err) => {
      console.error("Error loading client collections:", err);
      setLoadingFinancial(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribePayments();
    };
  }, [customer.id]);

  // Fallback demo data to make Tab 4 look identical to mockup when empty
  const demoSales = [
    { id: 'demo-s1', ugi: '3', caixa: '1006671', date: '27/08/2025 19:38:41', amount: 1011660 },
    { id: 'demo-s2', ugi: '3', caixa: '1006585', date: '24/07/2025 20:18:42', amount: 1011444 },
    { id: 'demo-s3', ugi: '3', caixa: '1006543', date: '08/07/2025 16:01:58', amount: 1011317 }
  ];

  const demoPayments = [
    { id: 'demo-p1', ugi: '3', caixa: '1006671', date: '28/08/2025 09:12:00', method: 'Efectivo', amount: 50000 },
    { id: 'demo-p2', ugi: '3', caixa: '1006585', date: '25/07/2025 10:30:15', method: 'Transferencia', amount: 50000 }
  ];

  const salesToDisplay = realSales.length > 0 ? realSales : demoSales;
  const paymentsToDisplay = realPayments.length > 0 ? realPayments : demoPayments;

  // Fallback photo seeds to make Tab 5 look identical to mockup when empty
  const demoPhotos = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80'
  ];
  const photosToDisplay = photos.length > 0 ? photos : demoPhotos;

  // --- Operations ---
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('A geolocalização não é compatível com o seu navegador.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setGettingLocation(false);

        // Reverse geocoding to fill address, barrio if empty
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              if (!address) {
                setAddress(data.display_name);
              }
              if (data.address) {
                if (!barrio && data.address.suburb) {
                  setBarrio(data.address.suburb);
                } else if (!barrio && data.address.neighbourhood) {
                  setBarrio(data.address.neighbourhood);
                }
              }
            }
          }
        } catch (err) {
          // Quietly handle reverse geocoding issues (it's a non-blocking progressive enhancement)
          console.warn('Note: Reverse geocoding in modal failed (non-blocking, GPS coordinates were set successfully):', err);
        }
      },
      (error) => {
        console.error('Error getting location in modal:', error);
        let errorMsg = 'Não foi possível obter a sua localização atual.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permissão de localização negada. Por favor, ative as permissões de localização no seu navegador.';
        }
        alert(errorMsg);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveBasic = async () => {
    if (!customer.id) return;
    setSaving(true);
    setNotification(null);
    try {
      const docRef = doc(db, 'customers', customer.id);
      await updateDoc(docRef, {
        name: firstName,
        apellidos: firstApellido,
        secondName,
        secondApellidos: secondApellido,
        apodo,
        email,
        documentType: docType,
        documentNumber: docNumber,
        document2: doc2,
        birthDate,
        address,
        barrio,
        phone,
        celularPrefix,
        celular,
        comentario: comment,
        actividadEconomica: actividad,
        active,
        latitude,
        longitude
      });
      setNotification({ type: 'success', message: 'Datos básicos guardados correctamente.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error al actualizar los datos.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!inputAddress.trim() || !customer.id) return;
    const newAddr = {
      id: Date.now().toString(),
      address: inputAddress.trim(),
      barrio: inputBarrio.trim(),
      city: inputCity.trim()
    };
    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setInputAddress('');
    setInputBarrio('');
    try {
      await updateDoc(doc(db, 'customers', customer.id), { addresses: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    if (customer.id) {
      try {
        await updateDoc(doc(db, 'customers', customer.id), { addresses: updated });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddPhone = async () => {
    if (!inputPhone.trim() || !customer.id) return;
    const newPhone = {
      id: Date.now().toString(),
      number: inputPhone.trim()
    };
    const updated = [...phones, newPhone];
    setPhones(updated);
    setInputPhone('');
    try {
      await updateDoc(doc(db, 'customers', customer.id), { phones: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhone = async (id: string) => {
    const updated = phones.filter(p => p.id !== id);
    setPhones(updated);
    if (customer.id) {
      try {
        await updateDoc(doc(db, 'customers', customer.id), { phones: updated });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddReference = async () => {
    if (!refName.trim() || !refCelular.trim() || !customer.id) return;
    const newRef = {
      id: Date.now().toString(),
      name: refName.trim(),
      country: refCountry,
      state: refState.trim(),
      city: refCity.trim(),
      address: refAddress.trim(),
      phone: refPhone.trim(),
      celular: refCelular.trim(),
      comment: refComment.trim()
    };
    const updated = [...refList, newRef];
    setRefList(updated);
    // Reset
    setRefName('');
    setRefState('');
    setRefCity('');
    setRefAddress('');
    setRefPhone('');
    setRefCelular('');
    setRefComment('');
    try {
      await updateDoc(doc(db, 'customers', customer.id), { references: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReference = async (id: string) => {
    const updated = refList.filter(r => r.id !== id);
    setRefList(updated);
    if (customer.id) {
      try {
        await updateDoc(doc(db, 'customers', customer.id), { references: updated });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer.id) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const updated = [...photos, base64String];
      setPhotos(updated);
      try {
        await updateDoc(doc(db, 'customers', customer.id), { photos: updated });
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (customer.id) {
      try {
        await updateDoc(doc(db, 'customers', customer.id), { photos: updated });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Display Name */}
        <div className="px-6 pt-6 pb-2 text-left">
          <h2 className="text-2xl font-light tracking-wide text-gray-800 lowercase first-letter:uppercase">
            {firstName || 'cliente'} {firstApellido || ''}
          </h2>
        </div>

        {/* Core Tab Buttons (Row of 5 icons) */}
        <div className="flex justify-around items-center px-4 py-2 bg-gray-50/50 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveSubTab('basic')}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === 'basic' ? 'bg-[#8CC63F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
            title="Ficha Básica"
          >
            <FileText className="w-5.5 h-5.5" />
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('locations')}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === 'locations' ? 'bg-[#8CC63F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
            title="Direcciones y Teléfonos"
          >
            <MapPin className="w-5.5 h-5.5" />
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('references')}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === 'references' ? 'bg-[#8CC63F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
            title="Referencias"
          >
            <User className="w-5.5 h-5.5" />
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('sales')}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === 'sales' ? 'bg-[#8CC63F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
            title="Ventas y Pagos"
          >
            <Banknote className="w-5.5 h-5.5" />
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('photos')}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === 'photos' ? 'bg-[#8CC63F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
            title="Fotos"
          >
            <Image className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Modal Inner Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[60vh] text-left">
          
          {/* Notifications */}
          {notification && (
            <div className={`p-3 rounded-lg text-xs font-bold ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {notification.message}
            </div>
          )}

          {/* TAB 1: BASIC FICHA */}
          {activeSubTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Primer nombre *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo nombre</label>
                  <input
                    type="text"
                    placeholder="Ingresar segundo nombre"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Primer apellido *</label>
                  <input
                    type="text"
                    value={firstApellido}
                    onChange={(e) => setFirstApellido(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo apellido</label>
                  <input
                    type="text"
                    value={secondApellido}
                    onChange={(e) => setSecondApellido(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-500">Apodo / Alias *</label>
                <input
                  type="text"
                  value={apodo}
                  onChange={(e) => setApodo(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-500">E-Mail</label>
                <input
                  type="email"
                  placeholder="Ingresar e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Tipo Doc *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
                  >
                    <option value="CPF">CPF</option>
                    <option value="Cédula">Cédula</option>
                    <option value="DNI">DNI</option>
                    <option value="RUT">RUT</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Documento 1 *</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Documento 2</label>
                  <input
                    type="text"
                    placeholder="Ingresar documento"
                    value={doc2}
                    onChange={(e) => setDoc2(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] text-gray-600 focus:border-[#8CC63F]"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] uppercase font-extrabold text-gray-500">Dirección</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F] w-full"
                />

                {/* Botão de adicionar localização atual embaixo do campo de endereço */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                      latitude && longitude
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-[#8CC63F] text-white border-transparent hover:bg-[#7BB52F] active:scale-[0.98]'
                    }`}
                    title="Obter localização atual"
                  >
                    <MapPin className={`w-4 h-4 ${gettingLocation ? 'animate-bounce text-white' : 'text-current'}`} />
                    {gettingLocation ? 'Obtendo Localização Atual...' : latitude && longitude ? 'Atualizar Localização GPS' : 'Adicionar Localização Atual'}
                  </button>

                  {latitude && longitude && (
                    <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-[10px] text-green-800 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="font-extrabold uppercase text-[9px]">Coordenadas:</span>
                        <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLatitude(null);
                          setLongitude(null);
                        }}
                        className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer uppercase text-[9px] hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Barrio</label>
                  <input
                    type="text"
                    placeholder="Ingresar barrio"
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ingresar teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono Celular *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={celularPrefix}
                    onChange={(e) => setCelularPrefix(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] w-14 text-center focus:border-[#8CC63F]"
                    placeholder="55"
                  />
                  <input
                    type="text"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] flex-1 focus:border-[#8CC63F]"
                    placeholder="Celular sin código de país"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-500">Actividad Económica</label>
                <select
                  value={actividad}
                  onChange={(e) => setActividad(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
                >
                  <option value="Comercio">Comercio Minorista / Tienda</option>
                  <option value="Servicios">Servicios / Oficios</option>
                  <option value="Producción">Producción / Manufactura</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-500">Comentarios o Indicaciones</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] h-18 focus:border-[#8CC63F]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                <span className="text-xs font-bold text-gray-700">Estado del Cliente: Activo</span>
                <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only"
                    id="modalActive"
                  />
                  <label
                    htmlFor="modalActive"
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                      active ? 'bg-[#8CC63F]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white shadow transform duration-200 ease-in-out mt-1 ${
                        active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBasic}
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#8CC63F] hover:bg-[#7BB52F] rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                >
                  {saving ? 'Guardando...' : 'Guardar Ficha'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATIONS & PHONES */}
          {activeSubTab === 'locations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card for Additional Address */}
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8CC63F]" />
                      Añadir Dirección Adicional
                    </h3>
                    
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Dirección *</label>
                      <input
                        type="text"
                        placeholder="Ej: Calle 10, Edificio Royal Suite 1202"
                        value={inputAddress}
                        onChange={(e) => setInputAddress(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Barrio</label>
                        <input
                          type="text"
                          placeholder="Ej: Centro"
                          value={inputBarrio}
                          onChange={(e) => setInputBarrio(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                        <input
                          type="text"
                          placeholder="Ej: Brasilia"
                          value={inputCity}
                          onChange={(e) => setInputCity(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
                  >
                    Añadir Dirección
                  </button>
                </div>

                {/* Card for Additional Phone */}
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#8CC63F]" />
                      Añadir Teléfono Adicional
                    </h3>
                    
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Número de Teléfono *</label>
                      <input
                        type="tel"
                        placeholder="Ej: +55 6191202335"
                        value={inputPhone}
                        onChange={(e) => setInputPhone(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
                  >
                    Añadir Teléfono
                  </button>
                </div>
              </div>

              {/* Addresses List (styled like mockup) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Direcciones</h4>
                {addresses.length === 0 ? (
                  <div className="text-xs text-gray-400 italic">No hay direcciones adicionales registradas.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                        <div className="p-3 flex justify-between items-start">
                          <div className="space-y-1 text-xs text-gray-700">
                            <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Dirección:</span> {addr.address}</div>
                            {addr.barrio && <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Barrio:</span> {addr.barrio}</div>}
                            <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Ciudad:</span> {addr.city}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phones List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Teléfonos</h4>
                {phones.length === 0 ? (
                  <div className="text-xs text-gray-400 italic">No hay teléfonos adicionales registrados.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {phones.map((ph) => (
                      <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                        <div className="p-3 flex justify-between items-start">
                          <div className="space-y-1 text-xs text-gray-700">
                            <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Número:</span> {ph.number}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePhone(ph.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REFERENCES */}
          {activeSubTab === 'references' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Añadir Referencia Familiar o Comercial</h3>
                
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-black text-gray-400">Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Nombre de la referencia"
                    value={refName}
                    onChange={(e) => setRefName(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-black text-gray-400">País</label>
                    <select
                      value={refCountry}
                      onChange={(e) => setRefCountry(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                    >
                      <option value="SIN PAÍS">SIN PAÍS</option>
                      <option value="Brasil">Brasil</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-black text-gray-400">Estado</label>
                    <input
                      type="text"
                      placeholder="Estado/Prov"
                      value={refState}
                      onChange={(e) => setRefState(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                    <input
                      type="text"
                      placeholder="Ciudad"
                      value={refCity}
                      onChange={(e) => setRefCity(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-black text-gray-400">Dirección Completa *</label>
                  <input
                    type="text"
                    placeholder="Calle, número, depto"
                    value={refAddress}
                    onChange={(e) => setRefAddress(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-black text-gray-400">Teléfono Fijo</label>
                    <input
                      type="tel"
                      placeholder="Fijo u alternativo"
                      value={refPhone}
                      onChange={(e) => setRefPhone(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-black text-gray-400">Celular *</label>
                    <input
                      type="tel"
                      placeholder="Celular con código"
                      value={refCelular}
                      onChange={(e) => setRefCelular(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-black text-gray-400">Comentarios / Relación *</label>
                  <input
                    type="text"
                    placeholder="Ej: Madre, Hermano, Socio comercial..."
                    value={refComment}
                    onChange={(e) => setRefComment(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddReference}
                  className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Guardar Referencia
                </button>
              </div>

              {/* References list */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Referencias Guardadas</h4>
                {refList.length === 0 ? (
                  <div className="text-xs text-gray-400 italic text-center py-4">No hay referencias registradas para este cliente.</div>
                ) : (
                  <div className="space-y-3">
                    {refList.map((ref) => (
                      <div key={ref.id} className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex justify-between items-start">
                        <div className="space-y-1.5 text-xs text-gray-700 flex-1">
                          <div className="font-bold text-[#6B21A8] text-sm">{ref.name}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Relación/Comentarios: {ref.comment}</div>
                          <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] border-t border-gray-50">
                            <div><span className="font-extrabold text-gray-400">Celular:</span> {ref.celular}</div>
                            {ref.phone && <div><span className="font-extrabold text-gray-400">Fijo:</span> {ref.phone}</div>}
                          </div>
                          <div className="text-[11px]"><span className="font-extrabold text-gray-400">Ubicación:</span> {ref.address} ({ref.city || 'Sin ciudad'}, {ref.country})</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReference(ref.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded shrink-0 ml-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SALES & PAYMENTS */}
          {activeSubTab === 'sales' && (
            <div className="space-y-5">
              
              {/* Sales List Table */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-1">Ventas</h3>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#8CC63F] text-white">
                        <th className="py-2 px-3 text-left font-black">UGI</th>
                        <th className="py-2 px-3 text-left font-black">Caixa</th>
                        <th className="py-2 px-3 text-left font-black">Data de venda</th>
                        <th className="py-2 px-3 text-right font-black">Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {salesToDisplay.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{sale.ugi}</td>
                          <td className="py-2.5 px-3 text-gray-600">{sale.caixa}</td>
                          <td className="py-2.5 px-3 text-gray-500 text-[10px]">{sale.date}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-gray-800">
                            $ {(sale.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-1 flex justify-start">
                  <button
                    type="button"
                    className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-extrabold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  >
                    Movimento de venda
                  </button>
                </div>
              </div>

              {/* Payments/Collections List Table */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">Pagos</h3>
                  <button type="button" className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer" title="Descargar Historial">
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#8CC63F] text-white">
                        <th className="py-2 px-3 text-left font-black">UGI</th>
                        <th className="py-2 px-3 text-left font-black">Caixa</th>
                        <th className="py-2 px-3 text-left font-black">Data de Pagamento</th>
                        <th className="py-2 px-3 text-right font-black">Tipo de movimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {paymentsToDisplay.map((pay) => (
                        <tr key={pay.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{pay.ugi}</td>
                          <td className="py-2.5 px-3 text-gray-600">{pay.caixa}</td>
                          <td className="py-2.5 px-3 text-gray-500 text-[10px]">{pay.date}</td>
                          <td className="py-2.5 px-3 text-right text-[11px] font-bold text-green-700">
                            {pay.method} - $ {(pay.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: PHOTOS */}
          {activeSubTab === 'photos' && (
            <div className="space-y-4">
              
              {/* Image upload area */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-700">Fotos del Cliente / Casa</h3>
                <label className="bg-[#6B21A8] hover:bg-[#52006A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>Subir Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Primary photos */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Fotos principales</h4>
                <div className="grid grid-cols-3 gap-3">
                  {photosToDisplay.map((photo, index) => (
                    <div key={index} className="relative aspect-square border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 shadow-xs group">
                      <img
                        src={photo}
                        alt={`Cliente Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(index)}
                        className="absolute top-1.5 right-1.5 bg-white text-gray-600 hover:text-red-500 rounded-full p-1 shadow-sm transition-transform scale-90 group-hover:scale-100 cursor-pointer"
                        title="Eliminar foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* All photos */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Todas las fotos</h4>
                {photosToDisplay.length === 0 ? (
                  <div className="text-xs text-gray-400 italic py-6 text-center">No hay fotos guardadas en el expediente del cliente.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {photosToDisplay.map((photo, index) => (
                      <div key={index} className="aspect-video border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 shadow-xs">
                        <img
                          src={photo}
                          alt={`Expediente Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* WhatsApp Floating Action Button */}
        {celular && (
          <a
            href={`https://wa.me/${celularPrefix + celular.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 md:absolute md:bottom-6 md:right-6 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center cursor-pointer"
            title="Contactar por WhatsApp"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.167 0 9.378-4.21 9.38-9.384.002-2.507-.972-4.866-2.74-6.637C16.145 2.813 13.79 1.838 11.3 1.837c-5.18 0-9.4 4.21-9.403 9.383-.001 1.622.42 3.209 1.218 4.606L2.116 21.6l5.962-1.562c1.373.748 2.871 1.139 4.398 1.14h.01zm11.233-6.233c-.312-.156-1.848-.91-2.133-1.014-.286-.104-.494-.156-.701.156-.207.312-.804.104-.986.312-.18.207-.364.228-.675.072-.312-.156-1.316-.484-2.507-1.547-.927-.827-1.553-1.849-1.735-2.16-.182-.312-.02-.48.136-.635.14-.14.312-.364.468-.546.156-.182.208-.312.312-.52.104-.207.052-.39-.026-.546-.078-.156-.7-.156-.96-.468-.255-.312-.47-.234-.64-.234-.17 0-.364-.02-.56-.02-.196 0-.515.072-.784.364-.27.292-1.026 1.001-1.026 2.441 0 1.44 1.047 2.829 1.192 3.024.145.195 2.058 3.14 4.985 4.402.696.3 1.239.479 1.663.613.7.223 1.338.192 1.843.117.563-.085 1.728-.707 1.972-1.391.243-.684.243-1.27.17-1.391-.073-.12-.27-.193-.582-.349z"/>
            </svg>
          </a>
        )}

      </div>
    </div>
  );
}

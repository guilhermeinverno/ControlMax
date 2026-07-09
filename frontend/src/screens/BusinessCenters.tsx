import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { db } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { collection, query, where, onSnapshot, doc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  X, 
  Save, 
  Building2, 
  Coins, 
  User, 
  FileText, 
  Info, 
  PlusCircle, 
  Search, 
  MapPin, 
  DollarSign, 
  Percent, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface BusinessCentersProps {
  onNavigate?: (screen: Screen) => void;
}

interface Unit {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

interface FinancialParams {
  maxAmountPerCredit: number;
  annualInterestRate: number;
  lateFeePercentage: number;
  allowRefinance: boolean;
  minCapitalRequirement: number;
}

interface BusinessCenter {
  id: string;
  name: string;
  code: string;
  status: 'Activo' | 'Inactivo';
  unitCount: number;
  responsible: string;
  observations: string;
  linkedUnits: Unit[];
  financialParams: FinancialParams;
}

const DEFAULT_CENTERS: Omit<BusinessCenter, 'id'>[] = [
  {
    name: 'Centro Metropolitano Norte',
    code: 'CN-MET-NOR',
    status: 'Activo',
    unitCount: 4,
    responsible: 'Humberto De la Calle',
    observations: 'Atiende la zona comercial norte alta densidad. Mayor flujo de créditos Express diaria.',
    linkedUnits: [
      { id: 'U-01', name: 'Oficina Central Kennedy', location: 'Av. Kennedy #45-12', active: true },
      { id: 'U-02', name: 'Ruta 10 - Chapinero Local', location: 'Barrio Chapinero', active: true },
      { id: 'U-03', name: 'Punto Express Suba Alianza', location: 'Calle 116 con 45', active: true },
      { id: 'U-04', name: 'Ruta 14 - Minutos de Dios', location: 'Minuto de Dios', active: false }
    ],
    financialParams: {
      maxAmountPerCredit: 10000000,
      annualInterestRate: 24,
      lateFeePercentage: 4,
      allowRefinance: true,
      minCapitalRequirement: 50000000
    }
  },
  {
    name: 'Centro Sur Comercial Pacífico',
    code: 'CN-SUR-PAC',
    status: 'Activo',
    unitCount: 3,
    responsible: 'Clara Luz Roldán',
    observations: 'Foco comercial en microcréditos rurales y semiurbanos del Pacífico.',
    linkedUnits: [
      { id: 'U-05', name: 'Sede Principal Cali Sur', location: 'Calle 5 #78-20', active: true },
      { id: 'U-06', name: 'Ruta 31 - Jamundí Semilla', location: 'Jamundí', active: true },
      { id: 'U-07', name: 'Ruta 33 - Palmira Centro', location: 'Palmira', active: true }
    ],
    financialParams: {
      maxAmountPerCredit: 15000000,
      annualInterestRate: 22,
      lateFeePercentage: 5,
      allowRefinance: false,
      minCapitalRequirement: 75000000
    }
  }
];

export function BusinessCenters({ onNavigate }: BusinessCentersProps) {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [centers, setCenters] = useState<BusinessCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  // Load real-time Business Centers
  useEffect(() => {
    if (!tenantId) return;

    const collectionRef = collection(db, 'business_centers');
    const q = query(collectionRef, where('tenantId', '==', tenantId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default centers if empty
        setLoadingCenters(true);
        try {
          for (const item of DEFAULT_CENTERS) {
            await addDoc(collectionRef, {
              ...item,
              tenantId
            });
          }
        } catch (err) {
          console.error("Error seeding default business centers:", err);
        }
        setLoadingCenters(false);
        return;
      }

      const loaded: BusinessCenter[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          code: data.code || '',
          status: data.status || 'Activo',
          unitCount: data.unitCount || 0,
          responsible: data.responsible || '',
          observations: data.observations || '',
          linkedUnits: data.linkedUnits || [],
          financialParams: data.financialParams || {
            maxAmountPerCredit: 5000000,
            annualInterestRate: 20,
            lateFeePercentage: 5,
            allowRefinance: true,
            minCapitalRequirement: 10000000
          }
        };
      });

      setCenters(loaded);
      setLoadingCenters(false);
    }, (error) => {
      console.error("Error loading business centers:", error);
      setLoadingCenters(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Main UI state
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formStatus, setFormStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [formObservations, setFormObservations] = useState('');
  
  // Secondary level tabs inside general creation/edition
  const [formTab, setFormTab] = useState<'general' | 'units' | 'financial'>('general');

  // Child Form arrays
  const [formLinkedUnits, setFormLinkedUnits] = useState<Unit[]>([]);
  const [formFinMaxAmount, setFormFinMaxAmount] = useState('10000000');
  const [formFinInterest, setFormFinInterest] = useState('24');
  const [formFinLateFee, setFormFinLateFee] = useState('4');
  const [formFinAllowRefinance, setFormFinAllowRefinance] = useState(true);
  const [formFinCapitalReq, setFormFinCapitalReq] = useState('50000000');

  // Input states for inserting temporary new Units in sub-tab
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitLocation, setNewUnitLocation] = useState('');

  // Start Creation
  const handleNewClick = () => {
    setSelectedCenterId(null);
    setFormName('');
    setFormCode('');
    setFormResponsible('');
    setFormStatus('Activo');
    setFormObservations('');
    setFormLinkedUnits([]);
    setFormFinMaxAmount('8000000');
    setFormFinInterest('24');
    setFormFinLateFee('5');
    setFormFinAllowRefinance(true);
    setFormFinCapitalReq('30000000');
    
    setFormTab('general');
    setViewMode('form');
  };

  // Start Edit
  const handleEditClick = (center: BusinessCenter) => {
    setSelectedCenterId(center.id);
    setFormName(center.name);
    setFormCode(center.code);
    setFormResponsible(center.responsible);
    setFormStatus(center.status);
    setFormObservations(center.observations);
    setFormLinkedUnits([...center.linkedUnits]);
    setFormFinMaxAmount(center.financialParams.maxAmountPerCredit.toString());
    setFormFinInterest(center.financialParams.annualInterestRate.toString());
    setFormFinLateFee(center.financialParams.lateFeePercentage.toString());
    setFormFinAllowRefinance(center.financialParams.allowRefinance);
    setFormFinCapitalReq(center.financialParams.minCapitalRequirement.toString());

    setFormTab('general');
    setViewMode('form');
  };

  // Delete Center
  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar el Centro de Negocio: "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, 'business_centers', id));
      } catch (error) {
        console.error("Error deleting business center:", error);
        alert("Error al eliminar el Centro de Negocio.");
      }
    }
  };

  // Unit subactions
  const handleAddUnit = () => {
    if (!newUnitName.trim()) {
      alert('Por favor ingrese el nombre de la unidad.');
      return;
    }
    const nUnit: Unit = {
      id: `U-${Date.now().toString().slice(-4)}`,
      name: newUnitName,
      location: newUnitLocation || 'No Especificada',
      active: true
    };
    setFormLinkedUnits([...formLinkedUnits, nUnit]);
    setNewUnitName('');
    setNewUnitLocation('');
  };

  const handleToggleUnitActive = (id: string) => {
    setFormLinkedUnits(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const handleRemoveUnit = (id: string) => {
    setFormLinkedUnits(prev => prev.filter(u => u.id !== id));
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim() || !formResponsible.trim()) {
      alert('Por favor, complete todos los campos requeridos (*).');
      return;
    }

    if (!tenantId) {
      alert('Error: No se ha configurado el inquilino.');
      return;
    }

    const payload = {
      tenantId,
      name: formName,
      code: formCode.toUpperCase().replace(/\s+/g, '-'),
      status: formStatus,
      unitCount: formLinkedUnits.length,
      responsible: formResponsible,
      observations: formObservations,
      linkedUnits: formLinkedUnits,
      financialParams: {
        maxAmountPerCredit: parseFloat(formFinMaxAmount) || 5000000,
        annualInterestRate: parseFloat(formFinInterest) || 20,
        lateFeePercentage: parseFloat(formFinLateFee) || 5,
        allowRefinance: formFinAllowRefinance,
        minCapitalRequirement: parseFloat(formFinCapitalReq) || 10000000
      }
    };

    try {
      if (selectedCenterId) {
        // Editing in Firestore
        await setDoc(doc(db, 'business_centers', selectedCenterId), payload);
      } else {
        // Creating in Firestore
        await addDoc(collection(db, 'business_centers'), payload);
      }

      setViewMode('list');
      setSelectedCenterId(null);
    } catch (error) {
      console.error("Error saving business center:", error);
      alert("Error al guardar el Centro de Negocio.");
    }
  };

  // Search filter
  const filteredCenters = centers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.responsible.toLowerCase().includes(q)
    );
  });

  if (tenantLoading || loadingCenters) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F3F4F6] text-[#333333]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B21A8] mb-4"></div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargando Centros de Negocios...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      
      {/* DESCRIPTIVE UPPER BANNER */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="bg-purple-100 p-2 rounded-full mt-0.5">
            <Briefcase className="w-5 h-5 text-[#6B21A8]" />
          </div>
          <div>
            <h2 className="text-xs font-black text-[#6B21A8] uppercase tracking-wider">Módulo Orgánico</h2>
            <p className="text-xs text-[#555555]">
              Administración unificada de sucursales, responsables y topes de cartera comercial.
            </p>
          </div>
        </div>
        {viewMode === 'list' && (
          <button 
            type="button"
            onClick={handleNewClick}
            className="bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold text-xs py-1.5 px-3 rounded-sm flex items-center shadow-sm uppercase tracking-wide"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Centro
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="p-3 space-y-3">
          {/* SEARCH BOX */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 flex items-center">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text"
              placeholder="Buscar por Nombre, Código o Responsable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium outline-none bg-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* LISTA TABLE */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#E5E7EB] text-[#333333] text-[10px] uppercase tracking-wider">
                    <th className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap w-16 text-center">ID</th>
                    <th className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap">Nombre</th>
                    <th className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap text-center">Código</th>
                    <th className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap text-center">Estado</th>
                    <th className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap text-center w-28">Unidades</th>
                    <th className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap">Responsable</th>
                    <th className="p-2.5 font-bold whitespace-nowrap text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-[#333333]">
                  {filteredCenters.map((center) => (
                    <tr key={center.id} className="border-b border-gray-200 hover:bg-gray-55/40 transition-colors">
                      <td className="p-2.5 border-r border-gray-200 text-center font-mono font-bold text-gray-500 whitespace-nowrap">
                        {center.id}
                      </td>
                      <td className="p-2.5 border-r border-gray-200 font-bold text-[#333333] whitespace-nowrap">
                        {center.name}
                      </td>
                      <td className="p-2.5 border-r border-gray-200 text-center font-mono font-semibold text-gray-700 uppercase whitespace-nowrap">
                        {center.code}
                      </td>
                      <td className="p-2.5 border-r border-gray-200 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                          center.status === 'Activo' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {center.status}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-gray-200 text-center font-bold text-[#6B21A8] whitespace-nowrap">
                        {center.unitCount} unid.
                      </td>
                      <td className="p-2.5 border-r border-gray-200 text-gray-700 font-medium whitespace-nowrap">
                        {center.responsible}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <button 
                            onClick={() => handleEditClick(center)}
                            className="bg-purple-50 hover:bg-purple-100 p-1.5 rounded text-[#6B21A8] border border-purple-200"
                            title="Editar Centro"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(center.id, center.name)}
                            className="bg-red-50 hover:bg-red-100 p-1.5 rounded text-red-600 border border-red-200"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCenters.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[#777777] italic bg-gray-50">
                        No hay centros de negocio registrados o ninguno coincide con los filtros de búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* INFO CARD BOX LIST */}
          <div className="bg-[#FAF5FF] border border-[#D8B4FE] shadow-sm rounded p-3 flex items-start space-x-2 text-xs">
            <Info className="w-4 h-4 text-[#7B1FA2] shrink-0 mt-0.5" />
            <div className="text-[#333333]">
              <strong className="text-[#7B1FA2] block mb-0.5 uppercase tracking-wider text-[10px]">Eje de Control Financiero</strong>
              Cada Centro de Negocio maneja su grupo de <strong>unidades vinculadas</strong> y define políticas individuales como la tasa de interés regulada, la amortización extraordinaria, y los mínimos de caja para operaciones.
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="w-full bg-[#333333] hover:bg-[#444444] text-white font-bold py-2.5 text-xs flex justify-center items-center rounded-sm shadow-sm uppercase tracking-wider"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cerrar de Negocios
          </button>
        </div>
      ) : (
        /* FORMULARIO EDIT/CREATE WITH SUBTABS */
        <div className="p-3 space-y-3">
          
          <div className="bg-[#6B21A8] text-white p-2.5 rounded-t-sm flex items-center justify-between shadow-sm">
            <span className="font-extrabold text-xs uppercase tracking-wider flex items-center">
              <Building2 className="w-4 h-4 mr-1.5" />
              {selectedCenterId ? `Editar Centro: ${selectedCenterId}` : 'Crear Nuevo Centro de Negocio'}
            </span>
            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-bold font-mono">
              FORMULARIO
            </span>
          </div>

          {/* INTERIOR TABS FOR THE ARCHITECTURE FOR BETTER SEGREGATION */}
          <div className="flex bg-white border-x border-b border-gray-300 text-xs">
            <button 
              type="button"
              onClick={() => setFormTab('general')}
              className={`flex-1 py-2 font-black text-center uppercase tracking-wider border-b-[3px] ${
                formTab === 'general' ? 'border-[#6B21A8] text-[#6B21A8]' : 'border-transparent text-gray-500'
              }`}
            >
              1. Datos Locales
            </button>
            <button 
              type="button"
              onClick={() => setFormTab('units')}
              className={`flex-1 py-2 font-black text-center uppercase tracking-wider border-b-[3px] ${
                formTab === 'units' ? 'border-[#6B21A8] text-[#6B21A8]' : 'border-transparent text-gray-500'
              }`}
            >
              2. Unidades Vinculadas ({formLinkedUnits.length})
            </button>
            <button 
              type="button"
              onClick={() => setFormTab('financial')}
              className={`flex-1 py-2 font-black text-center uppercase tracking-wider border-b-[3px] ${
                formTab === 'financial' ? 'border-[#6B21A8] text-[#6B21A8]' : 'border-transparent text-gray-500'
              }`}
            >
              3. Parámetros Financieros
            </button>
          </div>

          <div className="bg-white border-x border-b border-gray-300 p-3 shadow-sm rounded-b-sm">
            
            {/* SUB-TAB 1: GENERAL FORMULÁRIO */}
            {formTab === 'general' && (
              <div className="space-y-3 animate-fade-in text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1">Nombre del Centro *</label>
                    <input 
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej. Centro Metropolitano Norte"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#6B21A8] outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1">Código Único *</label>
                    <input 
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="Ej. CN-MET-NOR"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#6B21A8] outline-none font-mono uppercase font-bold text-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1">Responsable del Centro *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        required
                        value={formResponsible}
                        onChange={(e) => setFormResponsible(e.target.value)}
                        placeholder="Nombre del director administrador"
                        className="w-full border border-gray-300 rounded pl-7.5 pr-2.5 py-1.5 focus:border-[#6B21A8] outline-none font-semibold text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-600 mb-1">Estado de Operación *</label>
                    <select 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'Activo' | 'Inactivo')}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#6B21A8] outline-none bg-white font-semibold text-gray-800"
                    >
                      <option value="Activo">Activo (Habilitado para cobros)</option>
                      <option value="Inactivo">Inactivo (Suspendido temporalmente)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-600 mb-1">Observaciones Operacionales</label>
                  <textarea 
                    rows={3}
                    value={formObservations}
                    onChange={(e) => setFormObservations(e.target.value)}
                    placeholder="Ingrese observaciones descriptivas, límites geográficos o reportes específicos."
                    className="w-full border border-gray-300 rounded p-2 focus:border-[#6B21A8] outline-none text-gray-600 font-medium"
                  />
                </div>

                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-500">
                  ⚠️ Los campos marcados con asterisco (*) son de diligenciamiento obligatorio para el resguardo e indexación del historial.
                </div>
              </div>
            )}

            {/* SUB-TAB 2: UNIDADES VINCULADAS */}
            {formTab === 'units' && (
              <div className="space-y-4 animate-fade-in text-xs">
                
                <div className="bg-[#FAF5FF] border border-[#E9D5FF] p-2.5 rounded">
                  <span className="font-extrabold text-[10px] text-[#6B21A8] uppercase tracking-wider block mb-2">Vincular Nueva Unidad Física o Ruta</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Nombre de la Unidad *</label>
                      <input 
                        type="text"
                        placeholder="Ej. Oficina Alianza Suba"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        className="w-full border border-gray-200 rounded p-1 text-xs outline-none bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Ubicación / Cobertura</label>
                      <input 
                        type="text"
                        placeholder="Ej. Calle 116 #45"
                        value={newUnitLocation}
                        onChange={(e) => setNewUnitLocation(e.target.value)}
                        className="w-full border border-gray-200 rounded p-1 text-xs outline-none bg-white font-medium"
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleAddUnit}
                    className="mt-2 bg-[#6B21A8] hover:bg-[#581C87] text-white font-black text-[10px] uppercase py-1 px-3 rounded flex items-center shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    Anexar Unidad
                  </button>
                </div>

                {/* TABLA LIST */}
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-gray-150 px-2 py-1.5 text-[10px] uppercase font-bold text-gray-700 tracking-wider">
                    Unidades Adjuntas ({formLinkedUnits.length})
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold border-b border-gray-200">
                        <th className="p-2 w-16 text-center">ID</th>
                        <th className="p-2">Nombre de Unidad</th>
                        <th className="p-2">Ubicación</th>
                        <th className="p-2 text-center w-20">Estado</th>
                        <th className="p-2 text-center w-16">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formLinkedUnits.map((u, index) => (
                        <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50 text-[11px]">
                          <td className="p-2 text-center font-mono font-bold text-gray-400">{u.id}</td>
                          <td className="p-2 font-bold text-gray-800">{u.name}</td>
                          <td className="p-2 font-medium text-gray-650">{u.location}</td>
                          <td className="p-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => handleToggleUnitActive(u.id)}
                              className={`px-2 py-0.5 text-[9px] font-bold rounded ${u.active ? 'bg-green-100 text-green-800 border border-green-200':'bg-red-100 text-red-800'}`}
                            >
                              {u.active ? 'Activa' : 'Inactiva'}
                            </button>
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              type="button"
                              onClick={() => handleRemoveUnit(u.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formLinkedUnits.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 italic font-medium bg-gray-50">
                            Ninguna unidad física vinculada. Ingrese datos en el panel superior.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* SUB-TAB 3: PARÁMETROS FINANCIEROS */}
            {formTab === 'financial' && (
              <div className="space-y-3 animate-fade-in text-xs">
                
                <div className="bg-[#FAF5FF] border border-[#E9D5FF] p-2 rounded flex items-center space-x-2 text-[11px] text-[#6B21A8] font-bold mb-1">
                  <Coins className="w-4 h-4 shrink-0" />
                  <span>Configuración de límites crediticios y porcentajes del Centro.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Monto Máximo Permitido por Solicitud ($)</label>
                    <div className="relative">
                      <span className="absolute left-2 text-gray-400 font-black text-[10px] top-1/2 -translate-y-1/2">$</span>
                      <input 
                        type="number"
                        value={formFinMaxAmount}
                        onChange={(e) => setFormFinMaxAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded pl-7 pr-2.5 py-1 text-xs outline-none focus:border-[#6B21A8] font-bold text-gray-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Tasa de Interés Regular Anual (%)</label>
                    <div className="relative">
                      <span className="absolute right-2 text-gray-400 font-bold text-[10px] top-1/2 -translate-y-1/2">% EA</span>
                      <input 
                        type="number"
                        value={formFinInterest}
                        onChange={(e) => setFormFinInterest(e.target.value)}
                        className="w-full border border-gray-300 rounded pl-2.5 pr-12 py-1 text-xs outline-none focus:border-[#6B21A8] font-bold text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Recargo por Mora Mensual (%)</label>
                    <div className="relative">
                      <span className="absolute right-2 text-gray-400 font-bold text-[10px] top-1/2 -translate-y-1/2">% MM</span>
                      <input 
                        type="number"
                        value={formFinLateFee}
                        onChange={(e) => setFormFinLateFee(e.target.value)}
                        className="w-full border border-gray-300 rounded pl-2.5 pr-12 py-1 text-xs outline-none focus:border-[#6B21A8] font-bold text-gray-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Capital Operativo Mínimo Exigido ($)</label>
                    <div className="relative">
                      <span className="absolute left-2 text-gray-400 font-black text-[10px] top-1/2 -translate-y-1/2">$</span>
                      <input 
                        type="number"
                        value={formFinCapitalReq}
                        onChange={(e) => setFormFinCapitalReq(e.target.value)}
                        className="w-full border border-gray-300 rounded pl-7 pr-2.5 py-1 text-xs outline-none focus:border-[#6B21A8] font-bold text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="allowRefin"
                    checked={formFinAllowRefinance}
                    onChange={(e) => setFormFinAllowRefinance(e.target.checked)}
                    className="w-4 h-4 text-[#6B21A8] focus:ring-[#6B21A8] border-gray-300 rounded"
                  />
                  <label htmlFor="allowRefin" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
                    Habilitar Refinanciación de créditos en mora parcial
                  </label>
                </div>

              </div>
            )}

            {/* BOTONES DE ACTION COHESIVE CON OBJETIVOS */}
            <div className="flex space-x-2 border-t border-gray-200 pt-3 mt-4">
              <button 
                type="button"
                onClick={handleSave}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-black text-xs py-2.5 px-4 rounded-sm flex items-center justify-center shadow-sm uppercase tracking-wider"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Guardar Centro
              </button>
              <button 
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setSelectedCenterId(null);
                }}
                className="px-4 py-2.5 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 font-black text-xs rounded-sm shadow-sm uppercase tracking-wide"
              >
                Cancelar
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

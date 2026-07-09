import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import type { FormOrButtonEvent } from '../types/reactEvents';
import { 
  ShieldCheck, 
  History, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Briefcase, 
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { logFirestoreError } from '../utils/firestoreError';
import { useTenant } from '../hooks/useTenant';
import { insuranceStatusBadgeClasses } from '../utils/statusLabels';

interface InsuredPerson {
  id?: string;
  tenantId: string;
  unidad: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  paisNatal: string;
  estadoNatal: string;
  ciudadNatal: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  correo: string;
  celular: string;
  paisResidencia: string;
  estadoResidencia: string;
  ciudadResidencia: string;
  direccion: string;
  estadoCivil: string;
  numeroHijos: string;
  paqueteSeguro: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  registeredBy: string;
  createdAt?: any; // FIXED_BY_SCRIPT
}

export function Insurance() {
  const { tenantId, userName } = useTenant();
  const [activeTab, setActiveTab] = useState<'aprobacion' | 'historico' | 'gestion'>('aprobacion');
  
  // Form states
  const [unidad, setUnidad] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [paisNatal, setPaisNatal] = useState('Colombia');
  const [estadoNatal, setEstadoNatal] = useState('');
  const [ciudadNatal, setCiudadNatal] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('Cédula de Ciudadanía (CC)');
  const [documento, setDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');
  const [paisResidencia, setPaisResidencia] = useState('Colombia');
  const [estadoResidencia, setEstadoResidencia] = useState('');
  const [ciudadResidencia, setCiudadResidencia] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('Soltero/a');
  const [numeroHijos, setNumeroHijos] = useState('0');
  const [paqueteSeguro, setPaqueteSeguro] = useState('Plan Estándar - $ 150.000,00');

  // Operational states
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [insuredList, setInsuredList] = useState<InsuredPerson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fallback units if none exist in tenant database
  const fallbackUnits = [
    { id: 'u1', name: 'Unidad Medellín Centro' },
    { id: 'u2', name: 'Unidad Bogotá Norte' },
    { id: 'u3', name: 'Unidad Cali Sur' },
    { id: 'u4', name: 'Unidad Bucaramanga Este' }
  ];

  // Fetch business centers (units)
  useEffect(() => {
    if (!tenantId) return;

    const q = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().cityName || 'Unidad de Negocio'
      }));
      setUnits(fetched.length > 0 ? fetched : fallbackUnits);
    }, (err) => {
      console.error('Error fetching business centers', err);
      setUnits(fallbackUnits);
      try {
        logFirestoreError(err, 'get', 'business_centers', { throwError: true });
      } catch (e) {
        // Logged and captured
      }
    });

    return () => unsub();
  }, [tenantId]);

  // Fetch real-time insurance candidates under this tenant
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, 'insurance_applications'), 
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InsuredPerson[];
      setInsuredList(list);
    }, (err) => {
      console.error('Error fetching insurance applications', err);
      try {
        logFirestoreError(err, 'get', 'insurance_applications', { throwError: true });
      } catch (e) {
        // Logged and captured
      }
    });

    return () => unsub();
  }, [tenantId]);

  const handleResetForm = () => {
    setUnidad('');
    setPrimerNombre('');
    setSegundoNombre('');
    setPrimerApellido('');
    setSegundoApellido('');
    setPaisNatal('Colombia');
    setEstadoNatal('');
    setCiudadNatal('');
    setTipoDocumento('Cédula de Ciudadanía (CC)');
    setDocumento('');
    setFechaNacimiento('');
    setCorreo('');
    setCelular('');
    setPaisResidencia('Colombia');
    setEstadoResidencia('');
    setCiudadResidencia('');
    setDireccion('');
    setEstadoCivil('Soltero/a');
    setNumeroHijos('0');
    setPaqueteSeguro('Plan Estándar - $ 150.000,00');
  };

  const handleSave = async (e: FormOrButtonEvent, isDirectApproval: boolean) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate required fields
    if (
      !unidad || 
      !primerNombre || 
      !primerApellido || 
      !paisNatal || 
      !estadoNatal || 
      !ciudadNatal || 
      !tipoDocumento || 
      !documento || 
      !fechaNacimiento || 
      !celular || 
      !paisResidencia || 
      !direccion || 
      !estadoCivil || 
      !numeroHijos || 
      !paqueteSeguro
    ) {
      setErrorMsg('Por favor complete todos los campos marcados con asterisco (*).');
      return;
    }

    try {
      setSaving(true);

      const payload: InsuredPerson = {
        tenantId,
        unidad,
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        paisNatal,
        estadoNatal,
        ciudadNatal,
        tipoDocumento,
        documento,
        fechaNacimiento,
        correo,
        celular,
        paisResidencia,
        estadoResidencia,
        ciudadResidencia,
        direccion,
        estadoCivil,
        numeroHijos,
        paqueteSeguro,
        status: isDirectApproval ? 'Aprobado' : 'Pendiente',
        registeredBy: userName || 'Sistema',
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'insurance_applications'), payload);
      } catch (err: unknown) {
        logFirestoreError(err, 'create', 'insurance_applications', { throwError: true });
      }
      
      setSuccessMsg(
        isDirectApproval 
          ? '¡Solicitud registrada y Aprobada con éxito en el sistema!' 
          : '¡Asegurado guardado exitosamente en estado de revisión!'
      );
      
      handleResetForm();
      
      // Auto switch to history to view results after 1.5 seconds
      setTimeout(() => {
        setActiveTab('historico');
        setSuccessMsg(null);
      }, 1500);

    } catch (err: unknown) {
      console.error('Error saving insurance application', err);
      setErrorMsg('Error al guardar la solicitud en la base de datos: ' + (getErrorMessage(err)));
    } finally {
      setSaving(false);
    }
  };

  const filteredInsured = insuredList.filter(item => {
    const term = searchTerm.toLowerCase();
    const fullName = `${item.primerNombre} ${item.primerApellido}`.toLowerCase();
    return (
      fullName.includes(term) ||
      item.documento.includes(term) ||
      item.celular.includes(term) ||
      item.unidad.toLowerCase().includes(term) ||
      item.paqueteSeguro.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn text-gray-800">
      
      {/* PAGE TABS (Exactly like the TRY Controller layout) */}
      <div className="flex flex-wrap gap-2 border-b border-gray-300 pb-3">
        <button
          onClick={() => setActiveTab('aprobacion')}
          className={`px-5 py-2.5 rounded-lg flex items-center space-x-2 text-xs font-bold uppercase transition-all shadow-sm ${
            activeTab === 'aprobacion'
              ? 'bg-[#8CC63F] text-gray-900 border border-[#8CC63F]'
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Aprobación de Seguros</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`px-5 py-2.5 rounded-lg flex items-center space-x-2 text-xs font-bold uppercase transition-all shadow-sm ${
            activeTab === 'historico'
              ? 'bg-[#8CC63F] text-gray-900 border border-[#8CC63F]'
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Seguros</span>
        </button>

        <button
          onClick={() => setActiveTab('gestion')}
          className={`px-5 py-2.5 rounded-lg flex items-center space-x-2 text-xs font-bold uppercase transition-all shadow-sm ${
            activeTab === 'gestion'
              ? 'bg-[#8CC63F] text-gray-900 border border-[#8CC63F]'
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Gestión de Seguros</span>
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center space-x-2 text-xs font-semibold shadow-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-2 text-xs font-semibold shadow-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ACTIVE SCREEN RENDER */}
      {activeTab === 'aprobacion' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Form Header block */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-gray-700 tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-4 bg-[#8CC63F] rounded-sm inline-block"></span>
              <span>Nuevo Asegurado</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Formulario Obligatorio</span>
          </div>

          {/* Form Core */}
          <form className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Field 1: Unidad */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Unidad *</label>
                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                >
                  <option value="">Seleccione Unidad</option>
                  {units.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Field 2: Primer Nombre */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Primer Nombre *</label>
                <input
                  type="text"
                  value={primerNombre}
                  onChange={(e) => setPrimerNombre(e.target.value)}
                  placeholder="ingrese nombre"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 3: Segundo Nombre */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Segundo Nombre</label>
                <input
                  type="text"
                  value={segundoNombre}
                  onChange={(e) => setSegundoNombre(e.target.value)}
                  placeholder="ingrese segundo nombre"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                />
              </div>

              {/* Field 4: Primer Apellido */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Primer Apellido *</label>
                <input
                  type="text"
                  value={primerApellido}
                  onChange={(e) => setPrimerApellido(e.target.value)}
                  placeholder="ingrese primer apellido"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 5: Segundo Apellido */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Segundo Apellido</label>
                <input
                  type="text"
                  value={segundoApellido}
                  onChange={(e) => setSegundoApellido(e.target.value)}
                  placeholder="ingrese segundo apellido"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                />
              </div>

              {/* Field 6: País natal */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">País natal *</label>
                <select
                  value={paisNatal}
                  onChange={(e) => setPaisNatal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                >
                  <option value="Colombia">Colombia</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Perú">Perú</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Field 7: Estado natal */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Estado natal *</label>
                <input
                  type="text"
                  value={estadoNatal}
                  onChange={(e) => setEstadoNatal(e.target.value)}
                  placeholder="ingrese estado natal"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 8: Ciudad natal */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Ciudad natal *</label>
                <input
                  type="text"
                  value={ciudadNatal}
                  onChange={(e) => setCiudadNatal(e.target.value)}
                  placeholder="ingrese ciudad natal"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 9: Tipo de Documento */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Tipo De Documento *</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                >
                  <option value="Cédula de Ciudadanía (CC)">Cédula de Ciudadanía (CC)</option>
                  <option value="Cédula de Extranjería (CE)">Cédula de Extranjería (CE)</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Field 10: Documento */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Documento *</label>
                <input
                  type="text"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="ingrese número de documento"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 11: Fecha de Nacimiento */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9 text-gray-600"
                  required
                />
              </div>

              {/* Field 12: Correo Principal */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Correo Principal</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ingrese correo principal"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                />
              </div>

              {/* Field 13: Número Celular Principal */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Número Celular Principal *</label>
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="ingrese número celular Principal"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 14: País residencia */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">País residencia *</label>
                <select
                  value={paisResidencia}
                  onChange={(e) => setPaisResidencia(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                >
                  <option value="Colombia">Colombia</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Perú">Perú</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Field 15: Estado residencia */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Estado residencia</label>
                <input
                  type="text"
                  value={estadoResidencia}
                  onChange={(e) => setEstadoResidencia(e.target.value)}
                  placeholder="ingrese estado"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                />
              </div>

              {/* Field 16: Ciudad residencia */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Ciudad residencia</label>
                <input
                  type="text"
                  value={ciudadResidencia}
                  onChange={(e) => setCiudadResidencia(e.target.value)}
                  placeholder="ingrese ciudad"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                />
              </div>

              {/* Field 17: Dirección Principal */}
              <div className="flex flex-col space-y-1 lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Dirección Principal *</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="ingrese dirección"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 18: Estado civil */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Estado civil *</label>
                <select
                  value={estadoCivil}
                  onChange={(e) => setEstadoCivil(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                >
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Unión Libre">Unión Libre</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                </select>
              </div>

              {/* Field 19: Número de hijos */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Número de hijos *</label>
                <input
                  type="number"
                  min="0"
                  value={numeroHijos}
                  onChange={(e) => setNumeroHijos(e.target.value)}
                  placeholder="ingrese número de hijos"
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                />
              </div>

              {/* Field 20: Paquete Seguro */}
              <div className="flex flex-col space-y-1 lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-500">Paquete Seguro *</label>
                <select
                  value={paqueteSeguro}
                  onChange={(e) => setPaqueteSeguro(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8CC63F] focus:bg-white transition-all h-9"
                  required
                >
                  <option value="Plan Básico - $ 50.000,00">Plan Básico - $ 50.000,00</option>
                  <option value="Plan Estándar - $ 150.000,00">Plan Estándar - $ 150.000,00</option>
                  <option value="Plan Plus - $ 250.000,00">Plan Plus - $ 250.000,00</option>
                  <option value="Plan Élite - $ 500.000,00">Plan Élite - $ 500.000,00</option>
                </select>
              </div>

            </div>

            {/* BUTTON BAR (Aligned, styled exactly like TRY Controller) */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border-2 border-gray-300 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={(e) => handleSave(e, false)}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8CC63F] hover:bg-[#7cb335] text-gray-900 font-bold text-xs uppercase transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {saving ? 'Registrando...' : 'Guardar'}
              </button>

              <button
                type="button"
                onClick={(e) => handleSave(e, true)}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8CC63F] hover:bg-[#7cb335] text-gray-900 font-bold text-xs uppercase transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {saving ? 'Registrando...' : 'Aprobación Seguros'}
              </button>
            </div>

          </form>
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-sm font-black uppercase text-gray-700 tracking-wider">
                Historial de Solicitudes y Asegurados
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Listado en tiempo real de los asegurados registrados y sus estados correspondientes.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, documento o paquete..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#8CC63F]"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  <th className="p-3">Asegurado</th>
                  <th className="p-3">Unidad / Ciudad</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Celular</th>
                  <th className="p-3">Paquete</th>
                  <th className="p-3">Estado Civil / Hijos</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredInsured.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 font-medium italic">
                      No se encontraron solicitudes registradas en este período.
                    </td>
                  </tr>
                ) : (
                  filteredInsured.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                      <td className="p-3 font-bold text-gray-900">
                        {item.primerNombre} {item.primerApellido}
                        <span className="block text-[10px] text-gray-400 font-normal italic">
                          {item.correo || 'Sin correo electrónico'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 font-semibold">{item.unidad}</td>
                      <td className="p-3 font-mono text-gray-500 text-[11px]">{item.documento}</td>
                      <td className="p-3 font-medium text-gray-600">{item.celular}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-100">
                          {item.paqueteSeguro.split(' - ')[0]}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-bold mt-0.5">
                          {item.paqueteSeguro.split(' - ')[1]}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">
                        {item.estadoCivil} / {item.numeroHijos} {parseInt(item.numeroHijos) === 1 ? 'hijo' : 'hijos'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${insuranceStatusBadgeClasses(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">
                        {item.registeredBy}
                        <span className="block text-[9px] font-mono text-gray-400">
                          {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Cargando...'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === 'gestion' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-sm font-black uppercase text-gray-700 tracking-wider">
              Módulos de Configuración de Coberturas
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Administración de planes de seguros activos, tarifas mensuales y convenios con aseguradoras corporativas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Col 1: Aseguradoras */}
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 space-y-4">
              <div className="flex items-center space-x-2 text-[#6A008A]">
                <Briefcase className="w-5 h-5" />
                <h3 className="font-bold text-xs uppercase">Aseguradoras Aliadas</h3>
              </div>
              <p className="text-xs text-gray-500">
                Convenios y pasarelas de conexión directa de siniestros.
              </p>
              <div className="space-y-2">
                <div className="p-2.5 bg-white rounded border border-gray-100 flex items-center justify-between text-xs font-semibold">
                  <span>Seguros Bolívar</span>
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-black uppercase">Activo</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-gray-100 flex items-center justify-between text-xs font-semibold">
                  <span>Mapfre Compañía</span>
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-black uppercase">Activo</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-gray-100 flex items-center justify-between text-xs font-semibold">
                  <span>Sura Latinoamericana</span>
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-black uppercase">Activo</span>
                </div>
              </div>
            </div>

            {/* Col 2: Planes */}
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 space-y-4">
              <div className="flex items-center space-x-2 text-[#6A008A]">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-bold text-xs uppercase">Configuración de Planes</h3>
              </div>
              <p className="text-xs text-gray-500">
                Defina los topes máximos de cobertura en Microcréditos.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold">Plan Básico:</span>
                  <span className="text-gray-600 font-mono">Cobertura $ 50.000,00</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold">Plan Estándar:</span>
                  <span className="text-gray-600 font-mono">Cobertura $ 150.000,00</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold">Plan Plus:</span>
                  <span className="text-gray-600 font-mono">Cobertura $ 250.000,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Plan Élite:</span>
                  <span className="text-gray-600 font-mono">Cobertura $ 500.000,00</span>
                </div>
              </div>
            </div>

            {/* Col 3: Métricas */}
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 space-y-4">
              <div className="flex items-center space-x-2 text-[#6A008A]">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-bold text-xs uppercase">Métricas de Siniestros</h3>
              </div>
              <p className="text-xs text-gray-500">
                Auditoría y control de aprobación de cobertura de seguro.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-gray-100">
                  <div className="text-[9px] text-gray-400 font-bold uppercase">Aprobación</div>
                  <div className="text-lg font-black text-green-600 mt-0.5">100%</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-100">
                  <div className="text-[9px] text-gray-400 font-bold uppercase">Siniestros</div>
                  <div className="text-lg font-black text-gray-800 mt-0.5">0</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import { logFirestoreError } from '../utils/firestoreError';
import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db } from '../lib/firebase';
import { collection, query, where, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { listViewBody } from '../utils/listViewBody';
import { Users, UserPlus, Search, Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface AppUser {
  id?: string;
  tenantId: string;
  username: string;
  email: string;
  documentNumber: string;
  role: string;
  firstName: string;
  middleName: string;
  lastName1: string;
  lastName2: string;
  active: boolean;
  googleKey?: string;
  createdAt: string;
}

export function UserList() {
  const { tenantId } = useTenant();

  // Mode: 'list' or 'create'
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [createStep, setCreateStep] = useState<1 | 2>(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Users State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Form states - Step 1: Información de usuario
  const [formUsername, setFormUsername] = useState('');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Cajero');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName1, setFormLastName1] = useState('');
  const [formLastName2, setFormLastName2] = useState('');

  // Form states - Step 2: Configuración
  const [formGoogleKey, setFormGoogleKey] = useState('');
  const [formActive, setFormActive] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live Subscription to Users collection
  useEffect(() => {
    if (!tenantId) return;

    setLoadingUsers(true);
    setListError(null);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('tenantId', '==', tenantId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppUser[];

      setUsers(list);
      setListError(null);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Error listening to users list:", error);
      setListError('Erro ao carregar a lista de usuários do Firestore.');
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Handle Switch Active/Inactive in Firestore
  const toggleUserStatus = async (user: AppUser) => {
    if (!user.id) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        active: !user.active
      });
    } catch (err) {
      logFirestoreError(err, 'update', `users/${user.id}`, { throwError: true, extraAuth: { userId: 'system_user' } });
    }
  };

  // Step 1 Validation & Proceed
  const handleProceedToStep2 = (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!formUsername || !formDocNumber || !formEmail || !formFirstName || !formLastName1) {
      setNotification({ type: 'error', message: 'Por favor complete todos los campos obligatorios (*) de información de usuario.' });
      return;
    }
    setNotification(null);
    setCreateStep(2);
  };

  // Submit and Create User in Firestore
  const handleCreateUser = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!formGoogleKey) {
      setNotification({ type: 'error', message: 'Por favor ingrese la Chave Google (Google Key) del usuario.' });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    const newUser: AppUser = {
      tenantId,
      username: formUsername,
      email: formEmail,
      documentNumber: formDocNumber,
      role: formRole,
      firstName: formFirstName,
      middleName: formMiddleName || '',
      lastName1: formLastName1,
      lastName2: formLastName2 || '',
      active: formActive,
      googleKey: formGoogleKey,
      createdAt: new Date().toISOString()
    };

    try {
      // Create user document in the database
      await addDoc(collection(db, 'users'), newUser);
      
      setNotification({ type: 'success', message: '¡Usuario registrado exitosamente!' });

      // Reset form variables
      setFormUsername('');
      setFormDocNumber('');
      setFormEmail('');
      setFormRole('Cajero');
      setFormFirstName('');
      setFormMiddleName('');
      setFormLastName1('');
      setFormLastName2('');
      setFormGoogleKey('');
      setFormActive(true);

      // Finish and return to list
      setTimeout(() => {
        setViewMode('list');
        setCreateStep(1);
        setNotification(null);
      }, 1500);
    } catch (err) {
      console.error("Error creating user document:", err);
      setNotification({ type: 'error', message: 'Error al registrar el usuario en el sistema.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filters Logic
  const filteredUsers = users.filter(u => {
    // 1. Status Checkboxes filter
    if (u.active && !showActive) return false;
    if (!u.active && !showInactive) return false;

    // 2. Search Field (username, email, firstName, lastName1)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchUsername = u.username?.toLowerCase().includes(q);
      const matchFirst = u.firstName?.toLowerCase().includes(q);
      const matchLast = u.lastName1?.toLowerCase().includes(q);
      return matchEmail || matchUsername || matchFirst || matchLast;
    }

    return true;
  });

  return (
    <div className="flex flex-col space-y-4 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4 text-[#333333]">
      
      {/* Notifications banner */}
      {notification && (
        <div className={`p-3 rounded-lg flex items-start gap-2.5 text-xs font-semibold border ${
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

      {/* VIEW 1: USERS LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-5">
          
          {/* Title Header with user button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Users className="w-5.5 h-5.5 text-[#6B21A8]" />
              <span>Usuarios</span>
            </h1>
            
            <button
              onClick={() => setViewMode('create')}
              className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-extrabold text-xs tracking-wide uppercase px-4 py-2.5 rounded shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4.5 h-4.5" />
              <span>Crear usuario</span>
            </button>
          </div>

          {/* Filters Block (Matching image search/mostrar filters) */}
          <div className="bg-gray-50/50 p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row md:items-center gap-4 justify-between">
            
            {/* Search Box */}
            <div className="flex items-stretch gap-2 w-full max-w-md">
              <div className="flex-1 relative flex items-center border border-gray-300 rounded bg-white px-3 py-1.5 focus-within:border-[#6B21A8]">
                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Ejem: Nombre, correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none border-none text-[#333333]"
                />
              </div>
              <button className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold px-5 py-2 rounded text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer">
                Buscar
              </button>
            </div>

            {/* Checkboxes filters (Mostrar Activos / Inactivos) */}
            <div className="flex items-center gap-4 text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded">
              <span>Mostrar:</span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showActive}
                  onChange={(e) => setShowActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#8CC63F] focus:ring-[#8CC63F]"
                />
                <span>Activos</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#8CC63F] focus:ring-[#8CC63F]"
                />
                <span>Inactivos</span>
              </label>
            </div>

          </div>

          {/* Cards list matching the image style exactly */}
          {listError && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{listError}</span>
            </div>
          )}

          {listViewBody(
            loadingUsers,
            filteredUsers.length,
            (
            <div className="py-12 text-center text-xs font-bold text-gray-500">
              Cargando usuarios desde base de datos...
            </div>
          ),
            (
            <div className="py-12 text-center text-xs font-bold text-gray-400">
              No hay usuarios que coincidan con la búsqueda.
            </div>
          ),
            (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between space-y-3"
                >
                  {/* Top status indicator tag */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Info details */}
                  <div className="space-y-1 pr-16">
                    {/* Bold Email */}
                    <h4 className="text-xs font-extrabold text-gray-900 truncate font-mono" title={user.email}>
                      {user.email}
                    </h4>
                    {/* Full Name */}
                    <p className="text-xs text-gray-500 font-semibold capitalize">
                      {user.firstName} {user.middleName} {user.lastName1} {user.lastName2}
                    </p>
                    {/* Role / Profile */}
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide bg-purple-50 px-2 py-0.5 rounded-sm inline-block mt-1">
                      {user.role}
                    </span>
                  </div>

                  {/* Inline toggle switch state */}
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500 font-bold">
                    <div className="flex flex-col">
                      <span>Doc: {user.documentNumber}</span>
                      {user.googleKey && (
                        <span className="text-[10px] text-purple-600 font-mono font-medium mt-0.5 truncate max-w-[150px]" title={`Chave Google: ${user.googleKey}`}>
                          G-Key: {user.googleKey}
                        </span>
                      )}
                    </div>

                    {/* Switch status toggle */}
                    <div className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        name={`active-${user.id}`}
                        id={`active-${user.id}`}
                        checked={user.active}
                        onChange={() => toggleUserStatus(user)}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`active-${user.id}`}
                        className={`block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ${
                          user.active ? 'bg-[#8CC63F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block h-3.5 w-3.5 rounded-full bg-white shadow transform duration-200 ease-in-out mt-0.5 ${
                            user.active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </label>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ))}

        </div>
      )}

      {/* VIEW 2: MULTI-STEP CREATION WIZARD */}
      {viewMode === 'create' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          
          {/* Purple creation header */}
          <div className="bg-[#6B21A8] text-white p-4 flex items-center gap-3">
            <button 
              onClick={() => { setViewMode('list'); setCreateStep(1); }} 
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-xs uppercase tracking-wider">Creación de usuario</h3>
          </div>

          {/* Stepper indicators header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
              createStep === 1 
                ? 'border-b-[#6B21A8] text-[#6B21A8]' 
                : 'border-b-transparent text-gray-400'
            }`}>
              1. Información de usuario
            </div>
            <div className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
              createStep === 2 
                ? 'border-b-[#6B21A8] text-[#6B21A8]' 
                : 'border-b-transparent text-gray-400'
            }`}>
              2. Configuración
            </div>
          </div>

          {/* Step 1 Form */}
          {createStep === 1 && (
            <form onSubmit={handleProceedToStep2} className="p-4 space-y-4 max-w-4xl mx-auto">
              
              <div className="bg-[#F9FAFB] p-3 rounded border border-gray-200 text-[11px] text-gray-500 font-semibold mb-2">
                Ingresa la información del usuario en cada campo.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Username */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Escriba el nombre de usuario"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

                {/* Document Number */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Número de documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Número de documento de identidad"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="correo@empresa.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

                {/* Profile dropdown */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Perfil de usuario *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs font-semibold outline-none bg-white focus:border-[#6B21A8]"
                  >
                    <option value="Super Administrador">Super Administrador</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Revisador">Revisador</option>
                    <option value="Cajero">Cajero / Operador de Caja</option>
                    <option value="Supervisor">Supervisor de Ruta</option>
                    <option value="Secretaria">Secretaria</option>
                  </select>
                </div>

                {/* Primer Nombre */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Primer nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Primer nombre"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

                {/* Segundo Nombre */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Segundo nombre</label>
                  <input
                    type="text"
                    placeholder="Segundo nombre (opcional)"
                    value={formMiddleName}
                    onChange={(e) => setFormMiddleName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

                {/* Primer Apellido */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Primer apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Primer apellido"
                    value={formLastName1}
                    onChange={(e) => setFormLastName1(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

                {/* Segundo Apellido */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Segundo apellido</label>
                  <input
                    type="text"
                    placeholder="Segundo apellido (opcional)"
                    value={formLastName2}
                    onChange={(e) => setFormLastName2(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8]"
                  />
                </div>

              </div>

              {/* Action bar Step 1 */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="bg-[#6B21A8] hover:bg-[#52006A] text-white font-extrabold text-xs px-6 py-2.5 rounded shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Guardar y continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}

          {/* Step 2 Form */}
          {createStep === 2 && (
            <form onSubmit={handleCreateUser} className="p-4 space-y-4 max-w-4xl mx-auto">
              
              <div className="bg-[#F9FAFB] p-3 rounded border border-gray-200 text-[11px] text-gray-500 font-semibold mb-2">
                Configure la seguridad y los permisos de acceso para el nuevo usuario.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Google Access Key */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#6B21A8] mb-1">Chave Google / Google Key *</label>
                  <input
                    type="text"
                    required
                    placeholder="Insira a chave do Google que será usada no cadastro"
                    value={formGoogleKey}
                    onChange={(e) => setFormGoogleKey(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-[#6B21A8] font-semibold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1">
                    Este colaborador ingresará utilizando esta clave de Google (cuenta vinculada) en lugar de contraseña.
                  </span>
                </div>

                {/* Status selector switch */}
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-gray-500 mb-2">Estado del usuario</span>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 p-2 rounded">
                    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        name="formActive"
                        id="formActive"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="sr-only"
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
                    <span className="text-xs font-bold text-gray-600">Usuario habilitado</span>
                  </div>
                </div>

              </div>

              {/* Action bar Step 2 */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateStep(1)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#6B21A8] hover:bg-[#52006A] text-white font-extrabold text-xs px-6 py-2.5 rounded shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{submitting ? 'Guardando...' : 'Guardar y finalizar'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      )}

    </div>
  );
}

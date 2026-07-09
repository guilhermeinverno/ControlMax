import {
  Camera,
  FileText,
  Image,
  MapPin,
  Phone,
  Trash2,
  User,
} from 'lucide-react';
import { gpsLocationButtonLabel } from '../../../utils/statusLabels';
import type { BusinessCenterUnit } from '../../../types/company';
import type { useCustomerCreateForm } from '../../../hooks/useCustomerCreateForm';
import { useCustomerFormFieldSetters } from './useCustomerFormFieldSetters';

interface CompanyListCreateFormProps {
  createForm: ReturnType<typeof useCustomerCreateForm>;
  activeUnitsList: BusinessCenterUnit[];
  onCancel: () => void;
}

export function CompanyListCreateForm({ createForm, activeUnitsList, onCancel }: CompanyListCreateFormProps) {
  const fields = useCustomerFormFieldSetters(createForm);

  return (
          <form onSubmit={fields.handleSubmit} className="space-y-4 max-w-4xl mx-auto bg-white rounded-3xl p-6 border border-gray-100">
            <h3 className="text-sm font-black text-[#6B21A8] uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8CC63F]" />
              Ficha de Registro Operativo (Nuevo Cliente)
            </h3>

            {/* Core Tab Buttons (Row of 4 icons for Creation Subtabs) */}
            <div className="flex justify-around items-center px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => fields.setCreateActiveSubTab('basic')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  fields.createActiveSubTab === 'basic' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Datos Básicos"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Datos Básicos</span>
              </button>
              
              <button
                type="button"
                onClick={() => fields.setCreateActiveSubTab('locations')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  fields.createActiveSubTab === 'locations' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Ubicaciones y Teléfonos"
              >
                <MapPin className="w-5 h-5" />
                <span className="hidden sm:inline">Adicionales</span>
              </button>
              
              <button
                type="button"
                onClick={() => fields.setCreateActiveSubTab('references')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  fields.createActiveSubTab === 'references' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
                }`}
                title="Referencias"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Referencias</span>
              </button>
              
              <button
                type="button"
                onClick={() => fields.setCreateActiveSubTab('photos')}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  fields.createActiveSubTab === 'photos' ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
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
              {fields.createActiveSubTab === 'basic' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Business Center Unit & City Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Unidad *</label>
                      <select
                        required
                        value={fields.formUnitId}
                        onChange={(e) => fields.setFormUnitId(e.target.value)}
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
                        value={fields.formCity}
                        onChange={(e) => fields.setFormCity(e.target.value)}
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
                        value={fields.formName}
                        onChange={(e) => fields.setFormName(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo nombre</label>
                      <input
                        type="text"
                        placeholder="Ingresar segundo nombre"
                        value={fields.formSecondName}
                        onChange={(e) => fields.setFormSecondName(e.target.value)}
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
                        value={fields.formApellidos}
                        onChange={(e) => fields.setFormApellidos(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo apellido</label>
                      <input
                        type="text"
                        placeholder="Segundo apellido"
                        value={fields.formSecondApellidos}
                        onChange={(e) => fields.setFormSecondApellidos(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Apodo / Alias *</label>
                    <input
                      type="text"
                      placeholder="Ej. Doña Clara / Cocos"
                      value={fields.formApodo}
                      onChange={(e) => fields.setFormApodo(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">E-Mail</label>
                    <input
                      type="email"
                      placeholder="cliente@correo.com"
                      value={fields.formEmail}
                      onChange={(e) => fields.setFormEmail(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col space-y-1 col-span-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Tipo Doc *</label>
                      <select
                        value={fields.formDocType}
                        onChange={(e) => fields.setFormDocType(e.target.value)}
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
                        value={fields.formDocNumber}
                        onChange={(e) => fields.setFormDocNumber(e.target.value)}
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
                        value={fields.formDoc2}
                        onChange={(e) => fields.setFormDoc2(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={fields.formBirthDate}
                        onChange={(e) => fields.setFormBirthDate(e.target.value)}
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
                      value={fields.formAddress}
                      onChange={(e) => fields.setFormAddress(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F] w-full"
                    />
                    
                    {/* Botão de adicionar localização atual embaixo do campo de endereço */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={fields.handleGetCurrentLocation}
                        disabled={fields.gettingLocation}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                          fields.formLatitude && fields.formLongitude
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-[#8CC63F] text-white border-transparent hover:bg-[#7BB52F] active:scale-[0.98]'
                        }`}
                        title="Obter localização atual"
                      >
                        <MapPin className={`w-4 h-4 ${fields.gettingLocation ? 'animate-bounce text-white' : 'text-current'}`} />
                        {fields.gettingLocation ? 'Obtendo Localização Atual...' : fields.formLatitude && fields.formLongitude ? 'Atualizar Localização GPS' : 'Adicionar Localização Atual'}
                      </button>

                      {fields.formLatitude && fields.formLongitude && (
                        <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-[10px] text-green-800 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="font-extrabold uppercase text-[9px]">Coordenadas:</span>
                            <span>{fields.formLatitude.toFixed(6)}, {fields.formLongitude.toFixed(6)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              fields.setFormLatitude(null);
                              fields.setFormLongitude(null);
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
                        value={fields.formBarrio}
                        onChange={(e) => fields.setFormBarrio(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ingresar teléfono alternativo"
                        value={fields.formPhone}
                        onChange={(e) => fields.setFormPhone(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono Celular *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fields.formCelularPrefix}
                        onChange={(e) => fields.setFormCelularPrefix(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] w-14 text-center focus:border-[#8CC63F]"
                        placeholder="55"
                      />
                      <input
                        type="text"
                        required
                        value={fields.formCelular}
                        onChange={(e) => fields.setFormCelular(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] flex-1 focus:border-[#8CC63F]"
                        placeholder="Celular sin código de país"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-gray-500">Actividad Económica *</label>
                    <select
                      value={fields.formActividad}
                      onChange={(e) => fields.setFormActividad(e.target.value)}
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
                      value={fields.formComentario}
                      onChange={(e) => fields.setFormComentario(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] h-18 focus:border-[#8CC63F]"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-700">Estado Inicial del Cliente: Activo</span>
                    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        checked={fields.formActive}
                        onChange={(e) => fields.setFormActive(e.target.checked)}
                        className="sr-only"
                        id="fields.formActive"
                      />
                      <label
                        htmlFor="fields.formActive"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                          fields.formActive ? 'bg-[#8CC63F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-white shadow transform duration-200 ease-in-out mt-1 ${
                            fields.formActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: LOCATIONS & PHONES (ADICIONALES) */}
              {fields.createActiveSubTab === 'locations' && (
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
                            value={fields.createInputAddress}
                            onChange={(e) => fields.setCreateInputAddress(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400">Barrio</label>
                            <input
                              type="text"
                              placeholder="Ej: Centro"
                              value={fields.createInputBarrio}
                              onChange={(e) => fields.setCreateInputBarrio(e.target.value)}
                              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                            <input
                              type="text"
                              placeholder="Ej: Brasilia"
                              value={fields.createInputCity}
                              onChange={(e) => fields.setCreateInputCity(e.target.value)}
                              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (!fields.createInputAddress.trim()) return;
                          const newAddr = {
                            id: Date.now().toString(),
                            address: fields.createInputAddress.trim(),
                            barrio: fields.createInputBarrio.trim(),
                            city: fields.createInputCity.trim()
                          };
                          fields.setFormAddresses([...fields.formAddresses, newAddr]);
                          fields.setCreateInputAddress('');
                          fields.setCreateInputBarrio('');
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
                            value={fields.createInputPhone}
                            onChange={(e) => fields.setCreateInputPhone(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (!fields.createInputPhone.trim()) return;
                          const newPhone = {
                            id: Date.now().toString(),
                            number: fields.createInputPhone.trim()
                          };
                          fields.setFormPhones([...fields.formPhones, newPhone]);
                          fields.setCreateInputPhone('');
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
                    {fields.formAddresses.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">Ninguna dirección adicional agregada aún.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {fields.formAddresses.map((addr) => (
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
                                onClick={() => fields.setFormAddresses(fields.formAddresses.filter(a => a.id !== addr.id))}
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
                    {fields.formPhones.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">Ningún teléfono adicional agregado aún.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {fields.formPhones.map((ph) => (
                          <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                            <div className="p-3 flex justify-between items-start">
                              <div className="space-y-1 text-xs text-gray-700">
                                <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Número:</span> {ph.number}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => fields.setFormPhones(fields.formPhones.filter(p => p.id !== ph.id))}
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
              {fields.createActiveSubTab === 'references' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                    <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Añadir Referencia Familiar o Comercial</h3>
                    
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Nombre Completo *</label>
                      <input
                        type="text"
                        placeholder="Nombre de la referencia"
                        value={fields.createRefName}
                        onChange={(e) => fields.setCreateRefName(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">País</label>
                        <select
                          value={fields.createRefCountry}
                          onChange={(e) => fields.setCreateRefCountry(e.target.value)}
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
                          value={fields.createRefState}
                          onChange={(e) => fields.setCreateRefState(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                        <input
                          type="text"
                          placeholder="Ciudad"
                          value={fields.createRefCity}
                          onChange={(e) => fields.setCreateRefCity(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Dirección Completa *</label>
                      <input
                        type="text"
                        placeholder="Calle, número, depto"
                        value={fields.createRefAddress}
                        onChange={(e) => fields.setCreateRefAddress(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Teléfono Fijo</label>
                        <input
                          type="tel"
                          placeholder="Fijo u alternativo"
                          value={fields.createRefPhone}
                          onChange={(e) => fields.setCreateRefPhone(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Celular *</label>
                        <input
                          type="tel"
                          placeholder="Celular con código"
                          value={fields.createRefCelular}
                          onChange={(e) => fields.setCreateRefCelular(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-black text-gray-400">Comentarios / Relación *</label>
                      <input
                        type="text"
                        placeholder="Ej: Madre, Hermano, Socio comercial..."
                        value={fields.createRefComment}
                        onChange={(e) => fields.setCreateRefComment(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!fields.createRefName.trim() || !fields.createRefCelular.trim()) return;
                        const newRef = {
                          id: Date.now().toString(),
                          name: fields.createRefName.trim(),
                          country: fields.createRefCountry,
                          state: fields.createRefState.trim(),
                          city: fields.createRefCity.trim(),
                          address: fields.createRefAddress.trim(),
                          phone: fields.createRefPhone.trim(),
                          celular: fields.createRefCelular.trim(),
                          comment: fields.createRefComment.trim()
                        };
                        fields.setFormReferencesList([...fields.formReferencesList, newRef]);
                        fields.setCreateRefName('');
                        fields.setCreateRefState('');
                        fields.setCreateRefCity('');
                        fields.setCreateRefAddress('');
                        fields.setCreateRefPhone('');
                        fields.setCreateRefCelular('');
                        fields.setCreateRefComment('');
                      }}
                      className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Añadir Referencia
                    </button>
                  </div>

                  {/* References list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Referencias Agregadas</h4>
                    {fields.formReferencesList.length === 0 ? (
                      <div className="text-xs text-gray-400 italic text-center py-4">Ninguna referencia agregada aún.</div>
                    ) : (
                      <div className="space-y-3">
                        {fields.formReferencesList.map((ref) => (
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
                              onClick={() => fields.setFormReferencesList(fields.formReferencesList.filter(r => r.id !== ref.id))}
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
              {fields.createActiveSubTab === 'photos' && (
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
                            fields.setFormPhotos([...fields.formPhotos, base64String]);
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
                    {fields.formPhotos.length === 0 ? (
                      <div className="text-xs text-gray-400 italic text-center py-4">Ninguna foto cargada aún.</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {fields.formPhotos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-xs group">
                            <img src={photo} referrerPolicy="no-referrer" alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => fields.setFormPhotos(fields.formPhotos.filter((_, i) => i !== idx))}
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
                onClick={onCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={fields.submitting}
                className="bg-[#6B21A8] hover:bg-[#52006A] text-white font-bold px-6 py-2.5 rounded text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {fields.submitting ? 'Guardando...' : 'Crear nuevo cliente'}
              </button>
            </div>
          </form>

  );
}

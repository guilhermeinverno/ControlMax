import { MapPin } from 'lucide-react';
import type { BusinessCenterUnit } from '../../../../types/company';
import type { useCustomerFormFieldSetters } from '../useCustomerFormFieldSetters';

interface CompanyListCreateBasicTabProps {
  fields: ReturnType<typeof useCustomerFormFieldSetters>;
  activeUnitsList: BusinessCenterUnit[];
}

export function CompanyListCreateBasicTab({ fields, activeUnitsList }: CompanyListCreateBasicTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
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
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
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
            {fields.gettingLocation
              ? 'Obtendo Localização Atual...'
              : fields.formLatitude && fields.formLongitude
                ? 'Atualizar Localização GPS'
                : 'Adicionar Localização Atual'}
          </button>

          {fields.formLatitude && fields.formLongitude && (
            <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-[10px] text-green-800 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-extrabold uppercase text-[9px]">Coordenadas:</span>
                <span>
                  {fields.formLatitude.toFixed(6)}, {fields.formLongitude.toFixed(6)}
                </span>
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
  );
}

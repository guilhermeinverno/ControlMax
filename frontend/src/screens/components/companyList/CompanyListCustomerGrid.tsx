import { FileText, Search } from 'lucide-react';
import { Customer } from '../../../types/company';
import { listViewBody } from '../../../utils/listViewBody';

interface CompanyListCustomerGridProps {
  loadingCustomers: boolean;
  filteredCustomers: Customer[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onToggleStatus: (customer: Customer) => void;
}

export function CompanyListCustomerGrid({
  loadingCustomers,
  filteredCustomers,
  searchQuery,
  onSearchChange,
  onSelectCustomer,
  onToggleStatus,
}: CompanyListCustomerGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
        <div className="flex-1 relative flex items-center border border-gray-300 rounded-lg bg-[#F9FAFB] px-3 py-1.5 focus-within:border-[#6B21A8]">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Ejem: id Cliente, Nombre, apellido"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none border-none text-[#333333]"
          />
        </div>
        <button className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-colors shrink-0 cursor-pointer">
          Buscar
        </button>
      </div>

      {listViewBody(
        loadingCustomers,
        filteredCustomers.length,
        <div className="py-12 text-center text-xs font-bold text-gray-500">
          Cargando listado de clientes desde base de datos...
        </div>,
        <div className="py-12 text-center text-xs font-bold text-gray-400">
          Ningún cliente coincide con los filtros aplicados.
        </div>,
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div
                onClick={() => onSelectCustomer(customer)}
                className="bg-[#F9FAFB] border-b border-gray-100 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#6B21A8] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                    {customer.unitName || 'Sin Unidad'}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                    customer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {customer.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div
                onClick={() => onSelectCustomer(customer)}
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
                    {customer.apodo && (
                      <span className="text-xs text-gray-500 font-semibold block sm:inline sm:ml-1">
                        ({customer.apodo})
                      </span>
                    )}
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
                    &quot;{customer.comentario}&quot;
                  </div>
                )}
              </div>

              <div className="border-t border-gray-150 p-3 bg-[#F9FAFB]/50 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Estado</span>

                <div className="flex items-center gap-3">
                  <div className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name={`active-${customer.id}`}
                      id={`active-${customer.id}`}
                      checked={customer.active}
                      onChange={() => onToggleStatus(customer)}
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
                    onClick={() => onSelectCustomer(customer)}
                    className="bg-[#6B21A8] hover:bg-[#52006A] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Perfil/Editar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>,
      )}
    </div>
  );
}

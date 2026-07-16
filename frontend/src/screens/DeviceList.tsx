import { useState } from 'react';
import {
  Smartphone,
  Plus,
  Search,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  Key,
  Shield,
  Info,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { useTenant } from '../hooks/useTenant';
import { useNavigation } from '../context/NavigationContext';
import { useDeviceListData } from '../hooks/useDeviceListData';
import { filterDevices } from '../utils/deviceListFilters';
import { hasAdminAccess } from '../types/operational';
import { listViewBody } from '../utils/listViewBody';
import { UnitSelectors } from './components/UnitSelectors';
import { ConfirmModal } from './components/ConfirmModal';
import { DeviceTable } from './components/devices/DeviceTable';
import { DeviceBindModal } from './components/devices/DeviceBindModal';

export function DeviceList() {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { navigate } = useNavigation();

  const isAdmin = hasAdminAccess(role, isSuperAdmin);
  const isCollector = role === 'collector';

  // State for simulated loading animations of collector configuration screen
  const [loadingStates, setLoadingStates] = useState<Record<string, 'idle' | 'loading' | 'success'>>({});

  const handleSimulateAction = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: 'loading' }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [key]: 'success' }));
      // revert back to idle after some time so they can run it again
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [key]: 'idle' }));
      }, 3000);
    }, 1500);
  };

  const data = useDeviceListData(tenantId, isAdmin);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = filterDevices(data.devices, searchQuery, isCollector);

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#84CC16]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  // COLLECTOR VIEW: Matches the "Configuração" screenshot (First reference image)
  if (isCollector) {
    return (
      <div className="flex flex-col bg-[#F5F5F7] min-h-screen text-[#333333] -m-4 pb-16">
        {/* Purple header with Back Arrow and Unit Code Subtitle */}
        <div className="bg-[#6A008A] text-white pt-4 pb-5 px-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('dashboard')}
              className="text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-wide">Configuração</h1>
              <span className="text-xs text-purple-200 block font-semibold mt-0.5">
                65 / 3 / 1007967
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto w-full space-y-6">
          {/* Section: Baixar */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-slate-800 tracking-tight px-1">Baixar</h2>

            {/* Item 1: Baixe todas as informações da Unidade */}
            <button
              onClick={() => handleSimulateAction('all_info')}
              disabled={loadingStates['all_info'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['all_info'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['all_info'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <Download className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Baixe todas as informações da Unidade
                </span>
              </div>
              {loadingStates['all_info'] === 'success' && (
                <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded">Salvo</span>
              )}
            </button>

            {/* Item 2: Baixar configuração */}
            <button
              onClick={() => handleSimulateAction('config')}
              disabled={loadingStates['config'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['config'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['config'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <Download className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Baixar configuração
                </span>
              </div>
              {loadingStates['config'] === 'success' && (
                <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded">Salvo</span>
              )}
            </button>

            {/* Item 3: Baixar clientes da UGI */}
            <button
              onClick={() => handleSimulateAction('clients')}
              disabled={loadingStates['clients'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['clients'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['clients'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <Download className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Baixar clientes da UGI
                </span>
              </div>
              {loadingStates['clients'] === 'success' && (
                <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded">Salvo</span>
              )}
            </button>
          </div>

          {/* Section: Outras opções */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-black text-slate-800 tracking-tight px-1">Outras opções</h2>

            {/* Item 4: Sincronizar aplicativo */}
            <button
              onClick={() => handleSimulateAction('sync_app')}
              disabled={loadingStates['sync_app'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['sync_app'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['sync_app'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Sincronizar aplicativo
                </span>
              </div>
              {loadingStates['sync_app'] === 'success' && (
                <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded">Ativo</span>
              )}
            </button>

            {/* Item 5: Gerar novas chaves */}
            <button
              onClick={() => handleSimulateAction('keys')}
              disabled={loadingStates['keys'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['keys'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['keys'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <Key className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Gerar novas chaves
                </span>
              </div>
              {loadingStates['keys'] === 'success' && (
                <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded">Pronto</span>
              )}
            </button>

            {/* Item 6: Gerar copia de segurança */}
            <button
              onClick={() => handleSimulateAction('backup')}
              disabled={loadingStates['backup'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['backup'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['backup'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Gerar copia de segurança
                </span>
              </div>
              {loadingStates['backup'] === 'success' && (
                <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded">OK</span>
              )}
            </button>

            {/* Item 7: Reiniciar dados */}
            <button
              onClick={() => handleSimulateAction('reset')}
              disabled={loadingStates['reset'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['reset'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['reset'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Reiniciar dados
                </span>
              </div>
              {loadingStates['reset'] === 'success' && (
                <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded">Limpo</span>
              )}
            </button>

            {/* Item 8: Acerca de */}
            <button
              onClick={() => handleSimulateAction('about')}
              disabled={loadingStates['about'] === 'loading'}
              className="w-full bg-white rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border border-slate-100 flex items-center justify-between text-left cursor-pointer group active:scale-99"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0 group-hover:scale-105 transition-transform">
                  {loadingStates['about'] === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : loadingStates['about'] === 'success' ? (
                    <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                  ) : (
                    <Info className="w-5 h-5 text-[#6A008A]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800 leading-snug">
                  Acerca de
                </span>
              </div>
              {loadingStates['about'] === 'success' && (
                <span className="text-[10px] bg-purple-100 text-[#6A008A] font-extrabold px-2 py-0.5 rounded">ControlMax v1.2</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen">
      <UnitSelectors />

      <div className="px-3 mt-2 mb-4">
        <div className="bg-[#84CC16] text-white py-2.5 px-3 font-bold uppercase text-sm shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <Smartphone className="w-4 h-4 mr-2" />
            Lista de Dispositivos
          </div>
          {isAdmin && (
            <button
              onClick={() => data.setIsBindModalOpen(true)}
              className="bg-[#6B21A8] hover:bg-[#581c87] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Vincular Dispositivo
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-200 border-t-0 p-3 shadow-sm rounded-b-sm">
          {data.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{data.error}</span>
            </div>
          )}

          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Buscar por nome, modelo, IMEI ou cobrador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 pl-9 text-sm text-[#333333] outline-none focus:border-[#6B21A8] transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>

          {listViewBody(
            data.loading,
            filteredDevices.length,
            (
              <div className="border border-gray-200 rounded-sm overflow-hidden text-sm">
                <div className="bg-[#8CC63F] text-white flex px-3 py-2.5 font-bold uppercase text-[10px] tracking-wider">
                  <div className="flex-[2]">Dispositivo</div>
                  <div className="flex-[2]">Cobrador</div>
                  <div className="w-24 text-center">Status</div>
                  <div className="w-20 text-center">Versão</div>
                  <div className="flex-[1.5]">Última Sinc.</div>
                  <div className="w-24 text-center">Ações</div>
                </div>
                {SKELETON_CARD_KEYS.slice(0, 3).map((key) => (
                  <div
                    key={key}
                    className="flex border-b border-gray-100 items-center px-3 py-3 animate-pulse bg-white"
                  >
                    <div className="flex-[2] h-4 bg-gray-100 rounded w-4/5 mr-2" />
                    <div className="flex-[2] h-4 bg-gray-50 rounded w-3/4 mr-2" />
                    <div className="w-24 flex justify-center">
                      <div className="h-4 bg-gray-100 rounded w-16" />
                    </div>
                    <div className="w-20 flex justify-center">
                      <div className="h-4 bg-gray-50 rounded w-12" />
                    </div>
                    <div className="flex-[1.5] h-4 bg-gray-50 rounded w-2/3 mr-2" />
                    <div className="w-24 flex justify-center">
                      <div className="h-5 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ),
            (
              <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
                <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">Nenhum dispositivo vinculado ainda</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Adicione um novo dispositivo para os cobradores sincronizarem.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => data.setIsBindModalOpen(true)}
                    className="bg-[#6B21A8] hover:bg-[#581c87] text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 inline" />
                    Vincular Primeiro Aparelho
                  </button>
                )}
              </div>
            ),
            (
              <DeviceTable
                devices={filteredDevices}
                isAdmin={isAdmin}
                onEdit={(deviceId) => navigate('edit-device', { deviceId })}
                onToggleBlock={data.setDeviceToToggleBlock}
              />
            )
          )}
        </div>
      </div>

      <DeviceBindModal
        isOpen={data.isBindModalOpen}
        submitting={data.submitting}
        deviceName={data.deviceName}
        deviceModel={data.deviceModel}
        deviceIdInput={data.deviceIdInput}
        assignedUserId={data.assignedUserId}
        collectors={data.collectors}
        onClose={() => data.setIsBindModalOpen(false)}
        onSubmit={data.handleBindDeviceSubmit}
        onDeviceNameChange={data.setDeviceName}
        onDeviceModelChange={data.setDeviceModel}
        onDeviceIdInputChange={data.setDeviceIdInput}
        onAssignedUserIdChange={data.setAssignedUserId}
      />

      <ConfirmModal
        isOpen={!!data.deviceToToggleBlock}
        onClose={() => data.setDeviceToToggleBlock(null)}
        onConfirm={data.handleConfirmToggleBlock}
        title={
          data.deviceToToggleBlock?.status === 'blocked' ? 'Desbloquear Aparelho?' : 'Bloquear Aparelho?'
        }
        subtitle={
          data.deviceToToggleBlock?.status === 'blocked'
            ? `Deseja realmente desbloquear o aparelho "${data.deviceToToggleBlock?.deviceName}"? Ele voltará a ter acesso ao sistema.`
            : `Deseja realmente bloquear o aparelho "${data.deviceToToggleBlock?.deviceName}"? O cobrador perderá o acesso instantaneamente.`
        }
        confirmText={data.deviceToToggleBlock?.status === 'blocked' ? 'Sim, desbloquear' : 'Sim, bloquear'}
        cancelText="Cancelar"
      />
    </div>
  );
}

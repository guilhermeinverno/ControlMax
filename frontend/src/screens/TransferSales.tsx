import { Loader2 } from 'lucide-react';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { BCTransfers } from './BCTransfers';
import { useTransferSalesData } from '../hooks/useTransferSalesData';
import { fmtTransferSales } from '../utils/transferSalesFormat';
import { ConfirmModal } from './components/ConfirmModal';
import { TransferSalesHeader } from './components/transferSales/TransferSalesHeader';
import { TransferSalesAlerts } from './components/transferSales/TransferSalesAlerts';
import { TransferSalesTransferTab } from './components/transferSales/TransferSalesTransferTab';
import { TransferSalesAcceptTab } from './components/transferSales/TransferSalesAcceptTab';
import { TransferSalesHistoryTab } from './components/transferSales/TransferSalesHistoryTab';

interface TransferSalesProps {
  onNavigate?: (screen: Screen) => void;
  params?: Record<string, unknown>;
}

export function TransferSales({ onNavigate }: TransferSalesProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const canApproveAll = isAdmin || isSupervisor;

  const {
    activeTab,
    switchTab,
    businessCenters,
    users,
    loadingMetadata,
    selectedSociedad,
    setSelectedSociedad,
    selectedCnId,
    setSelectedCnId,
    selectedUnitIds,
    setSelectedUnitIds,
    destinationUserId,
    setDestinationUserId,
    unitBalances,
    unitBoxes,
    loadingUnitsData,
    pendingTransfers,
    loadingPending,
    selectedDestCnMap,
    setSelectedDestCnMap,
    historyTransfers,
    loadingHistory,
    submitting,
    error,
    success,
    isConfirmTransferOpen,
    setIsConfirmTransferOpen,
    confirmAcceptId,
    setConfirmAcceptId,
    confirmRejectId,
    setConfirmRejectId,
    toggleUnitSelection,
    handleSelectAllUnits,
    executeTransferRequest,
    handleAcceptTransfer,
    handleRejectTransfer,
    currentCn,
    activeUnitsInCn,
    totalSelectedBalance,
    currentUserId,
  } = useTransferSalesData(tenantId, userName, canApproveAll);

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
        <p className="text-xs font-semibold">Cargando datos organizacionales...</p>
      </div>
    );
  }

  if (role === 'collector') {
    return <BCTransfers onNavigate={onNavigate} />;
  }

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] -m-4 pb-28 select-none">
      <TransferSalesHeader
        activeTab={activeTab}
        pendingCount={pendingTransfers.length}
        onTabChange={switchTab}
        onNavigate={onNavigate}
      />

      <div className="p-4 max-w-7xl mx-auto w-full space-y-4">
        <TransferSalesAlerts error={error} success={success} />

        {loadingMetadata && (
          <div className="bg-white border border-gray-300 rounded p-12 text-center text-gray-500 space-y-2 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#6A008A] mx-auto" />
            <p className="text-xs font-bold">Cargando base de datos organizacionales...</p>
          </div>
        )}

        {!loadingMetadata && activeTab === 'transfer' && (
          <TransferSalesTransferTab
            businessCenters={businessCenters}
            users={users}
            selectedSociedad={selectedSociedad}
            setSelectedSociedad={setSelectedSociedad}
            selectedCnId={selectedCnId}
            setSelectedCnId={setSelectedCnId}
            selectedUnitIds={selectedUnitIds}
            setSelectedUnitIds={setSelectedUnitIds}
            destinationUserId={destinationUserId}
            setDestinationUserId={setDestinationUserId}
            unitBalances={unitBalances}
            unitBoxes={unitBoxes}
            loadingUnitsData={loadingUnitsData}
            currentCn={currentCn}
            activeUnitsInCn={activeUnitsInCn}
            totalSelectedBalance={totalSelectedBalance}
            currentUserId={currentUserId}
            submitting={submitting}
            toggleUnitSelection={toggleUnitSelection}
            handleSelectAllUnits={handleSelectAllUnits}
            onOpenConfirmTransfer={() => setIsConfirmTransferOpen(true)}
          />
        )}

        {activeTab === 'accept' && (
          <TransferSalesAcceptTab
            loadingPending={loadingPending}
            pendingTransfers={pendingTransfers}
            businessCenters={businessCenters}
            selectedDestCnMap={selectedDestCnMap}
            setSelectedDestCnMap={setSelectedDestCnMap}
            submitting={submitting}
            confirmAcceptId={confirmAcceptId}
            setConfirmAcceptId={setConfirmAcceptId}
            confirmRejectId={confirmRejectId}
            setConfirmRejectId={setConfirmRejectId}
            onAcceptTransfer={handleAcceptTransfer}
            onRejectTransfer={handleRejectTransfer}
          />
        )}

        {activeTab === 'history' && (
          <TransferSalesHistoryTab
            loadingHistory={loadingHistory}
            historyTransfers={historyTransfers}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmTransferOpen}
        onClose={() => setIsConfirmTransferOpen(false)}
        onConfirm={executeTransferRequest}
        title="Confirmar Registro de Traslado de Unidades"
        subtitle={`¿Desea iniciar el traslado en custodia de las ${selectedUnitIds.length} unidades seleccionadas de "${currentCn?.name}" hacia el usuario "${users.find((u) => u.id === destinationUserId)?.userName}"? El destinatario recibirá una notificación para aceptar o rechazar el traslado físico y la cartera total de $ ${fmtTransferSales(totalSelectedBalance)}.`}
        confirmText={submitting ? 'Procesando...' : 'Sí, registrar traslado'}
        cancelText="Cancelar"
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SyncManager, SyncStatus } from '../../utils/syncManager';
import { syncExecutor } from '../../utils/sync/setupSync';

export function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updatePendingCount = useCallback(async () => {
    try {
      const txs = await SyncManager.getAll();
      const pending = txs.filter((tx) => tx.status === SyncStatus.PENDING).length;
      setPendingCount(pending);
    } catch (err) {
      console.error('[SyncStatusBadge] Error loading pending count:', err);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // ENT-05: ao voltar online, drena a fila automaticamente
      void (async () => {
        try {
          await SyncManager.recoverStuckTransactions();
          await syncExecutor.processAll();
          await updatePendingCount();
        } catch (err) {
          console.error('[SyncStatusBadge] Auto-sync on online failed:', err);
        }
      })();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 3000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const handleSync = async () => {
    if (!isOnline || pendingCount === 0 || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncExecutor.processAll();
      await updatePendingCount();
    } catch (err) {
      console.error('[SyncStatusBadge] Manual sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg text-xs font-semibold text-white">
      <div className="flex items-center" title={isOnline ? "Conectado (Online)" : "Desconectado (Offline)"}>
        {isOnline ? (
          <Wifi size={14} className="text-green-400 shrink-0" />
        ) : (
          <WifiOff size={14} className="text-amber-400 shrink-0" />
        )}
      </div>

      <div className="flex items-center border-l border-white/20 pl-1.5" title={pendingCount > 0 ? `${pendingCount} transações pendentes` : "Todo sincronizado"}>
        {pendingCount > 0 ? (
          <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
            {pendingCount}
          </span>
        ) : (
          <CheckCircle2 size={13} className="text-green-400 shrink-0" />
        )}
      </div>

      <button
        type="button"
        onClick={handleSync}
        disabled={!isOnline || pendingCount === 0 || isSyncing}
        className={`flex items-center justify-center p-0.5 rounded-md transition-all cursor-pointer ${
          !isOnline || pendingCount === 0 || isSyncing
            ? 'opacity-40 cursor-not-allowed text-white'
            : 'text-white hover:bg-white/10 active:scale-95'
        }`}
        title="Sincronizar ahora"
      >
        <RefreshCw size={13} className={`${isSyncing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

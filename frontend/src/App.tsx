import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { NavigationProvider } from './context/NavigationContext';
import { AppRoutes } from './routes/AppRoutes';

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-orange-500 text-white text-center py-1 text-xs font-semibold uppercase tracking-widest fixed top-0 w-full z-[9999] shadow-md flex items-center justify-center space-x-2">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      <span>Modo Offline - Você está operando offline</span>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }> {
  state = { hasError: false, error: null as Error | null, errorInfo: null as ErrorInfo | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in App:", error, errorInfo);
    (this as Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }>).setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border border-red-100">
            <h2 className="text-xl font-bold text-red-600 mb-4">Algo salió mal</h2>
            <p className="text-gray-700 text-sm mb-4 font-mono break-all">{this.state.error?.message || "Error desconocido"}</p>
            <details className="mb-4 text-xs text-gray-500 overflow-auto max-h-40">
              <summary>Detalles</summary>
              <pre>{this.state.error?.stack}</pre>
              <pre>{JSON.stringify(this.state.errorInfo)}</pre>
            </details>
            <button 
              onClick={async () => {
                if ('serviceWorker' in navigator) {
                  try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                      await reg.unregister();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }
                if ('caches' in window) {
                  try {
                    const keys = await caches.keys();
                    for (const key of keys) {
                      await caches.delete(key);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }
                window.location.href = window.location.origin + '?clear-cache=' + Date.now();
              }}
              className="w-full bg-[#6A008A] text-white py-2 rounded-md hover:bg-[#52006A] transition-colors font-bold"
            >
              Recargar página y limpiar cache
            </button>
          </div>
        </div>
      );
    }
    return (this as Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }>).props.children;
  }
}

import { GlobalProvider } from './context/GlobalContext';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" />
      <OfflineBanner />
      <HashRouter>
        <GlobalProvider>
          <NavigationProvider>
            <AppRoutes />
          </NavigationProvider>
        </GlobalProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}


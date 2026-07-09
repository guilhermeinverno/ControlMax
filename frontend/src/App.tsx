import { Component, ErrorInfo, ReactNode } from 'react';
import { HashRouter } from 'react-router-dom';
import { NavigationProvider } from './context/NavigationContext';
import { AppRoutes } from './routes/AppRoutes';

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
              onClick={() => window.location.reload()}
              className="w-full bg-[#6A008A] text-white py-2 rounded-md hover:bg-[#52006A] transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return (this as Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }>).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <NavigationProvider>
          <AppRoutes />
        </NavigationProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

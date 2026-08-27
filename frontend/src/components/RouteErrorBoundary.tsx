import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** Identificador da rota/módulo (só para log). */
  label?: string;
  /** Quando muda, reseta o boundary (ex.: pathname). */
  resetKey?: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  resetKey?: string;
}

/**
 * ErrorBoundary local — isola falha de um módulo sem derrubar o app inteiro.
 * UX residual (guia §4): “Tentar novamente” remonta o subtree.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    props: RouteErrorBoundaryProps,
    state: RouteErrorBoundaryState
  ): Partial<RouteErrorBoundaryState> | null {
    if (props.resetKey !== undefined && props.resetKey !== state.resetKey) {
      return { hasError: false, error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[RouteErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-black text-red-800 uppercase tracking-wide">
                  Este módulo falhou
                </h2>
                <p className="text-xs text-red-700 mt-1 break-words font-mono">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
                {this.props.label ? (
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{this.props.label}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6A008A] text-white text-xs font-bold cursor-pointer hover:bg-[#52006A]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

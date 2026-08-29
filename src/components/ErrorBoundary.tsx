import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null });
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  private handleClearStorageAndReload = () => {
    try {
      // Clear non-critical localStorage caches that may have become stale
      const keysToKeep = ['app_theme_color', 'has_seen_onboarding'];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08080a] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Recuperação de Inicialização</h2>
          <p className="text-sm text-white/60 max-w-sm mb-6">
            Detectamos uma inconsistência temporária de carregamento. Escolha uma das opções abaixo para restaurar o app imediatamente.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar App
            </button>

            <button
              onClick={this.handleClearStorageAndReload}
              className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Limpar Cache
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


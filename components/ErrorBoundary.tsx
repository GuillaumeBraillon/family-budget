import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "../services/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Composant Error Boundary pour capturer les erreurs React.
 *
 * @description
 * Intercepte les erreurs non gérées dans l'arbre de composants et affiche
 * une UI de fallback élégante au lieu de faire crasher toute l'application.
 *
 * **Comportement :**
 * - Capture toutes les erreurs React dans ses enfants
 * - Log l'erreur dans la console (avec stack trace en dev)
 * - Affiche une page d'erreur user-friendly
 * - Permet de rafraîchir ou revenir à l'accueil
 *
 * **Usage :**
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur avec détails
    logger.error("🔥 React Error Boundary a capturé une erreur:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-slate-200">
            {/* Icône d'erreur */}
            <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-rose-100">
              <AlertTriangle size={40} className="text-rose-600" />
            </div>

            {/* Titre */}
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-3">Une erreur est survenue</h1>

            {/* Message utilisateur */}
            <p className="text-slate-600 text-center mb-6 leading-relaxed">
              L'application a rencontré un problème inattendu. Vos données sont sécurisées, mais vous devez rafraîchir la page pour continuer.
            </p>

            {/* Détails techniques (pliable) */}
            <details className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <summary className="cursor-pointer font-bold text-slate-700 text-sm hover:text-slate-900 transition-colors">Détails techniques (pour debugging)</summary>
              <div className="mt-4 space-y-2">
                <div className="bg-white p-3 rounded border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 mb-1">Message d'erreur :</p>
                  <p className="text-xs font-mono text-rose-600 break-all">{this.state.error?.message}</p>
                </div>
                {this.state.error?.stack && (
                  <div className="bg-white p-3 rounded border border-slate-200 max-h-48 overflow-auto">
                    <p className="text-xs font-bold text-slate-500 mb-1">Stack trace :</p>
                    <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">{this.state.error.stack}</pre>
                  </div>
                )}
              </div>
            </details>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Rafraîchir la page
              </button>
              <button onClick={this.handleGoHome} className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300 transition-colors">
                Retour à l'accueil
              </button>
            </div>

            {/* Footer */}
            <p className="text-xs text-slate-400 text-center mt-6">
              Si le problème persiste, vérifiez la console (F12) ou contactez le support avec le message d'erreur ci-dessus.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

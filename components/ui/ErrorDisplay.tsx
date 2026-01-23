/**
 * @file Composant d'affichage d'erreur réutilisable
 * @description UI commune pour ErrorModal et ErrorBoundary avec design unifié.
 * Élimine la duplication de code entre les deux composants.
 *
 * @design
 * - Header gradient avec icône
 * - Message d'erreur + contexte
 * - Stack trace pliable
 * - Actions personnalisables
 * - Support mode modal OU fullscreen
 */
import React from "react";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, Home, X } from "lucide-react";

interface ErrorDisplayProps {
  error: Error;
  context?: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  onRefresh: () => void;
  onGoHome: () => void;
  onClose?: () => void; // Optionnel, pour ErrorModal uniquement
  isModal?: boolean; // true = overlay modal, false = fullscreen
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, context, showDetails, onToggleDetails, onRefresh, onGoHome, onClose, isModal = false }) => {
  const containerClass = isModal
    ? "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    : "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";

  return (
    <div className={containerClass}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 border-b border-rose-100 p-6 flex items-start gap-4">
          <div className="bg-rose-100 w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle size={28} className="text-rose-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Une erreur est survenue</h2>
            <p className="text-sm text-slate-600">L'application a rencontré un problème inattendu</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/50"
              title="Fermer"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Contexte */}
          {context && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">📍 Contexte</p>
              <p className="text-sm text-blue-700">{context}</p>
            </div>
          )}

          {/* Message d'erreur */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-rose-900 mb-2">Message d'erreur</p>
            <p className="text-sm text-rose-700 font-mono break-words">{error.message}</p>
          </div>

          {/* Stack trace pliable */}
          {error.stack && (
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <button
                onClick={onToggleDetails}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left"
              >
                <span className="text-sm font-semibold text-slate-700">Détails techniques</span>
                {showDetails ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
              </button>
              {showDetails && (
                <div className="p-4 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words">{error.stack}</pre>
                </div>
              )}
            </div>
          )}

          {/* Conseils */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 mb-2">💡 Que faire ?</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              {isModal ? (
                <>
                  <li>Fermez cette fenêtre et réessayez l'action</li>
                  <li>Rafraîchissez la page si le problème persiste</li>
                  <li>Contactez le support si l'erreur se reproduit</li>
                </>
              ) : (
                <>
                  <li>Rafraîchissez la page pour réinitialiser l'application</li>
                  <li>Retournez à l'accueil si le problème persiste</li>
                  <li>Contactez le support avec la stack trace ci-dessus</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <X size={18} /> Fermer
            </button>
          )}
          <button
            onClick={onRefresh}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <RefreshCw size={18} /> Rafraîchir
          </button>
          <button
            onClick={onGoHome}
            className="py-3 px-4 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

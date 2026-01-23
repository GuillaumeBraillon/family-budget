/**
 * @file Bouton d'export CSV réutilisable
 * @description Composant atomique pour déclencher l'export de données en CSV.
 * Design cohérent avec le reste de l'application (style secondary button).
 */
import React from "react";
import { Download } from "lucide-react";

interface ExportCsvButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Bouton d'export CSV avec icône Download.
 *
 * @description
 * Bouton styled selon le design system de l'app avec support responsive
 * (label caché sur mobile par défaut).
 *
 * @param {Function} onClick - Handler de clic pour déclencher l'export
 * @param {boolean} [disabled=false] - Désactive le bouton
 * @param {string} [label="Export CSV"] - Texte du bouton
 * @param {boolean} [showLabel=true] - Affiche le label sur mobile (force visible)
 * @param {string} [className] - Classes CSS additionnelles
 *
 * @example
 * ```tsx
 * <ExportCsvButton
 *   onClick={handleExport}
 *   disabled={items.length === 0}
 * />
 * ```
 */
export const ExportCsvButton: React.FC<ExportCsvButtonProps> = ({ onClick, disabled = false, label = "Export CSV", showLabel = true, className = "" }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={label}
    >
      <Download size={14} />
      <span className={showLabel ? "" : "hidden sm:inline"}>{label}</span>
    </button>
  );
};

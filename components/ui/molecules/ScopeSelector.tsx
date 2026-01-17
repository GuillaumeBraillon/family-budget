import React from "react";
import { Calendar, CalendarRange } from "lucide-react";

interface ScopeSelectorProps {
  scope: "MONTH" | "PERIOD";
  onScopeChange: (scope: "MONTH" | "PERIOD") => void;
}

/**
 * Sélecteur de portée d'affichage (Mois complet vs Période)
 *
 * @description
 * Composant toggle pour basculer entre vue mensuelle complète et vue par période
 * (semaine ou découpage personnalisé selon configuration).
 *
 * **Design UI :**
 * - Container blanc avec border subtle
 * - Boutons avec transition smooth
 * - Actif : bg-indigo-600 avec shadow
 * - Inactif : text-slate-500 hover:bg-slate-50
 * - Icons Lucide : Calendar (mois) / CalendarRange (période)
 *
 * **Cas d'usage :**
 * - OperationsView : Basculer entre vue mensuelle et périodique
 * - BalancesView : Idem pour les soldes
 *
 * @param {Object} props
 * @param {"MONTH" | "PERIOD"} props.scope - Portée active
 * @param {Function} props.onScopeChange - Callback de changement de portée
 *
 * @example
 * ```tsx
 * const [scope, setScope] = useState<"MONTH" | "PERIOD">("PERIOD");
 *
 * <ScopeSelector scope={scope} onScopeChange={setScope} />
 * ```
 */
export const ScopeSelector: React.FC<ScopeSelectorProps> = ({ scope, onScopeChange }) => {
  return (
    <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center justify-center shadow-sm">
      <button
        onClick={() => onScopeChange("MONTH")}
        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
          scope === "MONTH" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        <Calendar size={14} /> Mois
      </button>
      <button
        onClick={() => onScopeChange("PERIOD")}
        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
          scope === "PERIOD" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        <CalendarRange size={14} /> Période
      </button>
    </div>
  );
};

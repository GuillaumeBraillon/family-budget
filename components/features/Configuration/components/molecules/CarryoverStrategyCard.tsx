import React from "react";
import { AppSettings, CarryoverStrategy } from "../../../../../types";
import { ArrowRightLeft, TrendingDown, Info } from "lucide-react";
import { MobileTooltip } from "../../../../ui/MobileTooltip";

interface CarryoverStrategyCardProps {
  settings: AppSettings;
  onUpdate: (strategy: CarryoverStrategy) => void;
}

/**
 * Composant de configuration de la stratégie de gestion des dépassements budgétaires.
 *
 * @description
 * Permet à l'utilisateur de choisir comment gérer les dépassements (ou économies)
 * budgétaires d'une période vers les suivantes. Affiché dans Configuration > Réglages > Général.
 *
 * **Deux stratégies disponibles :**
 *
 * 1. **NEXT_PERIOD (Déduction simple)** :
 *    - Icon : ArrowRightLeft
 *    - Comportement : Report cumulatif sur la période suivante uniquement
 *    - Exemple : P1 dépasse de 278€ → P2 = 500€ - 278€ = 222€
 *    - Cas d'usage : Budget mensuel avec ajustements ponctuels
 *
 * 2. **SPREAD_REMAINING (Étalement sur périodes restantes)** :
 *    - Icon : TrendingDown
 *    - Comportement : Report réparti équitablement sur toutes les périodes suivantes
 *    - Exemple : P1 dépasse de 300€ → P2, P3, P4 = 500€ - (300÷3) = 400€ chacune
 *    - Cas d'usage : Lissage d'un gros dépassement exceptionnel
 *
 * **Intégration système :**
 * - Mise à jour via `onUpdate(strategy: CarryoverStrategy)`
 * - Persisté dans `AppSettings.carryover_strategy`
 * - Impact immédiat sur les calculs de `periodCarryovers` dans BalancesView
 * - Texte UI adapté dans BudgetDistributionSummary selon stratégie active
 *
 * **Design UI :**
 * - Cards cliquables avec border highlight quand actif
 * - Badge "ACTIF" sur l'option sélectionnée
 * - Exemples chiffrés pour illustrer chaque stratégie
 * - Tooltip explicatif avec icône Info
 * - Couleur thématique : Purple (cohérence avec autres paramètres)
 *
 * @component
 * @example
 * ```tsx
 * // Utilisation dans GlobalSettings
 * <CarryoverStrategyCard
 *   settings={settings}
 *   onUpdate={(strategy) => onUpdate({ ...settings, carryover_strategy: strategy })}
 * />
 * ```
 */
export const CarryoverStrategyCard: React.FC<CarryoverStrategyCardProps> = ({ settings, onUpdate }) => {
  const currentStrategy = settings.carryover_strategy || "NEXT_PERIOD";

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingDown size={20} className="text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Gestion des Dépassements</h3>
            <MobileTooltip
              text={
                <>
                  <strong>Déduction simple :</strong> le solde est reporté uniquement sur la période suivante.
                  <br />
                  <span className="text-slate-500">Ex: P1 dépasse de 300€ → P2 = 500€ - 300€ = 200€</span>
                  <br />
                  <br />
                  <strong>Étalement distribué :</strong> le solde est réparti équitablement sur toutes les périodes restantes.
                  <br />
                  <span className="text-slate-500">Ex: P1 dépasse de 300€ → P2, P3, P4 = 500€ - 100€ = 400€ chacune</span>
                </>
              }
              icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-80"
            />
          </div>
          <p className="text-xs text-slate-500">Stratégie de report en cas de dépassement budgétaire</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Option 1 : Déduction simple */}
        <button
          onClick={() => onUpdate("NEXT_PERIOD")}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            currentStrategy === "NEXT_PERIOD" ? "border-purple-500 bg-purple-50 shadow-sm" : "border-slate-200 hover:border-purple-300 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${currentStrategy === "NEXT_PERIOD" ? "bg-purple-100" : "bg-slate-100"}`}>
              <ArrowRightLeft size={18} className={currentStrategy === "NEXT_PERIOD" ? "text-purple-600" : "text-slate-400"} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${currentStrategy === "NEXT_PERIOD" ? "text-purple-900" : "text-slate-700"}`}>Déduction simple</span>
                {currentStrategy === "NEXT_PERIOD" && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-200 rounded-full">ACTIF</span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Le dépassement est déduit <strong>uniquement de la période suivante</strong>.
              </p>
            </div>
          </div>
        </button>

        {/* Option 2 : Étalement */}
        <button
          onClick={() => onUpdate("SPREAD_REMAINING")}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            currentStrategy === "SPREAD_REMAINING" ? "border-purple-500 bg-purple-50 shadow-sm" : "border-slate-200 hover:border-purple-300 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${currentStrategy === "SPREAD_REMAINING" ? "bg-purple-100" : "bg-slate-100"}`}>
              <TrendingDown size={18} className={currentStrategy === "SPREAD_REMAINING" ? "text-purple-600" : "text-slate-400"} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${currentStrategy === "SPREAD_REMAINING" ? "text-purple-900" : "text-slate-700"}`}>
                  Étalement sur périodes restantes
                </span>
                {currentStrategy === "SPREAD_REMAINING" && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-200 rounded-full">ACTIF</span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Le dépassement est <strong>réparti équitablement sur toutes les périodes restantes</strong>.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

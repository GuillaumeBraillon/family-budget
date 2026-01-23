import React from "react";
import { Layers, TrendingDown, Wallet, Info, ArrowDownUp } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { CarryoverStrategy } from "../../../../types";

/**
 * Props pour le composant BudgetDistributionSummary.
 *
 * @property {number} totalEnvelope - Budget total de la période (base + report ajusté)
 * @property {number} usedEnvelope - Montant consommé (dépenses - revenus, hors Extra)
 * @property {number} distributable - Solde disponible pour répartition (enveloppe - consommé)
 * @property {Array} consumedDetails - Détails de consommation par bénéficiaire (pour tooltip)
 * @property {number} previousCarryover - Report de la période précédente (si scope=PERIOD)
 * @property {number} budgetBase - Budget théorique de base (enveloppe ÷ nb périodes)
 * @property {CarryoverStrategy} carryoverStrategy - Stratégie de report active (NEXT_PERIOD | SPREAD_REMAINING)
 */
interface BudgetDistributionSummaryProps {
  totalEnvelope: number;
  usedEnvelope: number;
  distributable: number;
  consumedDetails?: { name: string; amount: number }[];
  previousCarryover?: number;
  budgetBase?: number;
  carryoverStrategy: CarryoverStrategy;
}

/**
 * Composant de résumé budgétaire avec gestion contextuelle des reports.
 *
 * @description
 * Affiche la répartition budgétaire d'une période avec indicateurs visuels :
 * - Enveloppe totale (ajustée avec reports si période)
 * - Montant consommé (dépenses - revenus Standard uniquement)
 * - Solde distribuable (disponible pour répartition aux comptes persos)
 * - Banner de report (si scope=PERIOD) avec texte adapté à la stratégie active
 *
 * **Affichage contextuel selon carryoverStrategy :**
 * - **NEXT_PERIOD** : "Report période précédente" + "Dépassement déduit du budget de base"
 * - **SPREAD_REMAINING** : "Report étalé" + "Dépassement réparti sur les périodes restantes"
 *
 * **Gestion du banner de report :**
 * - Affiché uniquement si `previousCarryover` et `budgetBase` fournis (scope=PERIOD)
 * - Couleur adaptée : Rouge (dépassement) / Vert (économie)
 * - Exemple de transformation : "500€ → 222€" pour dépassement de 278€
 *
 * **Tooltip détaillé :**
 * - Liste des montants consommés par bénéficiaire (consumedDetails)
 * - Explication du calcul selon la stratégie active
 *
 * @example
 * ```tsx
 * // Utilisation en mode Période avec dépassement
 * <BudgetDistributionSummary
 *   totalEnvelope={222}        // Budget ajusté (500 - 278)
 *   usedEnvelope={150}         // Consommé
 *   distributable={72}         // Reste (222 - 150)
 *   previousCarryover={-278}   // Dépassement P1
 *   budgetBase={500}           // Budget théorique
 *   carryoverStrategy="NEXT_PERIOD"
 * />
 * // Affiche : Banner rouge "Report période précédente : -278€" + "500€ → 222€"
 *
 * // Utilisation en mode Mois (pas de report)
 * <BudgetDistributionSummary
 *   totalEnvelope={2000}
 *   usedEnvelope={1450}
 *   distributable={550}
 *   carryoverStrategy="SPREAD_REMAINING"
 * />
 * // Affiche : Pas de banner, juste les 3 cards principales
 * ```
 */
export const BudgetDistributionSummary: React.FC<BudgetDistributionSummaryProps> = ({
  totalEnvelope,
  usedEnvelope,
  distributable,
  consumedDetails = [],
  previousCarryover,
  budgetBase,
  carryoverStrategy,
}) => {
  // Helpers d'arrondi
  const roundTo0 = (amount: number) => Math.round(amount);
  const roundTo5 = (amount: number) => Math.round(amount / 5) * 5;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xl flex flex-col items-stretch gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      {/* Indicateur de report si applicable */}
      {previousCarryover !== undefined && budgetBase !== undefined && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
          <div className={`p-2 rounded-lg ${previousCarryover < 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            <ArrowDownUp size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {carryoverStrategy === "SPREAD_REMAINING" ? "Report étalé :" : "Report période précédente :"}
              </span>
              <span className={`text-sm font-black ${previousCarryover < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {previousCarryover < 0 ? "" : "+"}
                {previousCarryover.toFixed(2)} €
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {previousCarryover < 0
                ? carryoverStrategy === "SPREAD_REMAINING"
                  ? `Dépassement réparti sur les périodes restantes (${budgetBase.toFixed(0)}€ → ${totalEnvelope.toFixed(2)}€)`
                  : `Dépassement déduit du budget de base (${budgetBase.toFixed(0)}€ → ${totalEnvelope.toFixed(2)}€)`
                : carryoverStrategy === "SPREAD_REMAINING"
                  ? `Économie répartie sur les périodes restantes (${budgetBase.toFixed(0)}€ → ${totalEnvelope.toFixed(2)}€)`
                  : `Économie ajoutée au budget de base (${budgetBase.toFixed(0)}€ → ${totalEnvelope.toFixed(2)}€)`}
            </div>
          </div>
        </div>
      )}

      {/* Grille 3 colonnes */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
        {/* 1. Budget Initial de la Période */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
              <Layers size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Budget Initial Période</span>
            <MobileTooltip
              text={
                previousCarryover !== undefined
                  ? carryoverStrategy === "SPREAD_REMAINING"
                    ? "Budget de base ajusté avec la part de report étalé (dépassement ou économie) des périodes précédentes."
                    : "Budget de base ajusté avec le report (dépassement ou économie) de la période précédente."
                  : "Montant théorique alloué en début de période (Enveloppe Mensuelle ÷ Nombre de Périodes)."
              }
              icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-48"
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-200">{roundTo5(totalEnvelope)} €</span>
            {Math.abs(roundTo5(totalEnvelope) - totalEnvelope) > 0.01 && (
              <span className="text-[10px] text-slate-500 font-medium">({totalEnvelope.toFixed(2)})</span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-indigo-300/70 leading-tight">
            {previousCarryover !== undefined
              ? carryoverStrategy === "SPREAD_REMAINING"
                ? "Budget ajusté avec étalement."
                : "Budget ajusté avec report."
              : "Montant de départ avant toute dépense."}
          </div>
        </div>

        <div className="hidden md:block w-px bg-white/10"></div>

        {/* 2. Consommation Variables */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
              <TrendingDown size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consommation Variables</span>
            <MobileTooltip
              text={
                <div className="space-y-1">
                  <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Détail par compte :</p>
                  {consumedDetails.length > 0 ? (
                    consumedDetails.map((d, i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <span>{d.name}</span>
                        <span className="font-mono font-bold">{d.amount.toFixed(2)}€</span>
                      </div>
                    ))
                  ) : (
                    <span className="italic opacity-70">Aucune consommation.</span>
                  )}
                  <div className="border-t border-slate-200 pt-1 mt-1 text-[10px] text-indigo-600">
                    Opérations variables standard (Source: Variable, Nature: Standard, Statut: Tous).
                  </div>
                </div>
              }
              icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-60"
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-300">{-roundTo0(usedEnvelope)} €</span>
            {Math.abs(roundTo0(usedEnvelope) - usedEnvelope) > 0.01 && (
              <span className="text-[10px] text-slate-500 font-medium">({(-usedEnvelope).toFixed(2)})</span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-rose-300/70 leading-tight">Opérations enregistrées (pointées + en attente).</div>
        </div>

        <div className="hidden md:block w-px bg-white/10"></div>

        {/* 3. Reste sur la Période */}
        <div className="flex-1 flex flex-col justify-between items-end text-right">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reste sur la Période</span>
            <div className="p-1.5 bg-white/10 rounded-lg text-white">
              <Wallet size={16} />
            </div>
            <MobileTooltip
              text="Budget Initial - Consommation Réelle. Base de calcul pour la répartition aux comptes persos selon les % configurés."
              icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-56"
            />
          </div>
          <div>
            <span className={`text-3xl font-black tracking-tighter ${distributable >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {roundTo5(distributable)} €
            </span>
          </div>
          <div className="mt-3 flex flex-col items-end gap-1">
            {Math.abs(roundTo5(distributable) - distributable) > 0.01 && (
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 italic">
                Exact : <span className="font-bold text-slate-200">{distributable.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
              {distributable >= 0
                ? "Disponible pour répartition aux comptes persos"
                : carryoverStrategy === "SPREAD_REMAINING"
                  ? "Dépassement à étaler sur les périodes restantes"
                  : "Dépassement à déduire de la période suivante"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

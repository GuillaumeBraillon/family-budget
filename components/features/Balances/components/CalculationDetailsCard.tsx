import React, { useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";

interface CalculationDetailsCardProps {
  budgetPeriod: number;
  consumption: number;
  distributable: number;
  totalPersonalBalance: number;
  personalExcess: number;
  jointGap: number;
  amountToTake: number;
  totalSurplus: number;
  lddsNeeded: number;
}

/**
 * Carte dépliable affichant les détails des calculs de répartition budgétaire.
 *
 * Affiche tous les montants intermédiaires et la logique de calcul
 * pour comprendre comment on arrive aux transferts finaux.
 */
export const CalculationDetailsCard: React.FC<CalculationDetailsCardProps> = ({
  budgetPeriod,
  consumption,
  distributable,
  totalPersonalBalance,
  personalExcess,
  jointGap,
  amountToTake,
  totalSurplus,
  lddsNeeded,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator size={20} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900">Détails des Calculs</h3>
            <p className="text-xs text-slate-500">Comprendre la répartition des montants</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200">
          {/* Section 1 : Budget de période */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              <h4 className="text-xs font-bold text-slate-700 uppercase">Étape 1 : Budget de Période</h4>
            </div>

            <DetailRow
              label="Budget initial période"
              value={budgetPeriod}
              tooltip="Montant théorique alloué en début de période (Enveloppe Mensuelle ÷ Nombre de Périodes)"
              color="indigo"
            />

            <DetailRow
              label="Consommation variables"
              value={consumption}
              tooltip="Dépenses - Revenus des opérations variables standard (hors Extra, hors Virements internes)"
              color="rose"
              isNegative
            />

            <div className="border-t border-slate-200 pt-2 mt-2">
              <DetailRow
                label="Reste sur la période"
                value={distributable}
                tooltip="Ce montant devrait rester collectivement sur les comptes personnels après répartition"
                color="emerald"
                isBold
              />
            </div>
          </div>

          {/* Section 2 : État des comptes persos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
              <h4 className="text-xs font-bold text-slate-700 uppercase">Étape 2 : Comptes Personnels</h4>
            </div>

            <DetailRow
              label="Total actuel comptes persos"
              value={totalPersonalBalance}
              tooltip="Somme des soldes actuels de tous les comptes personnels (courants)"
              color="purple"
            />

            <DetailRow
              label="Cible à garder"
              value={distributable}
              tooltip="Montant qui devrait rester collectivement sur les comptes persos (= Reste sur la période)"
              color="slate"
              isNegative
            />

            <div className="border-t border-slate-200 pt-2 mt-2">
              <DetailRow
                label="Excédent des comptes persos"
                value={personalExcess}
                tooltip="Différence entre solde actuel et montant à garder. Cet excédent peut être redistribué au compte joint."
                color={personalExcess > 0 ? "amber" : "slate"}
                isBold
              />
            </div>
          </div>

          {/* Section 3 : Besoin du compte joint */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
              <h4 className="text-xs font-bold text-slate-700 uppercase">Étape 3 : Compte Joint (Pivot)</h4>
            </div>

            <DetailRow
              label="Gap compte joint"
              value={jointGap}
              tooltip="Dettes en attente - Solde actuel. Montant nécessaire pour couvrir les dépenses prévues."
              color="orange"
            />

            <DetailRow label="Excédent disponible" value={personalExcess} tooltip="Montant disponible depuis les comptes personnels" color="slate" isNegative />

            <div className="border-t border-slate-200 pt-2 mt-2">
              <DetailRow
                label="À prendre des comptes persos"
                value={amountToTake}
                tooltip="Minimum entre le gap du joint et l'excédent des persos. Montant total à redistribuer proportionnellement."
                color="blue"
                isBold
              />
            </div>
          </div>

          {/* Section 4 : Résultat final */}
          <div className="space-y-2 bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
              <h4 className="text-xs font-bold text-slate-700 uppercase">Résultat</h4>
            </div>

            <DetailRow
              label="Total reversé par comptes persos"
              value={totalSurplus}
              tooltip="Montant effectivement collecté auprès des comptes personnels (après seuil de 10€)"
              color="blue"
              isBold
            />

            <DetailRow
              label="Complément depuis LDDS"
              value={lddsNeeded}
              tooltip="Gap restant après utilisation des excédents des comptes persos. Sera prélevé du compte d'épargne LDDS."
              color={lddsNeeded > 0 ? "rose" : "emerald"}
              isBold
            />

            {lddsNeeded === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-emerald-700 font-medium">
                  ✅ Les comptes personnels couvrent intégralement le besoin du compte joint. Aucun prélèvement LDDS nécessaire !
                </p>
              </div>
            )}

            {lddsNeeded > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Un prélèvement de {lddsNeeded.toFixed(2)}€ depuis le LDDS est nécessaire pour compléter le budget du compte joint.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value: number;
  tooltip: string;
  color?: "indigo" | "rose" | "emerald" | "purple" | "slate" | "amber" | "orange" | "blue";
  isNegative?: boolean;
  isBold?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, tooltip, color = "slate", isNegative = false, isBold = false }) => {
  const colorClasses = {
    indigo: "text-indigo-700",
    rose: "text-rose-700",
    emerald: "text-emerald-700",
    purple: "text-purple-700",
    slate: "text-slate-700",
    amber: "text-amber-700",
    orange: "text-orange-700",
    blue: "text-blue-700",
  };

  const bgColorClasses = {
    indigo: "bg-indigo-50",
    rose: "bg-rose-50",
    emerald: "bg-emerald-50",
    purple: "bg-purple-50",
    slate: "bg-slate-50",
    amber: "bg-amber-50",
    orange: "bg-orange-50",
    blue: "bg-blue-50",
  };

  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${bgColorClasses[color]}`}>
      <div className="flex items-center gap-2 flex-1">
        <span className={`text-xs ${isBold ? "font-bold" : "font-medium"} ${colorClasses[color]}`}>{label}</span>
        <MobileTooltip text={tooltip} icon={<Info size={12} className="text-slate-600 hover:text-slate-800" />} widthClass="w-64" />
      </div>
      <span className={`text-xs ${isBold ? "font-black" : "font-bold"} ${colorClasses[color]} font-mono`}>
        {isNegative && value > 0 ? "- " : ""}
        {value.toFixed(2)} €
      </span>
    </div>
  );
};

import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { OperationFilters } from "../../../../types";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";

interface FamilyVariableBalanceCardProps {
  familyVariableBudgetTotal: number;
  familyVariableNet: number;
  familyVariableRemaining: number;
  standardNet: number;
  refundsAmount: number;
  extraNet: number;
  totalNet: number;
  realNet: number;
  waitingNet: number;
  displayedFamilyNet: number;
  familyBeneficiaryIds?: string[];
  currentDate?: Date;
  onNavigate?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const FamilyVariableBalanceCard: React.FC<FamilyVariableBalanceCardProps> = ({
  familyVariableBudgetTotal,
  familyVariableNet,
  familyVariableRemaining,
  standardNet,
  refundsAmount,
  extraNet,
  totalNet,
  realNet,
  waitingNet,
  displayedFamilyNet,
  familyBeneficiaryIds = [],
  currentDate,
  onNavigate,
}) => {
  const roundTo0 = (amount: number) => Math.round(amount);

  // Affichage du montant arrondi avec indication du montant exact au survol

  // Tooltip détaillé pour les dépenses famille
  const renderFamilySpentTooltip = () => (
    <div className="space-y-1">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Dépenses Famille (incl. enfants)</p>
      <div className="flex justify-between gap-4">
        <span>Standard</span>
        <span className="font-mono font-bold">{standardNet.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Remboursements</span>
        <span className="font-mono font-bold text-emerald-700">-{refundsAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Extra</span>
        <span className="font-mono font-bold">{extraNet.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
        <span>Total</span>
        <span className="font-mono font-bold">{totalNet.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Réel</span>
        <span className="font-mono font-bold">{realNet.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>En attente</span>
        <span className="font-mono font-bold">{waitingNet.toFixed(2)}€</span>
      </div>
    </div>
  );

  if (familyVariableBudgetTotal === 0 && familyVariableNet === 0 && familyVariableRemaining === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white shadow-lg border border-slate-200 p-4 space-y-4">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget Famille</h3>
          <MobileTooltip text={renderFamilySpentTooltip()} icon={<Info size={16} />} widthClass="w-72" />
        </div>
        <span className="text-2xl font-black text-indigo-500">{roundTo0(familyVariableBudgetTotal)} €</span>

        {/* Barre de progression du budget famille */}
        <BudgetProgressBar consumed={displayedFamilyNet} budget={familyVariableBudgetTotal} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Carte des dépenses variables famille (réel) */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-start">
          <div className="text-xs uppercase text-slate-400 font-bold mb-2 tracking-wide w-full text-left">Variables (Réel)</div>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "VARIABLE", status: "REAL", nature: "EXCLUDE", beneficiaryIds: familyBeneficiaryIds })}
            onNavigate={onNavigate}
            as="button"
            className="mt-1 text-3xl font-black text-slate-900 hover:opacity-80 transition-opacity w-full text-center"
          >
            {roundTo0(displayedFamilyNet)} €
          </ClickableAmount>

          <div className="mt-3 text-xs flex flex-wrap items-center gap-2 justify-center w-full">
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", nature: "ONLY", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigate}
              as="button"
              className="text-amber-600 hover:underline"
            >
              Extra : {roundTo0(extraNet)} €
            </ClickableAmount>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigate}
              as="button"
              className="hover:underline"
            >
              Total : {roundTo0(totalNet)} €
            </ClickableAmount>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ flux: "INCOME", source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigate}
              as="button"
              className="text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5 hover:bg-sky-100 transition-colors"
            >
              Remboursements: {roundTo0(refundsAmount)} €
            </ClickableAmount>
          </div>
        </div>

        {/* Carte des dépenses variables famille (en attente) */}
        <div
          className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all flex flex-col justify-start ${
            familyVariableRemaining >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          }`}
        >
          <div className="text-xs uppercase font-bold mb-2 text-slate-400 w-full text-left">Variables (Restant)</div>
          <div className={`mt-1 text-3xl font-black w-full text-center ${familyVariableRemaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {roundTo0(familyVariableRemaining)} €
          </div>
          <div className="pt-3 mt-auto text-xs flex flex-wrap items-center gap-2 justify-center w-full">
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", status: "WAITING", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigate}
              as="button"
              className="text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5 hover:bg-sky-100 transition-colors"
            >
              En attente: {roundTo0(waitingNet)} €
            </ClickableAmount>
          </div>
        </div>
      </div>
    </div>
  );
};

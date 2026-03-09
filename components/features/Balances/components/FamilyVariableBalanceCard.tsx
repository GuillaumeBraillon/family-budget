import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { OperationFilters } from "../../../../types";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";

interface FamilyVariableBalanceCardProps {
  familyVariableBudgetTotalAmount: number;
  familyVariableNetAmount: number;
  familyVariableRemainingAmount: number;
  standardAmount: number;
  refundsAmount: number;
  extraAmount: number;
  totalAmount: number;
  realAmount: number;
  waitingAmount: number;
  displayedFamilyAmount: number;
  familyBeneficiaryIds?: string[];
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const FamilyVariableBalanceCard: React.FC<FamilyVariableBalanceCardProps> = ({
  familyVariableBudgetTotalAmount,
  familyVariableNetAmount,
  familyVariableRemainingAmount,
  standardAmount,
  refundsAmount,
  extraAmount,
  totalAmount,
  realAmount,
  waitingAmount,
  displayedFamilyAmount,
  familyBeneficiaryIds = [],
  currentDate,
  onNavigateToOperations,
}) => {
  const roundTo0 = (amount: number) => Math.round(amount);

  // Tooltip détaillé pour les dépenses famille
  const renderFamilySpentTooltip = () => (
    <div className="space-y-1">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Dépenses Famille (incl. enfants)</p>
      <div className="flex justify-between gap-4">
        <span>Standard</span>
        <span className="font-mono font-bold">{standardAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Remboursements</span>
        <span className="font-mono font-bold text-emerald-700">-{refundsAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Extra</span>
        <span className="font-mono font-bold">{extraAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
        <span>Total</span>
        <span className="font-mono font-bold">{totalAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Réel</span>
        <span className="font-mono font-bold">{realAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>En attente</span>
        <span className="font-mono font-bold">{waitingAmount.toFixed(2)}€</span>
      </div>
    </div>
  );

  if (familyVariableBudgetTotalAmount === 0 && familyVariableNetAmount === 0 && familyVariableRemainingAmount === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white shadow-lg border border-slate-200 p-4 space-y-4">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget Famille</h3>
          <MobileTooltip text={renderFamilySpentTooltip()} icon={<Info size={16} />} widthClass="w-72" />
        </div>
        <span className="text-2xl font-black text-indigo-500">{roundTo0(familyVariableBudgetTotalAmount)} €</span>

        {/* Barre de progression du budget famille */}
        <BudgetProgressBar consumed={displayedFamilyAmount} budget={familyVariableBudgetTotalAmount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Carte des dépenses variables famille (réel) */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-start">
          <div className="text-xs uppercase text-slate-400 font-bold mb-2 tracking-wide w-full text-left">Variables (Réel)</div>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "VARIABLE", status: "REAL", nature: "EXCLUDE", beneficiaryIds: familyBeneficiaryIds })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="mt-1 text-3xl font-black text-slate-900 hover:opacity-80 transition-opacity w-full text-center"
          >
            {roundTo0(displayedFamilyAmount)} €
          </ClickableAmount>

          <div className="mt-3 text-xs flex flex-wrap items-center gap-2 justify-center w-full">
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", nature: "ONLY", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigateToOperations}
              as="button"
              className="text-amber-600 hover:underline"
            >
              Extra : {roundTo0(extraAmount)} €
            </ClickableAmount>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigateToOperations}
              as="button"
              className="hover:underline"
            >
              Total : {roundTo0(totalAmount)} €
            </ClickableAmount>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ flux: "INCOME", source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigateToOperations}
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
            familyVariableRemainingAmount >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          }`}
        >
          <div className="text-xs uppercase font-bold mb-2 text-slate-400 w-full text-left">Variables (Restant)</div>
          <div className={`mt-1 text-3xl font-black w-full text-center ${familyVariableRemainingAmount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {roundTo0(familyVariableRemainingAmount)} €
          </div>
          <div className="pt-3 mt-auto text-xs flex flex-wrap items-center gap-2 justify-center w-full">
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", status: "WAITING", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigateToOperations}
              as="button"
              className="text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5 hover:bg-sky-100 transition-colors"
            >
              En attente: {roundTo0(waitingAmount)} €
            </ClickableAmount>
          </div>
        </div>
      </div>
    </div>
  );
};

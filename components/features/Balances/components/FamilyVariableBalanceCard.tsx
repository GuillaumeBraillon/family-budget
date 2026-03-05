import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { OperationFilters } from "../../../../types";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";

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

  const renderRoundedAndExact = (amount: number) => (
    <>
      {roundTo0(amount)} €{Math.abs(amount - roundTo0(amount)) > 0.01 && <span className="ml-1 text-[10px] text-slate-400">({amount.toFixed(2)})</span>}
    </>
  );
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
    <div className="rounded-3xl bg-white shadow-xl border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget Famille</h3>
            <MobileTooltip text={renderFamilySpentTooltip()} icon={<Info size={16} />} widthClass="w-72" />
          </div>
          <p className="text-sm font-black text-indigo-400">{renderRoundedAndExact(familyVariableBudgetTotal)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200">
          <div className="text-xs uppercase text-rose-400 font-bold mb-2">Variables (Réel)</div>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "VARIABLE", status: "REAL", nature: "EXCLUDE", beneficiaryIds: familyBeneficiaryIds })}
            onNavigate={onNavigate}
            as="button"
            className="text-3xl font-black text-rose-600 hover:opacity-80 transition-opacity"
          >
            {renderRoundedAndExact(displayedFamilyNet)}
          </ClickableAmount>

          <div className="mt-3 text-xs flex flex-wrap items-center gap-2">
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", nature: "ONLY", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigate}
              as="button"
              className="text-amber-600 hover:underline"
            >
              Extra : {roundTo0(extraNet)} €
            </ClickableAmount>
            <span className="text-slate-300">•</span>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
              onNavigate={onNavigate}
              as="button"
              className="hover:underline"
            >
              Total : {roundTo0(totalNet)} €
            </ClickableAmount>
            <span className="text-slate-300">•</span>
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

        <div className={`rounded-2xl p-4 border ${familyVariableRemaining >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className="text-xs uppercase font-bold mb-2 text-slate-400">Variables (Restant)</div>
          <div className={`text-3xl font-black ${familyVariableRemaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {renderRoundedAndExact(familyVariableRemaining)}
          </div>
          <div className="mt-3 text-xs flex flex-wrap items-center gap-2">
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

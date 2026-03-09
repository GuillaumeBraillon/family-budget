import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { OperationFilters } from "../../../../types";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";

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
  const operationsTotalAmount = realAmount + waitingAmount;
  const subCardClass = "rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start";
  const sectionLabelClass = "text-xs uppercase tracking-widest text-slate-400 font-bold";

  // Tooltip détaillé pour les dépenses famille
  const renderFamilySpentTooltip = () => (
    <div className="space-y-1">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Dépenses Famille (incl. enfants)</p>

      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">Lecture de la carte</p>
      <div className="flex justify-between gap-4">
        <span>Variables (Réel)</span>
        <span className="font-mono font-bold text-slate-900">{displayedFamilyAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Extra (hors budget)</span>
        <span className="font-mono font-bold text-amber-700">{extraAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Remboursements</span>
        <span className="font-mono font-bold text-emerald-700">-{refundsAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>En attente</span>
        <span className="font-mono font-bold">{waitingAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
        <span>Total réel des opérations</span>
        <span className="font-mono font-bold">{operationsTotalAmount.toFixed(2)}€</span>
      </div>

      <p className="text-[10px] text-slate-500">Le total réel inclut toutes les opérations (standard + extra + attente).</p>
    </div>
  );

  if (familyVariableBudgetTotalAmount === 0 && familyVariableNetAmount === 0 && familyVariableRemainingAmount === 0) {
    return null;
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-0 border-b-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget Famille</CardTitle>
          <MobileTooltip text={renderFamilySpentTooltip()} icon={<Info size={16} />} widthClass="w-72" />
        </div>
        <span className="text-2xl font-black text-indigo-500">{roundTo0(familyVariableBudgetTotalAmount)} €</span>

        {/* Barre de progression du budget famille */}
        <BudgetProgressBar consumed={displayedFamilyAmount} budget={familyVariableBudgetTotalAmount} />
      </CardHeader>

      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Carte des dépenses variables famille (réel) */}
          <div className={subCardClass}>
            <div className={`${sectionLabelClass} mb-2 w-full text-left`}>Variables (Réel)</div>
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
                className="text-amber-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Extra : {roundTo0(extraAmount)} €
              </ClickableAmount>
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Total réel : {roundTo0(totalAmount)} €
              </ClickableAmount>
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ flux: "INCOME", source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="text-sky-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Remboursements : {roundTo0(refundsAmount)} €
              </ClickableAmount>
            </div>
          </div>

          {/* Carte des dépenses variables famille (en attente) */}
          <div className={subCardClass}>
            <div className={`${sectionLabelClass} mb-2 w-full text-left`}>Variables (Restant)</div>
            <div className={`mt-1 text-3xl font-black w-full text-center ${familyVariableRemainingAmount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {roundTo0(familyVariableRemainingAmount)} €
            </div>
            <div className="pt-3 mt-auto text-xs flex flex-wrap items-center gap-2 justify-center w-full">
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ source: "VARIABLE", status: "WAITING", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="text-sky-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                En attente : {roundTo0(waitingAmount)} €
              </ClickableAmount>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

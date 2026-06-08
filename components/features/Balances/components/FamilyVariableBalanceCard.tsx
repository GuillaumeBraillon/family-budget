import React from "react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { OperationFilters } from "../../../../types";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useBudget } from "@/hooks/useBudget";
import { useAdminView } from "@/contexts/AdminViewContext";
import { Info } from "lucide-react";

interface FamilyVariableBalanceCardProps {
  familyVariableBudgetTotalAmount: number;
  familyVariableMonthBudgetAmount: number;
  familyVariablePeriodsCount: number;
  familyVariablePeriodValue: number;
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
  familyVariableMonthBudgetAmount,
  familyVariablePeriodsCount,
  familyVariableNetAmount,
  familyVariableRemainingAmount,
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
  const invert = (amount: number) => -amount;
  const operationsTotalAmount = realAmount + waitingAmount;
  const periodCount = Math.max(1, familyVariablePeriodsCount);
  const baseBudgetPerPeriod = familyVariableMonthBudgetAmount / periodCount;
  // Report de la période précédente (dépassement)
  const previousPeriodOverrun = baseBudgetPerPeriod - familyVariableBudgetTotalAmount;
  const subCardClass = "rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start";
  const sectionLabelClass = "text-xs uppercase tracking-widest text-slate-400 font-bold";
  const rowClass = "flex items-center justify-between text-[11px] gap-3";
  const amountClass = "font-black text-slate-600 whitespace-nowrap";

  // Autorisation: rendre l'élément transparent pour les non-admins
  const { user } = useAuth();
  const { authorizedUsers } = useBudget();
  const { viewAsNonAdmin } = useAdminView();
  const currentEmail = user?.email;
  const actualIsAdmin = !!authorizedUsers.find((u) => u.email === currentEmail && !!u.isAdmin);
  const isAdmin = actualIsAdmin && !viewAsNonAdmin;

  if (!isAdmin) return null;

  // Tooltip détaillé pour les dépenses famille
  const renderFamilySpentTooltip = () => (
    <div className="space-y-2 text-[11px]">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1">Détails</p>

      {/* Calcul du solde restant */}
      <div>
        <p className="font-bold uppercase tracking-wider text-slate-500 mb-1">Calcul du solde restant</p>
        <div className="flex justify-between gap-4">
          <span>Budget par période</span>
          <span className="font-mono font-bold">{baseBudgetPerPeriod.toFixed(2)}€</span>
        </div>
        {previousPeriodOverrun !== 0 && (
          <div className="flex justify-between gap-4">
            <span>Report période précédente</span>
            <span className="font-mono font-bold text-amber-700">- {previousPeriodOverrun.toFixed(2)}€</span>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
          <span>Budget période ajusté</span>
          <span className="font-mono font-bold text-indigo-700">{familyVariableBudgetTotalAmount.toFixed(2)}€</span>
        </div>
      </div>

      {/* Détails des opérations */}
      <div>
        <p className="font-bold uppercase tracking-wider text-slate-500 mb-1">Détails des opérations</p>

        <div className="flex justify-between gap-4">
          <span>Variables (réel)</span>
          <span className="font-mono font-bold text-slate-900">{invert(displayedFamilyAmount).toFixed(2)}€</span>
        </div>

        <div className="flex justify-between gap-4">
          <span>Dont remboursements</span>
          <span className="font-mono font-bold text-emerald-700">{refundsAmount.toFixed(2)}€</span>
        </div>

        <div className="flex justify-between gap-4">
          <span>Extras</span>
          <span className="font-mono font-bold text-amber-700">{-extraAmount.toFixed(2)}€</span>
        </div>

        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
          <span>Total des opérations avec Extras</span>
          <span className="font-mono font-bold">{-totalAmount.toFixed(2)}€</span>
        </div>

        {/* Report sur la période suivante */}
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
          <span>Report sur période suivante</span>
          <span className="font-mono font-bold text-rose-600">{familyVariableRemainingAmount.toFixed(2)}€</span>
        </div>
      </div>
      {/* Détail des opérations en attente */}
      <div>
        <p className="font-bold uppercase tracking-wider text-slate-500 mb-1">Opérations en attente</p>

        <div className="flex justify-between gap-4">
          <span>Variables (en attente)</span>
          <span className="font-mono font-bold text-sky-700">{invert(waitingAmount).toFixed(2)}€</span>
        </div>

        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
          <span>Total avec en attente</span>
          <span className="font-mono font-bold">{invert(operationsTotalAmount).toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );

  if (familyVariableBudgetTotalAmount === 0 && familyVariableNetAmount === 0 && familyVariableRemainingAmount === 0) {
    return null;
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-2 border-b-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget Famille</CardTitle>
          <MobileTooltip text={renderFamilySpentTooltip()} icon={<Info size={16} />} widthClass="w-72" />
          {isAdmin && <div className="ml-auto text-xs text-slate-400 font-medium">Admin only</div>}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex flex-col gap-5">
        {/* SECTION 1 : Budget variable famille */}
        <div className="flex flex-col gap-2">
          <div className={rowClass}>
            <span className="font-bold text-slate-700 truncate">Dépensé</span>
            <span className="flex items-baseline gap-1 whitespace-nowrap">
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ source: "VARIABLE", status: "REAL", nature: "EXCLUDE", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className={amountClass}
              >
                {roundTo0(displayedFamilyAmount)} €
              </ClickableAmount>
              <span className="font-black text-slate-600 whitespace-nowrap">/ {roundTo0(familyVariableBudgetTotalAmount)} €</span>
            </span>
          </div>

          {/* Barre de progression du budget famille */}
          <BudgetProgressBar consumed={displayedFamilyAmount} budget={familyVariableBudgetTotalAmount} />
        </div>
      </CardContent>

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
              {roundTo0(invert(displayedFamilyAmount))} €
            </ClickableAmount>

            <div className="mt-3 text-xs flex flex-wrap items-center gap-2 justify-center w-full">
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ flux: "INCOME", source: "VARIABLE", nature: "EXCLUDE", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="text-sky-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Remboursements : {roundTo0(refundsAmount)} €
              </ClickableAmount>
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ source: "VARIABLE", nature: "ONLY", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="text-amber-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Extra : {roundTo0(invert(extraAmount))} €
              </ClickableAmount>
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({ source: "VARIABLE", beneficiaryIds: familyBeneficiaryIds })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Total réel : {roundTo0(invert(totalAmount))} €
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
                En attente : {roundTo0(invert(waitingAmount))} €
              </ClickableAmount>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

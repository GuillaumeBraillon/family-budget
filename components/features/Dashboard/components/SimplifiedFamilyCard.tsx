import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { OperationFilters } from "../../../../types";

interface SimplifiedFamilyCardProps {
  // Budget variable famille
  familyVariableBudgetTotalAmount: number;
  displayedFamilyAmount: number; // montant dépensé (signé)
  familyBeneficiaryIds?: string[];
  // Opérations récurrentes
  paidRecurringNetAmount: number;
  totalPendingRecurringAmount: number;
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const SimplifiedFamilyCard: React.FC<SimplifiedFamilyCardProps> = ({
  familyVariableBudgetTotalAmount,
  displayedFamilyAmount,
  familyBeneficiaryIds = [],
  paidRecurringNetAmount,
  totalPendingRecurringAmount,
  currentDate,
  onNavigateToOperations,
}) => {
  const roundTo0 = (n: number) => Math.round(n);
  const invert = (n: number) => -n;

  // --- Budget variable famille ---
  // displayedFamilyAmount est une dépense nette (négatif), on travaille en valeur absolue
  const spentFamily = Math.abs(displayedFamilyAmount);
  const budgetFamily = Math.max(1, familyVariableBudgetTotalAmount);

  // --- Récurrentes ---
  // Même calcul que PendingOperationsCard
  const netPending = invert(totalPendingRecurringAmount);
  const totalRecurringNetAmount = Math.abs(-(paidRecurringNetAmount - netPending));
  const consumedRecurring = Math.abs(roundTo0(paidRecurringNetAmount));
  const budgetRecurring = Math.max(1, roundTo0(totalRecurringNetAmount));

  const rowClass = "flex items-center justify-between text-sm text-slate-500";
  const amountClass = "font-black text-slate-800 text-lg";

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-2 border-b-0">
        <CardTitle className="text-sm uppercase tracking-widest text-slate-500 font-bold">Suivi du mois</CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex flex-col gap-5">
        {/* SECTION 1 : Budget variable famille */}
        {familyVariableBudgetTotalAmount > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Budget Famille</span>

            <div className={rowClass}>
              <span>Dépensé</span>
              <span className="flex items-baseline gap-1">
                <ClickableAmount
                  date={currentDate}
                  filters={buildOperationsFilters({ source: "VARIABLE", status: "REAL", nature: "EXCLUDE", beneficiaryIds: familyBeneficiaryIds })}
                  onNavigate={onNavigateToOperations}
                  as="button"
                  className={amountClass}
                >
                  {roundTo0(spentFamily)} €
                </ClickableAmount>
                <span className="text-sm text-slate-800">
                  / {roundTo0(budgetFamily)} € <span className="text-slate-800">(autorisé)</span>
                </span>
              </span>
            </div>

            <BudgetProgressBar consumed={spentFamily} budget={budgetFamily} />
          </div>
        )}

        {/* SECTION 2 : Récurrentes */}
        {totalRecurringNetAmount > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Récurrentes</span>

            <div className={rowClass}>
              <span>Pointé</span>
              <span className="flex items-baseline gap-1">
                <ClickableAmount
                  date={currentDate}
                  filters={buildOperationsFilters({ source: "RECURRING", status: "REAL" })}
                  onNavigate={onNavigateToOperations}
                  as="button"
                  className={amountClass}
                >
                  {consumedRecurring} €
                </ClickableAmount>
                <span className="text-sm text-slate-800">
                  / {budgetRecurring} € <span className="text-slate-800">(total)</span>
                </span>
              </span>
            </div>

            <BudgetProgressBar consumed={consumedRecurring} budget={budgetRecurring} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

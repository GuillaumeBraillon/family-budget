import React, { useMemo } from "react";
import { CalendarClock, ShoppingBag, Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { OperationFilters } from "../../../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";

interface PendingOperationsCardProps {
  totalPendingAmount: number;
  totalPendingRecurringAmount: number;
  totalPendingVariableAmount: number;
  paidRecurringAmount: number;
  paidRecurringNetAmount: number;
  totalRecurringAmount: number;
  overduePendingRecurringAmount?: number;
  overduePendingVariableAmount?: number;
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const PendingOperationsCard: React.FC<PendingOperationsCardProps> = ({
  totalPendingAmount,
  totalPendingRecurringAmount,
  totalPendingVariableAmount,
  paidRecurringAmount,
  paidRecurringNetAmount,
  totalRecurringAmount,
  overduePendingRecurringAmount = 0,
  overduePendingVariableAmount = 0,
  currentDate,
  onNavigateToOperations,
}) => {
  const roundTo0 = (amount: number) => Math.round(amount);
  const invert = (amount: number) => -amount;

  // Net remaining recurring operations (income - expenses)
  // invert sign for correct display
  const netPending = invert(totalPendingRecurringAmount);

  // paidRecurringNetAmount is stored as a positive expense total internally, while netPending is already signed for display
  // Convert to the real signed financial total: -(paid - remaining)
  const totalRecurringNetAmount = -(paidRecurringNetAmount - netPending);

  const formatSigned = (value: number) => `${value < 0 ? "-" : "+"}${Math.abs(Math.round(value))} €`;

  const recurringTooltip = useMemo(() => {
    // Remaining expenses (signed value, e.g. -17€)
    const pendingExpensesAbs = totalRecurringAmount - paidRecurringAmount;
    const pendingExpenses = -pendingExpensesAbs;

    // income = net + expenses (because expenses are negative)
    const pendingIncome = netPending - pendingExpenses;

    const paidIncome = paidRecurringAmount - paidRecurringNetAmount;

    return (
      <div className="space-y-1">
        <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Récurrentes pointées :</p>
        <div className="flex justify-between gap-4">
          <span>Dépenses</span>
          <span className="font-mono font-bold">{formatSigned(-paidRecurringAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Revenus</span>
          <span className="font-mono font-bold">{formatSigned(paidIncome)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1 mb-1">
          <span>Total pointé</span>
          <span className="font-mono font-bold">{formatSigned(-paidRecurringNetAmount)}</span>
        </div>

        <p className="font-bold text-slate-600 border-b border-slate-200 pb-1 mb-1">Récurrentes restantes :</p>

        <div className="flex justify-between gap-4">
          <span>Dépenses</span>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING", status: "WAITING", flux: "EXPENSE" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="font-mono font-bold"
          >
            {formatSigned(pendingExpenses)}
          </ClickableAmount>
        </div>

        <div className="flex justify-between gap-4">
          <span>Revenus</span>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING", status: "WAITING", flux: "INCOME" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="font-mono font-bold"
          >
            {formatSigned(pendingIncome)}
          </ClickableAmount>
        </div>

        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
          <span>Total en attente</span>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING", status: "WAITING" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="font-mono font-bold text-indigo-600 hover:text-indigo-800"
          >
            {formatSigned(netPending)}
          </ClickableAmount>
        </div>

        <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
          <span>Total récurrent</span>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="font-mono font-bold text-red-500 hover:text-red-700"
          >
            {formatSigned(totalRecurringNetAmount)}
          </ClickableAmount>
        </div>
      </div>
    );
  }, [totalRecurringAmount, paidRecurringAmount, paidRecurringNetAmount, netPending, totalRecurringNetAmount, currentDate, onNavigateToOperations]);

  const subCardClass = "rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between";
  const sectionLabelClass = "text-xs uppercase tracking-widest text-slate-400 font-bold";

  // Ensure progress bar values are not negative
  const consumedForBar = Math.abs(Math.round(paidRecurringNetAmount));
  const budgetForBar = Math.max(1, Math.abs(Math.round(totalRecurringNetAmount)));

  // --- TOOLTIP DÉTAILÉ ---
  const renderPendingTotalTooltip = () => (
    <div className="space-y-1">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Détail total compte joint :</p>
      <div className="flex justify-between gap-4">
        <span>Récurrentes</span>
        <span className="font-mono font-bold">{invert(totalPendingRecurringAmount).toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Variables</span>
        <span className="font-mono font-bold">{invert(totalPendingVariableAmount).toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
        <span>Total</span>
        <span className="font-mono font-bold">{invert(totalPendingAmount).toFixed(2)}€</span>
      </div>
    </div>
  );

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-0 border-b-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm uppercase tracking-widest text-slate-500 font-bold">Opérations en attente</CardTitle>
          <MobileTooltip text={renderPendingTotalTooltip()} icon={<Info size={16} />} widthClass="w-72" />
        </div>
        <ClickableAmount
          date={currentDate}
          filters={buildOperationsFilters({ status: "WAITING" })}
          onNavigate={onNavigateToOperations}
          as="button"
          className="text-2xl font-black text-indigo-500 hover:opacity-80"
        >
          {roundTo0(invert(totalPendingAmount))} €
        </ClickableAmount>

        {/* Barre de progression des récurrentes : payé vs restant */}
        <div className="flex items-center gap-1 mt-3 mb-1">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Récurrentes</span>
          <MobileTooltip icon={<Info size={13} />} widthClass="w-72" text={recurringTooltip} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING", status: "REAL" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="inline-flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <span>Payé</span>
            <span className="font-black">{roundTo0(paidRecurringNetAmount)} €</span>
          </ClickableAmount>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="inline-flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <span>Total</span>
            <span className="font-black">{roundTo0(budgetForBar)} €</span>
          </ClickableAmount>
        </div>
        <BudgetProgressBar consumed={consumedForBar} budget={budgetForBar} />
      </CardHeader>

      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={subCardClass}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1.5 bg-slate-200 rounded text-slate-600">
                <CalendarClock size={14} />
              </div>
              <div className={sectionLabelClass}>Récurrentes</div>
            </div>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "RECURRING", status: "WAITING" })}
              onNavigate={onNavigateToOperations}
              as="button"
              className="text-3xl font-black text-slate-700 hover:text-slate-600"
            >
              {roundTo0(invert(totalPendingRecurringAmount))} €
            </ClickableAmount>
            <div className="mt-2 text-xs text-slate-400 text-center">En retard : {roundTo0(invert(overduePendingRecurringAmount))} €</div>
          </div>

          <div className={subCardClass}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1.5 bg-slate-200 rounded text-slate-600">
                <ShoppingBag size={14} />
              </div>
              <div className={sectionLabelClass}>Variables</div>
            </div>
            <ClickableAmount
              date={currentDate}
              filters={buildOperationsFilters({ source: "VARIABLE", status: "WAITING" })}
              onNavigate={onNavigateToOperations}
              as="button"
              className="text-3xl font-black text-indigo-600 hover:text-indigo-500"
            >
              {roundTo0(invert(totalPendingVariableAmount))} €
            </ClickableAmount>
            <div className="mt-2 text-xs text-slate-400 text-center">En retard : {roundTo0(invert(overduePendingVariableAmount))} €</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

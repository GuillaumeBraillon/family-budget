import React from "react";
import { CalendarClock, ShoppingBag, Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { OperationFilters } from "../../../../types";

interface PendingOperationsCardProps {
  totalPendingAmount: number;
  totalPendingRecurringAmount: number;
  totalPendingVariableAmount: number;
  overduePendingRecurringAmount?: number;
  overduePendingVariableAmount?: number;
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const PendingOperationsCard: React.FC<PendingOperationsCardProps> = ({
  totalPendingAmount,
  totalPendingRecurringAmount,
  totalPendingVariableAmount,
  overduePendingRecurringAmount = 0,
  overduePendingVariableAmount = 0,
  currentDate,
  onNavigateToOperations,
}) => {
  const roundTo0 = (amount: number) => Math.round(amount);
  const renderPendingTotalTooltip = () => (
    <div className="space-y-1">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Détail total compte joint :</p>
      <div className="flex justify-between gap-4">
        <span>Récurrentes</span>
        <span className="font-mono font-bold">{totalPendingRecurringAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Variables</span>
        <span className="font-mono font-bold">{totalPendingVariableAmount.toFixed(2)}€</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1">
        <span>Total</span>
        <span className="font-mono font-bold">{totalPendingAmount.toFixed(2)}€</span>
      </div>
    </div>
  );

  return (
    <div className="rounded-3xl bg-white shadow-lg border border-slate-200 p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm uppercase tracking-widest text-slate-500 font-bold">Opérations en attente</h2>
            <MobileTooltip text={renderPendingTotalTooltip()} icon={<Info size={16} />} widthClass="w-72" />
          </div>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ status: "WAITING" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="text-2xl font-black text-indigo-500 hover:opacity-80"
          >
            {roundTo0(totalPendingAmount)} €
          </ClickableAmount>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1.5 bg-slate-200 rounded text-slate-600">
              <CalendarClock size={14} />
            </div>
            <div className="text-xs uppercase text-slate-400 font-bold">Récurrentes</div>
          </div>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "RECURRING", status: "WAITING" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="text-3xl font-black text-slate-700 hover:text-slate-600"
          >
            {roundTo0(totalPendingRecurringAmount)} €
          </ClickableAmount>
          <div className="mt-2 text-xs text-slate-400 text-center">En retard : {roundTo0(overduePendingRecurringAmount)} €</div>
        </div>

        <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1.5 bg-indigo-100 rounded text-indigo-500">
              <ShoppingBag size={14} />
            </div>
            <div className="text-xs uppercase text-indigo-400 font-bold">Variables</div>
          </div>
          <ClickableAmount
            date={currentDate}
            filters={buildOperationsFilters({ source: "VARIABLE", status: "WAITING" })}
            onNavigate={onNavigateToOperations}
            as="button"
            className="text-3xl font-black text-indigo-600 hover:text-indigo-500"
          >
            {roundTo0(totalPendingVariableAmount)} €
          </ClickableAmount>
          <div className="mt-2 text-xs text-indigo-500 text-center">En retard : {roundTo0(overduePendingVariableAmount)} €</div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { CalendarClock, ShoppingBag, Wallet, Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { OperationFilters } from "../../../../types";

interface BalancesHeaderProps {
  resteAPayer: number;
  pendingRecurring: number;
  pendingVariablesDetails?: { name: string; amount: number }[];
  pendingRecurringDetails?: { name: string; amount: number }[];
  totalDetails?: { name: string; amount: number }[];
  currentDate?: Date;
  activeWeek?: number;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const BalancesHeader: React.FC<BalancesHeaderProps> = ({
  resteAPayer,
  pendingRecurring,
  pendingVariablesDetails = [],
  pendingRecurringDetails = [],
  totalDetails = [],
  currentDate,
  activeWeek: _activeWeek,
  onNavigateToOperations,
}) => {
  const totalPendingVariable = pendingVariablesDetails.reduce((sum, d) => sum + d.amount, 0);

  // Arrondi pour l'affichage propre
  const roundTo0 = (amount: number) => Math.round(amount);

  const handleRecurringClick = () => {
    if (onNavigateToOperations && currentDate) {
      onNavigateToOperations(currentDate, {
        flux: "ALL",
        source: "RECURRING",
        status: "WAITING",
        nature: "ALL",
        transfer: "EXCLUDE",
        salary: "EXCLUDE",
        accountIds: ["3"], // Compte Joint
        beneficiaryIds: [],
        includedTagIds: [],
        excludedTagIds: [],
        tagPresence: "ALL",
      });
    }
  };

  const handleVariableClick = () => {
    if (onNavigateToOperations && currentDate) {
      onNavigateToOperations(currentDate, {
        flux: "ALL",
        source: "VARIABLE",
        status: "WAITING",
        nature: "ALL",
        transfer: "EXCLUDE",
        salary: "EXCLUDE",
        accountIds: ["3"], // Compte Joint
        beneficiaryIds: [],
        includedTagIds: [],
        excludedTagIds: [],
        tagPresence: "ALL",
      });
    }
  };

  const handleTotalClick = () => {
    if (onNavigateToOperations && currentDate) {
      onNavigateToOperations(currentDate, {
        flux: "ALL",
        source: "ALL",
        status: "WAITING",
        nature: "ALL",
        transfer: "EXCLUDE",
        salary: "EXCLUDE",
        accountIds: ["3"], // Compte Joint
        beneficiaryIds: [],
        includedTagIds: [],
        excludedTagIds: [],
        tagPresence: "ALL",
      });
    }
  };

  const renderTooltipContent = (details: { name: string; amount: number }[]) => (
    <div className="space-y-1">
      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Détail par compte :</p>
      {details.length > 0 ? (
        details.map((d, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span>{d.name}</span>
            <span className="font-mono font-bold">{d.amount.toFixed(2)}€</span>
          </div>
        ))
      ) : (
        <span className="italic opacity-70">Aucun montant.</span>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-stretch justify-between gap-4 animate-in slide-in-from-top-2 duration-500 border border-white/10">
        {/* Section 1: Récurrentes */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="p-1 bg-slate-700/50 rounded text-slate-300">
              <CalendarClock size={14} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Récurrentes</span>
            <MobileTooltip
              text={renderTooltipContent(pendingRecurringDetails)}
              icon={<Info size={12} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-56"
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <button
              onClick={handleRecurringClick}
              className="text-xl font-black hover:text-indigo-200 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
              title="Voir dans Opérations"
            >
              {roundTo0(pendingRecurring)} €
            </button>
            {Math.abs(pendingRecurring - roundTo0(pendingRecurring)) > 0.01 && (
              <span className="text-[9px] text-slate-500 font-medium">({pendingRecurring.toFixed(2)})</span>
            )}
          </div>
        </div>

        <div className="hidden md:block w-px bg-white/10"></div>

        {/* Section 2: Variables */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="p-1 bg-indigo-500/20 rounded text-indigo-400">
              <ShoppingBag size={14} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variables</span>
            <MobileTooltip
              text={renderTooltipContent(pendingVariablesDetails)}
              icon={<Info size={12} className="text-indigo-500 hover:text-indigo-700" />}
              widthClass="w-56"
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <button
              onClick={handleVariableClick}
              className="text-xl font-black text-indigo-200 hover:text-indigo-100 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
              title="Voir dans Opérations"
            >
              {roundTo0(totalPendingVariable)} €
            </button>
            {Math.abs(totalPendingVariable - roundTo0(totalPendingVariable)) > 0.01 && (
              <span className="text-[9px] text-slate-500 font-medium">({totalPendingVariable.toFixed(2)})</span>
            )}
          </div>
        </div>

        <div className="hidden md:block w-px bg-white/10"></div>

        {/* Section 3: Total */}
        <div className="flex-1 flex flex-col justify-between items-end text-right">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total en attente</span>
            <div className="p-1 bg-white/10 rounded text-white">
              <Wallet size={14} />
            </div>
            <MobileTooltip
              text={renderTooltipContent(totalDetails)}
              icon={<Info size={12} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-56"
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <button
              onClick={handleTotalClick}
              className="text-2xl font-black tracking-tighter text-white hover:text-indigo-200 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
              title="Voir dans Opérations"
            >
              {roundTo0(resteAPayer)} €
            </button>
            {Math.abs(resteAPayer - roundTo0(resteAPayer)) > 0.01 && <span className="text-[9px] text-slate-500 font-medium">({resteAPayer.toFixed(2)})</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

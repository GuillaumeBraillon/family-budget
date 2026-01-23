import React from "react";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

interface TransfersKPIsProps {
  stats: {
    toSavings: number;
    fromSavings: number;
    internalChecking: number;
  };
}

export const TransfersKPIs: React.FC<TransfersKPIsProps> = ({ stats }) => {
  const netSavings = stats.toSavings - stats.fromSavings;
  const isPositive = netSavings >= 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch justify-between gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      {/* 1. ÉPARGNE CONSTITUÉE */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
            <TrendingUp size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Épargne Constituée</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black">+{stats.toSavings.toFixed(2)} €</span>
        </div>
        <div className="mt-2 text-[10px] text-emerald-400/70 leading-tight">Virements sortants vers livrets d'épargne.</div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* 2. REPRISES SUR ÉPARGNE */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
            <TrendingDown size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reprises sur Épargne</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black">-{stats.fromSavings.toFixed(2)} €</span>
        </div>
        <div className="mt-2 text-[10px] text-amber-400/70 leading-tight">Argent récupéré depuis l'épargne vers le courant.</div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* 3. SOLDE NET (Variation) */}
      <div className="flex-1 flex flex-col justify-between items-end text-right">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variation Nette</span>
          <div className={`p-1.5 rounded-lg ${isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
            <PiggyBank size={16} />
          </div>
        </div>
        <div>
          <span className={`text-3xl font-black tracking-tighter ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? "+" : ""}
            {netSavings.toFixed(2)} €
          </span>
        </div>
        <div className="mt-3 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            {isPositive ? "Accroissement du patrimoine" : "Diminution du patrimoine"}
          </div>
        </div>
      </div>
    </div>
  );
};

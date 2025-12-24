
import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { MobileTooltip } from '../../../ui/MobileTooltip';

interface SavingsStats {
  totalCredit: number;
  totalDebit: number;
  monthCredit: number;
  monthDebit: number;
  monthOpsCount: number;
}

interface SavingsKPIsProps {
  totalBalance: number;
  monthNet: number;
  stats: SavingsStats;
}

export const SavingsKPIs: React.FC<SavingsKPIsProps> = ({ totalBalance, monthNet, stats }) => {
  const isPositiveNet = monthNet >= 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch justify-between gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      
      {/* SOLDE ACTUEL */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
                <Wallet size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Actuel</span>
            <MobileTooltip 
                text="Montant total disponible sur ce compte à ce jour (calculé sur l'historique des virements)." 
                iconClassName="text-slate-500 hover:text-white"
                widthClass="w-48" 
            />
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter">{totalBalance.toFixed(2)} €</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px]">
             <span className={`font-bold ${isPositiveNet ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositiveNet ? '+' : ''}{monthNet.toFixed(2)} €
             </span>
             <span className="text-indigo-300/70">variation ce mois ({stats.monthOpsCount} ops)</span>
        </div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* CUMUL VERSEMENTS */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumul Versements</span>
            <MobileTooltip 
                text="Total historique des sommes versées sur ce compte." 
                iconClassName="text-slate-500 hover:text-white"
                widthClass="w-48" 
            />
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">+{stats.totalCredit.toFixed(2)} €</span>
        </div>
        <div className="mt-2 text-[10px] text-emerald-400/70 leading-tight flex items-center gap-1">
            <Calendar size={10} /> Dont {stats.monthCredit.toFixed(0)} € ce mois
        </div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* CUMUL RETRAITS */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
                <TrendingDown size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumul Retraits</span>
            <MobileTooltip 
                text="Total historique des sommes retirées de ce compte." 
                iconClassName="text-slate-500 hover:text-white"
                widthClass="w-48" 
            />
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">-{stats.totalDebit.toFixed(2)} €</span>
        </div>
        <div className="mt-2 text-[10px] text-rose-400/70 leading-tight flex items-center gap-1">
            <Calendar size={10} /> Dont {stats.monthDebit.toFixed(0)} € ce mois
        </div>
      </div>

    </div>
  );
};

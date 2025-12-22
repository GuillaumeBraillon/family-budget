
import React from 'react';
import { TrendingDown, TrendingUp, Wallet, Clock, CheckCircle2, Calendar, Star } from 'lucide-react';

interface SummaryStats {
  real: number;
  planned: number;
  pending: number;
  extra: number;
}

interface QuickPeriodSummaryProps {
  expenses: SummaryStats;
  income: SummaryStats;
}

export const QuickPeriodSummary: React.FC<QuickPeriodSummaryProps> = ({ expenses, income }) => {
  const netReal = income.real - expenses.real;
  const netPlanned = income.planned - expenses.planned;
  const netPending = income.pending - expenses.pending;
  const isPositive = netReal >= 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch justify-between gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      
      {/* SECTION DÉPENSES */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
                <TrendingDown size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dépenses Période</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{(expenses.real + expenses.pending).toFixed(2)} €</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <MetricLabel icon={<Star size={10}/>} label="Extra" value={expenses.extra} color="text-rose-300" />
            <MetricLabel icon={<Calendar size={10}/>} label="Prévu" value={expenses.planned} color="text-slate-400" />
            <MetricLabel icon={<Clock size={10}/>} label="Attente" value={expenses.pending} color="text-amber-400" />
        </div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* SECTION REVENUS */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenus Période</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{(income.real + income.pending).toFixed(2)} €</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <MetricLabel icon={<Star size={10}/>} label="Extra" value={income.extra} color="text-emerald-300" />
            <MetricLabel icon={<Calendar size={10}/>} label="Prévu" value={income.planned} color="text-slate-400" />
            <MetricLabel icon={<Clock size={10}/>} label="Attente" value={income.pending} color="text-amber-400" />
        </div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* SECTION BILAN (NET) */}
      <div className="flex-1 flex flex-col justify-between items-end text-right">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bilan Net (Réel)</span>
            <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <Wallet size={16} />
            </div>
        </div>
        <div>
            <span className={`text-3xl font-black tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{netReal.toFixed(2)} €
            </span>
        </div>
        <div className="mt-3 flex flex-col items-end gap-1">
             <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 italic">
                Reste en attente : <span className="text-amber-400 font-bold">{netPending.toFixed(2)} €</span>
             </div>
             <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                Cible initiale : <span className="font-bold">{netPlanned.toFixed(2)} €</span>
             </div>
        </div>
      </div>
    </div>
  );
};

const MetricLabel: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
    <div className="flex items-center gap-1.5">
        <span className={`${color} opacity-80`}>{icon}</span>
        <span className="text-[9px] font-bold text-slate-500 uppercase">{label}</span>
        <span className={`text-[11px] font-bold ${color}`}>{value.toFixed(0)}€</span>
    </div>
);

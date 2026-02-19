import React from "react";
import { TrendingDown, TrendingUp, Wallet, Clock, Calendar, Star, AlertCircle } from "lucide-react";

interface SummaryStats {
  real: number;
  planned: number;
  pending: number;
  extra: number;
  delays: number; // Opérations en attente des périodes précédentes
}

interface QuickPeriodSummaryProps {
  expenses: SummaryStats;
  income: SummaryStats;
}

export const QuickPeriodSummary: React.FC<QuickPeriodSummaryProps> = ({ expenses, income }) => {
  const netReal = income.real - expenses.real;
  const netPlanned = income.planned - expenses.planned;
  const netPending = income.pending + income.delays - (expenses.pending + expenses.delays);
  const isPositive = netReal >= 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-center md:items-stretch justify-between gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      {/* SECTION DÉPENSES */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
            <TrendingDown size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Dépenses</span>
            <span className="text-xl md:text-2xl font-black leading-tight">{(expenses.real + expenses.pending + expenses.delays).toFixed(0)} €</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
          <MetricLabel icon={<Star size={9} />} label="Extra" value={expenses.extra} color="text-rose-300" />
          <MetricLabel icon={<Calendar size={9} />} label="Prévu" value={expenses.planned} color="text-slate-400" />
          <MetricLabel icon={<Clock size={9} />} label="Attente" value={expenses.pending} color="text-amber-400" />
          {expenses.delays > 0.01 && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-md">
              <AlertCircle size={9} className="text-red-500 animate-pulse" />
              <span className="font-bold text-red-500 uppercase">Retards</span>
              <span className="font-black text-red-600 bg-red-500/40 px-1.5 py-0.5 rounded">{expenses.delays.toFixed(0)}€</span>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* SECTION REVENUS */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
            <TrendingUp size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Revenus</span>
            <span className="text-xl md:text-2xl font-black leading-tight">{(income.real + income.pending + income.delays).toFixed(0)} €</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
          <MetricLabel icon={<Star size={9} />} label="Extra" value={income.extra} color="text-emerald-300" />
          <MetricLabel icon={<Calendar size={9} />} label="Prévu" value={income.planned} color="text-slate-400" />
          <MetricLabel icon={<Clock size={9} />} label="Attente" value={income.pending} color="text-amber-400" />
          {income.delays > 0.01 && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-md">
              <AlertCircle size={9} className="text-red-500 animate-pulse" />
              <span className="font-bold text-red-500 uppercase">Retards</span>
              <span className="font-black text-red-600 bg-red-500/40 px-1.5 py-0.5 rounded">{income.delays.toFixed(0)}€</span>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* SECTION BILAN (NET) */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 items-end text-right w-full md:w-auto">
        <div className="flex items-center gap-2 md:flex-row-reverse">
          <div className={`p-1.5 rounded-lg ${isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
            <Wallet size={14} />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Bilan Net</span>
            <span className={`text-2xl md:text-3xl font-black tracking-tighter leading-tight ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? "+" : ""}
              {netReal.toFixed(0)} €
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[9px]">
          <div className="flex items-center gap-1 font-medium text-slate-400">
            Attente : <span className="text-amber-400 font-bold">{netPending.toFixed(0)}€</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-500">
            Cible : <span className="font-bold">{netPlanned.toFixed(0)}€</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricLabel: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-1">
    <span className={`${color} opacity-70`}>{icon}</span>
    <span className="font-bold text-slate-500 uppercase">{label}</span>
    <span className={`font-black ${color}`}>{value.toFixed(0)}€</span>
  </div>
);

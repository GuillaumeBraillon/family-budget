
import React from 'react';
import { Clock, AlertCircle, ShoppingBag, TrendingUp, CalendarCheck } from 'lucide-react';
import { StatCard } from '../../../ui/atoms/StatCard';
import { Account } from '../../../../types';
import { MobileTooltip } from '../../../ui/MobileTooltip';

interface StatsSummaryProps {
  stats: any;
  accounts: Account[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats, accounts }) => {
  const isOver = stats.varRemaining < 0;
  const progressVariable = Math.min((stats.varExpenses / Math.max((stats.periodLimit + stats.varIncome), 1)) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard 
        title="Reste à payer (Factures)" 
        amount={stats.fixedToPay + stats.fixedDelays} 
        icon={<CalendarCheck size={14} className="text-amber-500" />} 
        border="border-l-4 border-l-amber-500"
      >
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-100/50">
            <span className="text-emerald-700 font-medium flex items-center gap-2">
              <Clock size={14} /> Déjà payé
              <MobileTooltip text="Somme des factures prévues déjà pointées sur cette période." iconSize={12} widthClass="w-48" />
            </span>
            <span className="font-black text-emerald-700 text-sm">{stats.fixedPaid.toFixed(2)} €</span>
          </div>
          
          <div className="flex justify-between items-center py-1.5 px-3 text-slate-500 border-b border-slate-50">
            <span className="flex items-center gap-2 italic">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
               Période en cours
               <MobileTooltip text="Factures non pointées prévues sur ces dates." iconSize={12} widthClass="w-48" />
            </span>
            <span className="font-bold text-slate-700">{stats.fixedToPay.toFixed(2)} €</span>
          </div>

          {stats.fixedDelays > 0 && (
            <div className="flex justify-between items-center py-2 px-3 bg-rose-50 rounded-lg border border-rose-100 text-rose-600 animate-pulse">
              <span className="font-bold flex items-center gap-2">
                <AlertCircle size={14} /> Retards passés
                <MobileTooltip text="Factures des périodes précédentes non encore pointées." iconSize={12} widthClass="w-48" />
              </span>
              <span className="font-black text-sm">{stats.fixedDelays.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </StatCard>

      <StatCard 
        title="Budget Variable" 
        amount={stats.varRemaining} 
        icon={<ShoppingBag size={14} className="text-indigo-600" />} 
        border="border-r-4 border-r-indigo-600"
        hideAmount
      >
        <div className="mt-4 space-y-4">
          <div className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${isOver ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div>
               <p className="text-[10px] uppercase font-black tracking-wider opacity-60">Reste disponible</p>
               <p className={`text-xl font-black ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {stats.varRemaining.toFixed(2)} €
               </p>
            </div>
            {isOver ? <AlertCircle size={24} className="text-rose-400" /> : <TrendingUp size={24} className="text-emerald-400" />}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">
                <span>Consommation Enveloppe</span>
                <span>{Math.round(progressVariable)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                <div 
                className={`h-2 rounded-full transition-all duration-700 shadow-sm ${isOver ? 'bg-rose-500' : 'bg-indigo-600'}`}
                style={{ width: `${progressVariable}%`}}
                ></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 px-1 italic">
                <span>Dépensé: {stats.varExpenses.toFixed(2)}€</span>
                <span>Budget: {(stats.periodLimit + stats.varIncome).toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

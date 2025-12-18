
import React, { useState } from 'react';
import { Clock, Wallet, AlertCircle, ArrowDownCircle, Target, TrendingDown, TrendingUp, Info, X } from 'lucide-react';
import { StatCard } from '../atoms/StatCard';
import { Account } from '../../../types';

interface StatsSummaryProps {
  stats: any;
  accounts: Account[];
}

/**
 * Composant de Tooltip compatible mobile (s'affiche au clic)
 */
const MobileTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 text-slate-300 hover:text-indigo-500 transition-colors"
      >
        <Info size={12} />
      </button>
      {isOpen && (
        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl animate-in zoom-in-95 fade-in duration-200">
          <div className="flex justify-between items-start mb-1 font-bold border-b border-slate-700 pb-1">
            <span>Aide</span>
            <X size={10} className="cursor-pointer" onClick={() => setIsOpen(false)} />
          </div>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats, accounts }) => {
  const variance = stats.paidRealPeriod - stats.paidOriginalValue;
  const hasVariance = Math.abs(variance) > 0.01;
  const isOverBudget = variance > 0;

  const budgetConsumedPercent = Math.round((stats.paidOriginalValue / Math.max(stats.totalPlannedPeriod, 1)) * 100);
  const remainingBudgetCapacity = stats.totalPlannedPeriod - stats.paidRealPeriod;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* CARTE 1 : RÉEL (Pointage et cash-flow) */}
      <StatCard 
        title="Reste à payer" 
        amount={stats.totalToRegularizeActual} 
        icon={<Clock size={14} className="text-amber-500" />} 
        border="border-l-4 border-l-amber-500"
      >
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-100/50">
            <span className="text-emerald-700 font-medium flex items-center gap-2">
              <ArrowDownCircle size={14} /> Déjà payé
              <MobileTooltip text="Somme des montants tels qu'ils ont été saisis lors du pointage de cette période." />
            </span>
            <span className="font-black text-emerald-700 text-sm">{stats.paidRealPeriod.toFixed(2)} €</span>
          </div>
          
          <div className="flex justify-between items-center py-1.5 px-3 text-slate-500 border-b border-slate-50">
            <span className="flex items-center gap-2 italic">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
               Reste à payer
               <MobileTooltip text="Somme des montants restants à payer pour finir la période en cours." />
            </span>
            <span className="font-bold text-slate-700">{stats.remainingRealPeriod.toFixed(2)} €</span>
          </div>

          {stats.delaysRealPrevious > 0 && (
            <div className="flex justify-between items-center py-2 px-3 bg-rose-50 rounded-lg border border-rose-100 text-rose-600 animate-pulse">
              <span className="font-bold flex items-center gap-2">
                <AlertCircle size={14} /> Retards périodes précédentes
                <MobileTooltip text="Somme des opérations des périodes passées qui n'ont jamais été pointées comme payées." />
              </span>
              <span className="font-black text-sm">{stats.delaysRealPrevious.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </StatCard>

      {/* CARTE 2 : BUDGET SEMAINE (Provisionnel et Performance) */}
      <StatCard 
        title="Budget Période" 
        amount={stats.totalPlannedPeriod} 
        icon={<Wallet size={14} className="text-indigo-600" />} 
        border="border-r-4 border-r-indigo-600"
      >
        <div className="mt-4 space-y-4">
          
          {/* Indicateur d'Écart explicite */}
          <div className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
            !hasVariance 
              ? 'bg-slate-50 border-slate-100' 
              : (isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200')
          }`}>
            <div className={`p-2 rounded-lg ${isOverBudget ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {/* Inversion des icônes : Économie = Positif = Flèche Haut (Gain de performance) */}
                {isOverBudget ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </div>
            <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm font-black ${isOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {hasVariance 
                      ? `${isOverBudget ? 'Dépassement' : 'Économie'} de ${Math.abs(variance).toFixed(2)} €` 
                      : "Conforme au prévisionnel"}
                </span>
                <MobileTooltip text="Différence entre ce que vous avez RÉELLEMENT payé et ce que vous aviez PRÉVU pour les items cochés." />
            </div>
          </div>

          {/* KPI Supplémentaire : Solde nécessaire */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center">
                Solde nécessaire
                <MobileTooltip text="Montant net qu'il vous reste théoriquement pour finir la période sans dépasser le budget initialement prévu." />
            </span>
            <div className="text-right">
                <span className={`text-sm font-black ${remainingBudgetCapacity >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {remainingBudgetCapacity.toFixed(2)} €
                </span>
            </div>
          </div>

          {/* Barre de progression du pointage */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">
                <span>Avancement Pointage</span>
                <span>{budgetConsumedPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-700 shadow-sm" 
                style={{ width: `${Math.min(budgetConsumedPercent, 100)}%`}}
                ></div>
            </div>
          </div>
        </div>
      </StatCard>

    </div>
  );
};

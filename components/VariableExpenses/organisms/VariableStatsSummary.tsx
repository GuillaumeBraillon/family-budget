
import React from 'react';
import { Wallet, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../../BudgetPlanner/atoms/StatCard';

interface VariableStatsSummaryProps {
  budget: number;
  expenses: number;
  income: number;
}

export const VariableStatsSummary: React.FC<VariableStatsSummaryProps> = ({ budget, expenses, income }) => {
  const totalAvailable = budget + income;
  const remaining = totalAvailable - expenses;
  const isOver = remaining < 0;
  const progress = Math.min((expenses / (totalAvailable || 1)) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CARTE 1 : BUDGET & REVENUS */}
      <StatCard
        title="Budget Disponible"
        amount={totalAvailable}
        icon={<Wallet size={14} className="text-emerald-600" />}
        border="border-l-4 border-l-emerald-500"
      >
        <div className="mt-4 space-y-2.5 text-xs">
           <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
             <span className="text-slate-600 font-medium">Budget Période</span>
             <span className="font-bold text-slate-900">{budget.toFixed(2)} €</span>
           </div>
           {income > 0 && (
             <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700">
               <span className="font-medium flex items-center gap-1"><TrendingUp size={14}/> Revenus Variables</span>
               <span className="font-bold">+{income.toFixed(2)} €</span>
             </div>
           )}
        </div>
      </StatCard>

      {/* CARTE 2 : CONSOMMATION */}
      <StatCard
        title="Dépenses & Reste"
        amount={expenses}
        icon={<ShoppingBag size={14} className="text-indigo-600" />}
        border="border-r-4 border-r-indigo-600"
      >
         <div className="mt-4 space-y-4">
            <div className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${isOver ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div>
                   <p className="text-[10px] uppercase font-black tracking-wider opacity-60">Reste à vivre</p>
                   <p className={`text-xl font-black ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {remaining.toFixed(2)} €
                   </p>
                </div>
                {isOver ? <AlertCircle size={24} className="text-rose-400" /> : <Wallet size={24} className="text-emerald-400" />}
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">
                    <span>Consommation</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div
                        className={`h-2 rounded-full transition-all duration-700 shadow-sm ${isOver ? 'bg-rose-500' : 'bg-indigo-600'}`}
                        style={{ width: `${progress}%`}}
                    ></div>
                </div>
            </div>
         </div>
      </StatCard>
    </div>
  );
};


import React from 'react';
import { Clock, Wallet } from 'lucide-react';
import { StatCard } from '../atoms/StatCard';
import { Account } from '../../../types';

interface StatsSummaryProps {
  stats: any;
  accounts: Account[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats, accounts }) => {
  const diff = stats.currentPaidExpenses - (stats.currentPaidPlanned || 0);
  const hasDiff = Math.abs(diff) > 0.01;
  // Une différence positive signifie qu'on a dépensé plus que prévu (net) ou reçu moins que prévu (si le net est négatif mais moins négatif que prévu).
  // Bref, plus le chiffre monte, plus c'est "mauvais" pour le budget.
  const isBad = diff > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* KPI 1 : Reste à payer - Bordure à GAUCHE (Ambre) */}
      <StatCard 
        title="Reste à payer" 
        amount={stats.remainingToPay} 
        icon={<Clock size={14}/>} 
        border="border-l-4 border-l-amber-500"
      >
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-500">
            <span>Semaine en cours</span>
            <span className="font-medium text-slate-700">{stats.currentRemaining.toFixed(2)} €</span>
          </div>
          {stats.previousRemaining > 0 && (
            <div className="flex justify-between text-amber-600 font-medium">
              <span>En retard</span>
              <span>{stats.previousRemaining.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </StatCard>

      {/* KPI 2 : Budget Semaine - Bordure à DROITE (Indigo) */}
      <StatCard 
        title="Budget Semaine" 
        amount={stats.totalOriginal} 
        icon={<Wallet size={14}/>} 
        border="border-r-4 border-r-indigo-600"
      >
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-500">
            <span className="text-slate-500">Déjà réglé</span>
            <div className="flex items-center gap-1">
                <span className="font-bold text-indigo-600">{stats.currentPaidExpenses.toFixed(2)} €</span>
                {hasDiff && (
                    <span className={`text-[10px] font-bold ${isBad ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ({isBad ? '+' : ''}{diff.toFixed(2)})
                    </span>
                )}
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(((stats.totalOriginal - stats.currentRemaining) / Math.max(stats.totalOriginal, 1)) * 100, 100)}%`}}
            ></div>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

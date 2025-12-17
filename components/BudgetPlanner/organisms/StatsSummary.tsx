import React from 'react';
import { Clock, Wallet } from 'lucide-react';
import { StatCard } from '../atoms/StatCard';
import { Account } from '../../../types';

interface StatsSummaryProps {
  stats: any;
  accounts: Account[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats, accounts }) => {
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
            <span className="font-bold text-indigo-600">{stats.currentPaidExpenses.toFixed(2)} €</span>
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
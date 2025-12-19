
import React from 'react';
import { Calculator } from 'lucide-react';
import { MobileTooltip } from '../../ui/MobileTooltip';

interface BalancesHeaderProps {
  budgetPeriodeGlobal: number;
  resteAPayer: number;
  totalPersonalBalance: number;
}

export const BalancesHeader: React.FC<BalancesHeaderProps> = ({ budgetPeriodeGlobal, resteAPayer, totalPersonalBalance }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="text-indigo-600" />
              Solde des comptes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
              Ajustez vos soldes réels pour obtenir le calcul précis des virements.
          </p>
      </div>
      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 overflow-x-auto max-w-full">
           <div className="text-right">
               <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-end gap-1 whitespace-nowrap">
                  Total Persos
                  <MobileTooltip text="Cumul des soldes réels de tous les comptes personnels (hors compte joint). À comparer avec le budget autorisé." />
               </div>
               <p className="text-lg font-bold text-emerald-600">{totalPersonalBalance.toFixed(2)} €</p>
           </div>
           <div className="h-8 w-px bg-slate-200 flex-shrink-0"></div>
           <div className="text-right">
               <p className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">Budget Période Global</p>
               <p className="text-lg font-bold text-indigo-600">{budgetPeriodeGlobal.toFixed(2)} €</p>
           </div>
           <div className="h-8 w-px bg-slate-200 flex-shrink-0"></div>
           <div className="text-right">
               <p className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">Reste à payer (Factures)</p>
               <p className="text-lg font-bold text-slate-700">{resteAPayer.toFixed(2)} €</p>
           </div>
      </div>
    </div>
  );
};

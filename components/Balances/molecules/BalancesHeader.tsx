
import React from 'react';
import { Calculator } from 'lucide-react';

interface BalancesHeaderProps {
  budgetPeriodeGlobal: number;
  resteAPayer: number;
}

export const BalancesHeader: React.FC<BalancesHeaderProps> = ({ budgetPeriodeGlobal, resteAPayer }) => {
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
      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
           <div className="text-right">
               <p className="text-[10px] uppercase font-bold text-slate-400">Budget Période Global</p>
               <p className="text-lg font-bold text-indigo-600">{budgetPeriodeGlobal.toFixed(2)} €</p>
           </div>
           <div className="h-8 w-px bg-slate-200"></div>
           <div className="text-right">
               <p className="text-[10px] uppercase font-bold text-slate-400">Reste à payer (Factures)</p>
               <p className="text-lg font-bold text-slate-700">{resteAPayer.toFixed(2)} €</p>
           </div>
      </div>
    </div>
  );
};

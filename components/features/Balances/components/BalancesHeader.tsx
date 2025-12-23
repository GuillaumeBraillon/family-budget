
import React from 'react';
import { Calculator, Info } from 'lucide-react';
import { MobileTooltip } from '../../../ui/MobileTooltip';

interface BalancesHeaderProps {
  resteAPayer: number;
  pendingRecurring: number;
}

export const BalancesHeader: React.FC<BalancesHeaderProps> = ({ 
  resteAPayer, 
  pendingRecurring
}) => {
  // Arrondi à l'entier le plus proche (0 décimale)
  const roundTo0 = (amount: number) => Math.round(amount);
  
  // Arrondi au multiple de 5 le plus proche
  const roundTo5 = (amount: number) => Math.round(amount / 5) * 5;

  const kpis = [
    {
      label: "Op. Récurrentes en attentes",
      amount: roundTo0(pendingRecurring),
      exact: pendingRecurring,
      color: "text-slate-600",
      tooltip: "Total des opérations récurrentes (fixes) encore en attente sur la période + retards."
    },
    {
      label: "Opérations en attentes",
      amount: roundTo5(resteAPayer),
      exact: resteAPayer,
      color: "text-slate-500",
      tooltip: "Somme totale de TOUTES les opérations en attente (Fixes + Variables) sur les comptes courants. C'est ce montant qui doit être couvert par le compte joint."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="text-indigo-600" />
              Solde des comptes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
              Ajustez vos soldes réels pour obtenir le calcul précis des virements.
          </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           {kpis.map((kpi, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight pr-1">
                           {kpi.label}
                       </span>
                       <div className="-mt-1 -mr-1">
                           <MobileTooltip 
                               text={kpi.tooltip} 
                               icon={<Info size={14} className="text-slate-300 hover:text-indigo-500"/>}
                               widthClass="w-48"
                           />
                       </div>
                   </div>
                   <div>
                       <div className={`text-xl font-black ${kpi.color}`}>
                           {kpi.amount} €
                       </div>
                       {Math.abs(kpi.amount - kpi.exact) > 0.01 && (
                           <div className="text-[10px] font-bold text-slate-300">
                               {kpi.exact.toFixed(2)} €
                           </div>
                       )}
                   </div>
               </div>
           ))}
      </div>
    </div>
  );
};

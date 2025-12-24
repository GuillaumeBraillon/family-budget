
import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card } from '../../../ui/Card';
import { MobileTooltip } from '../../../ui/MobileTooltip';

interface SavingsStats {
  totalCredit: number;
  totalDebit: number;
  monthCredit: number;
  monthDebit: number;
  monthOpsCount: number;
}

interface SavingsKPIsProps {
  totalBalance: number;
  monthNet: number;
  stats: SavingsStats;
}

export const SavingsKPIs: React.FC<SavingsKPIsProps> = ({ totalBalance, monthNet, stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CARTE SOLDE ACTUEL */}
      <Card className="p-4 bg-white border-slate-200 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-5">
              <Wallet size={64} className="text-slate-900" />
          </div>
          <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Wallet size={14} className="text-indigo-600"/> 
                  Solde Actuel
                  <MobileTooltip text="Montant total disponible sur ce compte à ce jour." iconSize={12} widthClass="w-48" />
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-2 block">{totalBalance.toFixed(2)} €</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight flex items-center">
                    Variation ce mois
                    <MobileTooltip text="Différence entre les versements et les retraits depuis le 1er du mois." iconSize={12} widthClass="w-48" />
                  </span>
                  <span className={`text-xs font-bold ${monthNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {monthNet > 0 ? '+' : ''}{monthNet.toFixed(2)} €
                  </span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 flex items-center">
                  {stats.monthOpsCount} ops
                  <MobileTooltip text="Nombre de mouvements enregistrés ce mois-ci." iconSize={12} widthClass="w-48" />
              </span>
          </div>
      </Card>

      {/* CARTE VERSEMENTS (Focus Mois) */}
      <Card className="p-4 bg-white border-emerald-100 flex flex-col justify-between">
           <div>
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-1">
                      <TrendingUp size={14} /> Versements
                      <MobileTooltip text="Total de l'argent ajouté sur ce compte ce mois-ci." iconSize={12} widthClass="w-48" />
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold uppercase">Ce mois</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">+{stats.monthCredit.toFixed(2)} €</span>
           </div>
           
           {/* Info Total Historique */}
           <div className="mt-3 bg-emerald-50/50 rounded-lg p-2 flex items-center justify-between border border-emerald-100/50">
              <span className="text-[10px] font-medium text-emerald-800/70 flex items-center gap-1">
                  <Calendar size={10} /> Total Historique
                  <MobileTooltip text="Cumul de tous les versements depuis la création." iconSize={12} widthClass="w-48" />
              </span>
              <span className="text-xs font-bold text-emerald-600/80">+{stats.totalCredit.toFixed(2)} €</span>
           </div>
      </Card>

      {/* CARTE RETRAITS (Focus Mois) */}
      <Card className="p-4 bg-white border-red-100 flex flex-col justify-between">
           <div>
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-red-700 flex items-center gap-1">
                      <TrendingDown size={14} /> Retraits
                      <MobileTooltip text="Total de l'argent retiré de ce compte ce mois-ci." iconSize={12} widthClass="w-48" />
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase">Ce mois</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">-{stats.monthDebit.toFixed(2)} €</span>
           </div>

           {/* Info Total Historique */}
           <div className="mt-3 bg-red-50/50 rounded-lg p-2 flex items-center justify-between border border-red-100/50">
              <span className="text-[10px] font-medium text-red-800/70 flex items-center gap-1">
                  <Calendar size={10} /> Total Historique
                   <MobileTooltip text="Cumul de tous les retraits depuis la création." iconSize={12} widthClass="w-48" />
              </span>
              <span className="text-xs font-bold text-red-600/80">-{stats.totalDebit.toFixed(2)} €</span>
           </div>
      </Card>
    </div>
  );
};

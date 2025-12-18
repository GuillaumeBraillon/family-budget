
import React from 'react';
// Fix: Removed non-existent 'Sum' icon and unused icons from lucide-react
import { Users, Wallet, Check, TrendingUp } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Person, Account } from '../../../types';

interface DetailedAnalysisProps {
  stats: any;
  people: Person[];
  accounts: Account[];
}

/**
 * Section d'analyse détaillée.
 * Affiche le bilan financier par personne et le total global de la période.
 */
export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ stats, people, accounts }) => {
  
  const hasDiff = (paid: number, planned: number) => Math.abs(paid - planned) > 0.01;

  /**
   * Calcule et affiche l'écart de manière intuitive.
   * Pour une dépense : payer MOINS est positif (Vert).
   * Pour un revenu : gagner PLUS est positif (Vert).
   */
  const renderVariance = (paid: number, planned: number, isExpense: boolean) => {
    const rawDiff = paid - planned;
    if (Math.abs(rawDiff) <= 0.01) return null;

    // Pour une dépense, si paid > planned, c'est un dépassement (négatif pour le budget)
    // Pour un revenu, si paid > planned, c'est un gain (positif pour le budget)
    const budgetImpact = isExpense ? -rawDiff : rawDiff;
    const isGood = budgetImpact > 0;
    const sign = isGood ? '+' : '';

    return (
      <span className={`text-[9px] font-bold px-1 rounded ${isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
        {sign}{budgetImpact.toFixed(2)}
      </span>
    );
  };

  // Préparation des données par personne
  const beneficiaryIds = Array.from(new Set([
    ...Object.keys(stats.expByBeneficiary || {}),
    ...Object.keys(stats.incByBeneficiary || {})
  ]));

  const personSummary = beneficiaryIds.map(id => {
    const exp = stats.expByBeneficiary?.[id] || { planned: 0, paid: 0 };
    const inc = stats.incByBeneficiary?.[id] || { planned: 0, paid: 0 };
    const person = people.find(p => p.id === id);
    
    return {
        id,
        name: person?.name || 'Inconnu',
        isChild: person?.isChild,
        income: inc,
        expense: exp,
        netPaid: inc.paid - exp.paid,
        netPlanned: inc.planned - exp.planned
    };
  }).sort((a, b) => b.netPaid - a.netPaid);

  // Totaux globaux
  const totals = personSummary.reduce((acc, p) => ({
    income: acc.income + p.income.paid,
    expense: acc.expense + p.expense.paid,
    net: acc.net + p.netPaid
  }), { income: 0, expense: 0, net: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* BILAN PAR PERSONNE */}
      <Card className="p-4 shadow-sm lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={12}/> Flux de la Période
            </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="text-left font-bold pb-2 uppercase tracking-tighter text-[9px]">Membre</th>
                <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">Revenus</th>
                <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">Dépenses</th>
                <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">Bilan Personnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {personSummary.map((p) => {
                const isPositive = p.netPaid >= 0;
                return (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-2">
                      <span className="font-semibold text-slate-700">{p.name}</span>
                      {p.isChild && <span className="ml-1 text-[8px] bg-indigo-50 text-indigo-500 px-1 rounded font-black uppercase">Enfant</span>}
                    </td>
                    <td className="py-3 text-right">
                      <div className="font-bold text-emerald-600">{p.income.paid.toFixed(2)} €</div>
                      {hasDiff(p.income.paid, p.income.planned) && (
                        <div className="flex justify-end items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-slate-300 line-through">{p.income.planned.toFixed(2)}</span>
                            {renderVariance(p.income.paid, p.income.planned, false)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="font-bold text-slate-800">{p.expense.paid.toFixed(2)} €</div>
                      {hasDiff(p.expense.paid, p.expense.planned) && (
                        <div className="flex justify-end items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-slate-300 line-through">{p.expense.planned.toFixed(2)}</span>
                            {renderVariance(p.expense.paid, p.expense.planned, true)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-black text-sm ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {isPositive ? '+' : ''}{p.netPaid.toFixed(2)} €
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* LIGNE DE TOTAL GLOBAL */}
            <tfoot>
              <tr className="bg-slate-900 text-white border-t-2 border-indigo-500">
                <td className="py-3 px-3 rounded-l-lg font-black uppercase text-[10px] flex items-center gap-2">
                   <TrendingUp size={14} className="text-indigo-400" /> Total Période
                </td>
                <td className="py-3 text-right font-bold text-emerald-400">{totals.income.toFixed(2)} €</td>
                <td className="py-3 text-right font-bold text-slate-300">{totals.expense.toFixed(2)} €</td>
                <td className="py-3 text-right px-3 rounded-r-lg">
                   <div className={`font-black text-sm ${totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totals.net >= 0 ? '+' : ''}{totals.net.toFixed(2)} €
                   </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* PAR COMPTE */}
      <Card className="p-4 shadow-sm relative overflow-hidden">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Wallet size={12}/> État des Comptes
        </h3>
        <div className="space-y-4 relative z-10 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {(!stats.byAccount || Object.keys(stats.byAccount).length === 0) && (
            <p className="text-xs text-slate-400 italic py-4 text-center">Aucune donnée bancaire.</p>
          )}
          {Object.entries(stats.byAccount || {}).map(([account_id, s]: [string, any]) => {
            const account = accounts.find(a => a.id === account_id);
            const displayName = account ? account.name : 'Compte Inconnu';
            return (
              <div key={account_id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-700 truncate pr-2 text-xs">
                        {displayName}
                    </span>
                    <div className="text-right">
                        <span className="font-bold text-slate-900 text-xs">{s.paid.toFixed(2)} €</span>
                        {hasDiff(s.paid, s.planned) && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                <span className="text-[9px] text-slate-300 line-through">{s.planned.toFixed(2)}</span>
                                {renderVariance(s.paid, s.planned, s.paid > s.planned)}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                    {s.remaining !== 0 ? (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50">
                          ATTENTE : {s.remaining.toFixed(2)} €
                        </span>
                    ) : (
                        s.planned !== 0 && (
                            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                <Check size={10} strokeWidth={3}/> POINTAGE TERMINÉ
                            </span>
                        )
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

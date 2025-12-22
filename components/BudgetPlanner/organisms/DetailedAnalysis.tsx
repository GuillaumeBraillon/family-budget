
import React from 'react';
import { Users, Wallet, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Person, Account } from '../../../types';
import { MobileTooltip } from '../../ui/MobileTooltip';

interface DetailedAnalysisProps {
  stats: any;
  people: Person[];
  accounts: Account[];
}

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ stats, people, accounts }) => {
  const hasDiff = (paid: number, planned: number) => Math.abs(paid - planned) > 0.01;

  const renderVariance = (paid: number, planned: number, isExpense: boolean) => {
    const rawDiff = paid - planned;
    if (Math.abs(rawDiff) <= 0.01) return null;
    const budgetImpact = isExpense ? -rawDiff : rawDiff;
    const isGood = budgetImpact > 0;
    const sign = isGood ? '+' : '';
    return (
      <span className={`text-[9px] font-bold px-1 rounded ${isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
        {sign}{budgetImpact.toFixed(2)}
      </span>
    );
  };

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

  const totals = personSummary.reduce((acc, p) => ({
    income: acc.income + p.income.paid,
    expense: acc.expense + p.expense.paid,
    net: acc.net + p.netPaid
  }), { income: 0, expense: 0, net: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* TABLEAU PAR BÉNÉFICIAIRE */}
      <Card className="p-4 shadow-sm lg:col-span-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Users size={12}/> Répartition par Bénéficiaire
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="text-left font-bold pb-2 uppercase tracking-tighter text-[9px]">Bénéficiaire</th>
                <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">
                   Revenus <MobileTooltip text="Montants réellement perçus sur la période." iconSize={10} widthClass="w-48" />
                </th>
                <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">
                   Dépenses <MobileTooltip text="Montants réellement payés sur la période." iconSize={10} widthClass="w-48" />
                </th>
                <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">
                   Bilan <MobileTooltip text="Différence entre revenus et dépenses réels." iconSize={10} widthClass="w-48" />
                </th>
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
                        <div className="flex justify-end items-center gap-1 mt-0.5 opacity-60">
                            <span className="text-[9px] text-slate-400 mr-1">Prévu:</span>
                            <span className="text-[9px] text-slate-400 line-through">{p.income.planned.toFixed(2)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="font-bold text-slate-800">{p.expense.paid.toFixed(2)} €</div>
                      {hasDiff(p.expense.paid, p.expense.planned) && (
                        <div className="flex justify-end items-center gap-1 mt-0.5">
                             <span className="text-[9px] text-slate-400 mr-1">Prévu:</span>
                            <span className="text-[9px] text-slate-400 line-through">{p.expense.planned.toFixed(2)}</span>
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
            <tfoot>
              <tr className="bg-slate-900 text-white border-t-2 border-indigo-500">
                <td className="py-3 px-3 rounded-l-lg font-black uppercase text-[10px] flex items-center gap-2">
                   <TrendingUp size={14} className="text-indigo-400" /> Total
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

      {/* LISTE DES COMPTES (FLUX) */}
      <Card className="p-4 shadow-sm relative overflow-hidden">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Wallet size={12}/> Flux par Compte
          <MobileTooltip text="Total des mouvements (Entrées/Sorties) impactant chaque compte sur cette période." iconSize={10} widthClass="w-48" />
        </h3>
        <div className="space-y-4 relative z-10 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {(!stats.byAccount || Object.keys(stats.byAccount).length === 0) && (
            <p className="text-xs text-slate-400 italic py-4 text-center">Aucune donnée bancaire.</p>
          )}
          {Object.entries(stats.byAccount || {}).map(([account_id, s]: [string, any]) => {
            const account = accounts.find(a => a.id === account_id);
            const displayName = account ? account.name : 'Compte Inconnu';
            
            const paid = s.paid || 0;
            const planned = s.planned || 0;
            const remaining = s.remaining || 0;
            const pendingCount = s.pendingCount || 0;

            const projectedTotal = paid + remaining;
            const variance = projectedTotal - planned;
            const hasVariance = Math.abs(variance) > 0.01;
            const isBad = variance > 0.01;

            return (
              <div key={account_id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-700 truncate pr-2 text-xs">{displayName}</span>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[9px] text-slate-400 uppercase font-medium">Flux Total</span>
                            <span className="font-bold text-slate-900 text-xs">{projectedTotal.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                {hasVariance && (
                  <div className={`mt-2 p-2 rounded-lg border flex items-center justify-between gap-2 ${
                      isBad ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                      <div className="flex items-center gap-2">
                           <div className={`p-1.5 rounded-md ${isBad ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {isBad ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                           </div>
                           <div className="flex flex-col">
                               <span className="text-[9px] text-slate-500 font-medium">Prévu initial</span>
                               <span className="text-[10px] font-bold text-slate-700 line-through decoration-slate-400/50">
                                  {planned.toFixed(2)} €
                               </span>
                           </div>
                      </div>
                      <div className={`text-right ${isBad ? 'text-rose-700' : 'text-emerald-700'}`}>
                          <span className="text-[9px] font-black block uppercase tracking-wide">
                              {isBad ? 'Dépassement' : 'Économie'}
                          </span>
                          <span className="text-xs font-bold block">
                              {isBad ? '+' : ''}{Math.abs(variance).toFixed(2)} €
                          </span>
                      </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2 pl-1">
                    {pendingCount > 0 ? (
                        <div className="flex items-center gap-1">
                           <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50">
                             DONT EN ATTENTE : {remaining.toFixed(2)} € <span className="text-amber-800">({pendingCount})</span>
                           </span>
                           <MobileTooltip text={`${pendingCount} opération(s) non pointée(s) incluse(s) dans le total.`} iconSize={10} widthClass="w-48" />
                        </div>
                    ) : (
                        planned !== 0 && (
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
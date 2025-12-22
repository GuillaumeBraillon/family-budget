
import React from 'react';
import { Users, Wallet, ArrowRight } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Person, Account, VariableTransaction } from '../../../types';

interface VariableDetailedAnalysisProps {
  transactions: VariableTransaction[];
  people: Person[];
  accounts: Account[];
}

export const VariableDetailedAnalysis: React.FC<VariableDetailedAnalysisProps> = ({ transactions, people, accounts }) => {
  
  // Group by Person
  const byPerson = people.reduce((acc, p) => {
    const txs = transactions.filter(t => t.beneficiaryId === p.id);
    const expenses = txs.filter(t => t.type !== 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const income = txs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    
    if (expenses > 0 || income > 0) {
        acc.push({ person: p, expenses, income });
    }
    return acc;
  }, [] as { person: Person, expenses: number, income: number }[]);

  // Sort by highest expense
  byPerson.sort((a, b) => b.expenses - a.expenses);

  // Group by Account
  const byAccount = accounts.reduce((acc, a) => {
      const txs = transactions.filter(t => t.accountId === a.id);
      if (txs.length === 0) return acc;
      
      const debit = txs.filter(t => t.type !== 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      const credit = txs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      
      acc.push({ account: a, debit, credit, net: credit - debit });
      return acc;
  }, [] as { account: Account, debit: number, credit: number, net: number }[]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       {/* TABLEAU PAR MEMBRE */}
       <Card className="p-4 shadow-sm lg:col-span-2">
         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
           <Users size={12}/> Répartition par Membre
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                        <th className="text-left font-bold pb-2 uppercase tracking-tighter text-[9px]">Membre</th>
                        <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">Dépenses</th>
                        <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">Revenus</th>
                        <th className="text-right font-bold pb-2 uppercase tracking-tighter text-[9px]">Bilan</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {byPerson.map(({ person, expenses, income }) => (
                        <tr key={person.id} className="group hover:bg-slate-50/50">
                            <td className="py-3 pr-2 font-semibold text-slate-700">
                                {person.name}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-800">
                                {expenses.toFixed(2)} €
                            </td>
                            <td className="py-3 text-right font-bold text-emerald-600">
                                {income > 0 ? `+${income.toFixed(2)} €` : '-'}
                            </td>
                            <td className="py-3 text-right">
                                <span className="font-bold text-indigo-600">{(expenses - income).toFixed(2)} €</span>
                            </td>
                        </tr>
                    ))}
                    {byPerson.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 italic">Aucune donnée sur cette période.</td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
       </Card>

       {/* LISTE PAR COMPTE */}
       <Card className="p-4 shadow-sm">
         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
           <Wallet size={12}/> Flux par Compte
         </h3>
         <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
             {byAccount.map(({ account, debit, credit }) => (
                 <div key={account.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                     <div className="flex justify-between items-start mb-1">
                         <span className="font-semibold text-slate-700 text-xs">{account.name}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-slate-400 flex items-center gap-1">Dépensé <ArrowRight size={10}/></span>
                        <span className="font-bold text-slate-800">{debit.toFixed(2)} €</span>
                     </div>
                     {credit > 0 && (
                         <div className="flex items-center justify-between text-xs mt-1 text-emerald-600">
                            <span className="flex items-center gap-1">Reçu <ArrowRight size={10}/></span>
                            <span className="font-bold">+{credit.toFixed(2)} €</span>
                         </div>
                     )}
                 </div>
             ))}
             {byAccount.length === 0 && (
                 <p className="text-xs text-slate-400 italic py-4 text-center">Aucun mouvement.</p>
             )}
         </div>
       </Card>
    </div>
  );
};


import React, { useMemo } from 'react';
import { PiggyBank, Wallet } from 'lucide-react';
import { Account, SavingsTransaction } from '../../../../types';
import { Card } from '../../../ui/Card';

interface SavingsSummaryCardProps {
  accounts: Account[];
  transactions: SavingsTransaction[];
}

export const SavingsSummaryCard: React.FC<SavingsSummaryCardProps> = ({ accounts, transactions }) => {
  
  // Calcul des soldes d'épargne localement dans le composant
  const savingsBalances: Record<string, number> = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
        const total = transactions
            .filter(t => t.accountId === acc.id)
            .reduce((sum, t) => sum + t.amount, 0);
        balances[acc.id] = total;
    });
    return balances;
  }, [accounts, transactions]);

  const totalSavings = Object.values(savingsBalances).reduce((acc: number, val: number) => acc + val, 0);

  if (accounts.length === 0) return null;

  return (
    <Card className="border-indigo-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <PiggyBank size={24} className="text-indigo-200" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Épargne & Patrimoine</h3>
                    <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">
                        {accounts.length} comptes actifs
                    </p>
                </div>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
                <span className="text-3xl font-bold block tracking-tight">{totalSavings.toFixed(2)} €</span>
                <span className="text-indigo-300 text-xs font-medium uppercase tracking-wider">Solde Total</span>
            </div>
        </div>
        
        <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {accounts.map(acc => {
                    const balance = savingsBalances[acc.id] ?? 0;
                    return (
                        <div key={acc.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Wallet size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-700 text-sm truncate">{acc.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase truncate">{acc.bankName || 'Banque'}</p>
                                </div>
                            </div>
                            <div className="text-right pl-2">
                                <span className="font-bold text-slate-900 block">{balance.toFixed(2)} €</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </Card>
  );
};

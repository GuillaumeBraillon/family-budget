
import React, { useMemo } from 'react';
import { Card } from '../../../ui/Card';
import { Account, AccountType } from '../../../../types';
import { Wallet, PiggyBank, Landmark } from 'lucide-react';

interface WealthSummaryProps {
  accounts: Account[];
}

export const WealthSummary: React.FC<WealthSummaryProps> = ({ accounts }) => {
  const stats = useMemo(() => {
    return accounts.reduce((acc, account) => {
      const balance = account.currentBalance || 0;
      acc.total += balance;
      if (account.type === AccountType.SAVINGS) {
        acc.savings += balance;
      } else {
        acc.checking += balance;
      }
      return acc;
    }, { total: 0, checking: 0, savings: 0 });
  }, [accounts]);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

  return (
    <Card className="bg-slate-900 text-white border-0 shadow-lg overflow-hidden relative mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
        <Landmark size={200} />
      </div>

      <div className="p-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Total Patrimoine */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-1">
            <Landmark size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Patrimoine Total</span>
          </div>
          <div className="text-4xl font-black tracking-tight text-white">
            {formatMoney(stats.total)}
          </div>
        </div>

        {/* Détails (Dispo vs Épargne) */}
        <div className="flex gap-4 md:gap-8 w-full md:w-auto bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
          
          {/* Disponible */}
          <div className="flex-1 md:flex-none flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-lg text-indigo-300">
              <Wallet size={20} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide">Disponible</span>
              <span className="block text-lg font-bold text-indigo-100">{formatMoney(stats.checking)}</span>
            </div>
          </div>

          <div className="w-px bg-white/10 mx-2 hidden md:block"></div>

          {/* Épargne */}
          <div className="flex-1 md:flex-none flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-300">
              <PiggyBank size={20} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide">Épargne</span>
              <span className="block text-lg font-bold text-emerald-100">{formatMoney(stats.savings)}</span>
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
};

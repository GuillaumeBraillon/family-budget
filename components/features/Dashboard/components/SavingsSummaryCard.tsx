
import React, { useMemo } from 'react';
import { PiggyBank, Wallet, CreditCard, Landmark } from 'lucide-react';
import { Account, Transfer, AccountType, PaidItemDetails } from '../../../../types';
import { Card } from '../../../ui/Card';

interface SavingsSummaryCardProps {
  accounts: Account[];
  transfers?: Transfer[];
  paidItems: Record<string, PaidItemDetails>;
}

export const SavingsSummaryCard: React.FC<SavingsSummaryCardProps> = ({ accounts, transfers = [], paidItems = {} }) => {
  
  // Calcul des soldes d'épargne via les transferts ET les opérations directes (intérêts)
  const balances: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    
    // On convertit la map en tableau pour faciliter le filtrage
    const allPaidItems = Object.values(paidItems) as PaidItemDetails[];

    accounts.forEach(acc => {
        if (acc.type === AccountType.SAVINGS) {
            // 1. Virements (Interne)
            let total = transfers.reduce((sum, t) => {
                if (t.destinationAccountId === acc.id) return sum + t.amount;
                if (t.sourceAccountId === acc.id) return sum - t.amount;
                return sum;
            }, 0);

            // 2. Opérations directes (Intérêts, Frais, Apports externes)
            // On prend TOUT ce qui est dans paid_items (donc réel ou marqué comme tel)
            // Et on filtre explicitement isWaiting = false pour être sûr (cas des variables en attente)
            const directOps = allPaidItems.filter(t => t.accountId === acc.id && !t.isWaiting);
            
            total += directOps.reduce((sum, t) => {
                if (t.type === 'INCOME') return sum + t.amount; // Intérêts (+)
                if (t.type === 'EXPENSE') return sum - t.amount; // Frais (-)
                return sum;
            }, 0);

            map[acc.id] = total;
        } else {
            // Pour le courant, on utilise le solde courant (géré dans BalancesView/BDD)
            map[acc.id] = acc.currentBalance;
        }
    });
    return map;
  }, [accounts, transfers, paidItems]);

  const totalWealth = Object.values(balances).reduce((acc: number, val: number) => acc + val, 0);
  const savingsTotal = accounts.filter(a => a.type === AccountType.SAVINGS).reduce((acc, a) => acc + (balances[a.id] || 0), 0);
  const checkingTotal = accounts.filter(a => a.type === AccountType.CHECKING).reduce((acc, a) => acc + (balances[a.id] || 0), 0);

  if (accounts.length === 0) return null;

  // Tri : Comptes courants d'abord, puis épargne
  const sortedAccounts = [...accounts].sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === AccountType.CHECKING ? -1 : 1;
  });

  return (
    <Card className="border-indigo-100 shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                    <Landmark size={28} className="text-indigo-200" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Patrimoine Global</h3>
                    <div className="flex gap-3 text-xs font-medium text-indigo-200 mt-0.5">
                        <span className="flex items-center gap-1"><CreditCard size={10}/> Dispo: {checkingTotal.toFixed(0)}€</span>
                        <span className="w-px h-3 bg-indigo-400/30"></span>
                        <span className="flex items-center gap-1"><PiggyBank size={10}/> Épargne: {savingsTotal.toFixed(0)}€</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 md:mt-0 text-right">
                <span className="text-3xl font-black block tracking-tight">{totalWealth.toFixed(2)} €</span>
                <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Total Consolidé</span>
            </div>
        </div>
        
        <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedAccounts.map(acc => {
                    const balance = balances[acc.id] ?? 0;
                    const isSavings = acc.type === AccountType.SAVINGS;
                    
                    return (
                        <div key={acc.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${isSavings ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {isSavings ? <PiggyBank size={18} /> : <Wallet size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-700 text-sm truncate">{acc.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase truncate flex items-center gap-1">
                                        {acc.bankName || 'Banque'}
                                        {acc.isJoint && <span className="bg-purple-100 text-purple-700 px-1 rounded-[2px] text-[8px]">JOINT</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right pl-2">
                                <span className={`font-bold block ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{balance.toFixed(2)} €</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </Card>
  );
};

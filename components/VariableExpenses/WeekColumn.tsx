
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, CreditCard, ShoppingBag, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { VariableTransaction, WeeklyBudget, Account } from '../../types';
import { MobileTooltip } from '../ui/MobileTooltip';

interface WeekColumnProps {
  weekData: WeeklyBudget;
  transactions: VariableTransaction[];
  accounts: Account[];
  categories: string[];
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  currentYear: number;
  currentMonth: number;
}

export const WeekColumn: React.FC<WeekColumnProps> = ({ 
  weekData, transactions, accounts, categories, onAddTransaction, onDeleteTransaction, currentYear, currentMonth
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newAccount, setNewAccount] = useState(accounts[0]?.id || '');

  const totalSpent = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);
  
  // Calcul de la date par défaut pour l'ajout (Premier jour de la période, ou aujourd'hui si inclus)
  const defaultDate = useMemo(() => {
    const today = new Date();
    const isCurrentPeriod = today.getDate() >= weekData.startDate && today.getDate() <= weekData.endDate 
                         && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    if (isCurrentPeriod) {
        return today.toISOString().split('T')[0];
    }
    
    // Sinon, on prend le premier jour de la période
    const d = new Date(currentYear, currentMonth, weekData.startDate);
    // Ajustement timezone basic pour éviter le décalage
    const offset = d.getTimezoneOffset();
    const adjusted = new Date(d.getTime() - (offset*60*1000));
    return adjusted.toISOString().split('T')[0];
  }, [currentYear, currentMonth, weekData]);

  const [txDate, setTxDate] = useState(defaultDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAmount || !newAccount) return;

    onAddTransaction({
        id: `var_${Date.now()}`,
        date: txDate,
        label: newLabel,
        amount: parseFloat(newAmount),
        accountId: newAccount,
        category: 'Variable',
        type: 'EXPENSE'
    });

    setNewLabel('');
    setNewAmount('');
    setIsAdding(false);
  };

  const getAccountBadge = (accountId: string) => {
      const acc = accounts.find(a => a.id === accountId);
      if (!acc) return null;
      
      if (acc.isJoint) {
          return <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold uppercase" title={acc.name}>Joint</span>;
      }
      return <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 rounded font-bold uppercase" title={acc.name}>Perso</span>;
  };

  return (
    <div className="flex-shrink-0 w-full md:w-80 space-y-3">
        {/* EN-TÊTE SEMAINE */}
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg flex justify-between items-center">
            <div>
                <h3 className="font-bold text-sm">Semaine {weekData.weekNumber}</h3>
                <p className="text-[10px] text-slate-400">Du {weekData.startDate} au {weekData.endDate}</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-medium text-slate-400 uppercase">Dépenses</p>
                <p className="font-bold text-lg">{totalSpent.toFixed(2)} €</p>
            </div>
        </div>

        {/* LISTE */}
        <div className="space-y-2 min-h-[200px]">
            {transactions.map(tx => (
                <div key={tx.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1 hover:border-indigo-300 transition-colors group">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 text-sm leading-tight">{tx.label}</span>
                        <span className="font-bold text-slate-900 text-sm">{tx.amount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <div className="flex gap-2">
                            {getAccountBadge(tx.accountId)}
                            <span className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}</span>
                        </div>
                        <button onClick={() => onDeleteTransaction(tx.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
            
            {/* FORMULAIRE D'AJOUT */}
            {isAdding ? (
                <Card className="p-3 border-2 border-indigo-100 bg-indigo-50/30 animate-in zoom-in-95">
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Libellé (ex: Courses...)" 
                            className="w-full p-2 text-sm border border-slate-300 rounded bg-white"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input 
                                type="number" step="0.01"
                                placeholder="0.00 €" 
                                className="w-24 p-2 text-sm border border-slate-300 rounded bg-white font-bold"
                                value={newAmount}
                                onChange={e => setNewAmount(e.target.value)}
                            />
                            <select 
                                className="flex-1 p-2 text-sm border border-slate-300 rounded bg-white text-slate-700"
                                value={newAccount}
                                onChange={e => setNewAccount(e.target.value)}
                            >
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                         <input 
                            type="date"
                            className="w-full p-1 text-xs border border-slate-200 rounded bg-white text-slate-500 mb-1"
                            value={txDate}
                            onChange={e => setTxDate(e.target.value)}
                        />
                        <div className="flex gap-2 pt-1">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700">Ajouter</button>
                            <button type="button" onClick={() => setIsAdding(false)} className="px-3 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-50">Annuler</button>
                        </div>
                    </form>
                </Card>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                    <Plus size={16} /> Ajouter une dépense
                </button>
            )}
        </div>
    </div>
  );
};

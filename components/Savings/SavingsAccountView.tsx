
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Download, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { Account, SavingsTransaction } from '../../types';
import { Card } from '../ui/Card';
import { EditTransactionModal } from './EditTransactionModal';

interface SavingsAccountViewProps {
  account: Account;
  transactions: SavingsTransaction[];
  availableLabels?: string[];
  onAddTransaction: (t: SavingsTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const SavingsAccountView: React.FC<SavingsAccountViewProps> = ({ account, transactions, availableLabels, onAddTransaction, onDeleteTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<SavingsTransaction | null>(null);

  // Calcul de l'historique avec solde progressif
  const history = useMemo(() => {
    // 1. Trier par date croissante pour calculer le solde
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0; 
    
    const withBalance = sorted.map(tx => {
      runningBalance += tx.amount;
      return { ...tx, balanceAfter: runningBalance };
    });

    // 2. Inverser pour l'affichage (Plus récent en haut)
    return withBalance.reverse();
  }, [transactions]);

  // Calculs statistiques
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.reduce((acc, t) => {
        const d = new Date(t.date);
        const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

        // Totaux globaux
        if (t.amount > 0) acc.totalCredit += t.amount;
        else acc.totalDebit += Math.abs(t.amount); 

        // Totaux du mois
        if (isThisMonth) {
            if (t.amount > 0) acc.monthCredit += t.amount;
            else acc.monthDebit += Math.abs(t.amount);
            acc.monthOpsCount++;
        }

        return acc;
    }, { totalCredit: 0, totalDebit: 0, monthCredit: 0, monthDebit: 0, monthOpsCount: 0 });
  }, [transactions]);

  const totalBalance = history.length > 0 ? history[0].balanceAfter : 0;
  const monthNet = stats.monthCredit - stats.monthDebit;

  const handleEdit = (tx: SavingsTransaction) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingTx(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARTE SOLDE ACTUEL */}
        <Card className="p-4 bg-white border-slate-200 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-5">
                <Wallet size={64} className="text-slate-900" />
            </div>
            <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={14} className="text-indigo-600"/> Solde Actuel
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-2 block">{totalBalance.toFixed(2)} €</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Variation ce mois</span>
                    <span className={`text-xs font-bold ${monthNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {monthNet > 0 ? '+' : ''}{monthNet.toFixed(2)} €
                    </span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                    {stats.monthOpsCount} ops ce mois
                </span>
            </div>
        </Card>

        {/* CARTE VERSEMENTS (Focus Mois) */}
        <Card className="p-4 bg-white border-emerald-100 flex flex-col justify-between">
             <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                        <TrendingUp size={14} /> Versements
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold uppercase">Ce mois</span>
                </div>
                <span className="text-2xl font-bold text-slate-800">+{stats.monthCredit.toFixed(2)} €</span>
             </div>
             
             {/* Info Total Historique */}
             <div className="mt-3 bg-emerald-50/50 rounded-lg p-2 flex items-center justify-between border border-emerald-100/50">
                <span className="text-[10px] font-medium text-emerald-800/70 flex items-center gap-1">
                    <Calendar size={10} /> Total Historique
                </span>
                <span className="text-xs font-bold text-emerald-600/80">+{stats.totalCredit.toFixed(2)} €</span>
             </div>
        </Card>

        {/* CARTE RETRAITS (Focus Mois) */}
        <Card className="p-4 bg-white border-red-100 flex flex-col justify-between">
             <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-red-700 flex items-center gap-2">
                        <TrendingDown size={14} /> Retraits
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase">Ce mois</span>
                </div>
                <span className="text-2xl font-bold text-slate-800">-{stats.monthDebit.toFixed(2)} €</span>
             </div>

             {/* Info Total Historique */}
             <div className="mt-3 bg-red-50/50 rounded-lg p-2 flex items-center justify-between border border-red-100/50">
                <span className="text-[10px] font-medium text-red-800/70 flex items-center gap-1">
                    <Calendar size={10} /> Total Historique
                </span>
                <span className="text-xs font-bold text-red-600/80">-{stats.totalDebit.toFixed(2)} €</span>
             </div>
        </Card>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             Historique
             <span className="text-xs font-normal text-slate-500 bg-white border px-2 py-0.5 rounded-full">{history.length} ops</span>
           </h3>
           <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Exporter CSV">
                 <Download size={18} />
              </button>
              <button 
                onClick={openNew}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={16} /> Ajouter une ligne
              </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 w-32">Date</th>
                        <th className="px-6 py-3">Libellé</th>
                        <th className="px-6 py-3 text-right text-red-600 w-32">Débit</th>
                        <th className="px-6 py-3 text-right text-emerald-600 w-32">Crédit</th>
                        <th className="px-6 py-3 text-right bg-slate-100/50 w-32">Solde</th>
                        <th className="px-4 py-3 w-20 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {history.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-3 font-mono text-slate-600">
                                {new Date(tx.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-3 font-medium text-slate-800">
                                {tx.label}
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-red-600">
                                {tx.amount < 0 ? tx.amount.toFixed(2) + ' €' : '-'}
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-emerald-600">
                                {tx.amount > 0 ? '+' + tx.amount.toFixed(2) + ' €' : '-'}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-slate-800 bg-slate-50/30 font-mono">
                                {tx.balanceAfter.toFixed(2)} €
                            </td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(tx)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => onDeleteTransaction(tx.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                Aucune transaction enregistrée pour ce compte.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <EditTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transaction={editingTx}
        accountId={account.id}
        suggestions={availableLabels}
        onSave={onAddTransaction}
      />
    </div>
  );
};
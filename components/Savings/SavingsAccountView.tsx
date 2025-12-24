
import React, { useMemo, useState } from 'react';
import { Account, SavingsTransaction, SavedLabel } from '../../types';
import { EditTransactionModal } from './EditTransactionModal';
import { SavingsKPIs } from './molecules/SavingsKPIs';
import { SavingsHistoryTable } from './molecules/SavingsHistoryTable';

interface SavingsAccountViewProps {
  account: Account;
  transactions: SavingsTransaction[];
  availableLabels?: string[];
  savedLabels?: SavedLabel[];
  onAddTransaction: (t: SavingsTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const SavingsAccountView: React.FC<SavingsAccountViewProps> = ({ account, transactions, availableLabels, savedLabels, onAddTransaction, onDeleteTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<SavingsTransaction | null>(null);

  // Calcul de l'historique avec solde progressif
  const history = useMemo(() => {
    // 1. Trier par date croissante pour calculer le solde
    const sorted = [...transactions].sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        // Si même date (souvent YYYY-MM-DD), on trie par ID (qui contient le timestamp) pour la précision
        return a.id.localeCompare(b.id);
    });
    
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
      
      {/* KPI CARDS */}
      <SavingsKPIs 
        totalBalance={totalBalance}
        monthNet={monthNet}
        stats={stats}
      />

      {/* HISTORY TABLE */}
      <SavingsHistoryTable 
        history={history}
        onAddTransaction={openNew}
        onEditTransaction={handleEdit}
        onDeleteTransaction={onDeleteTransaction}
      />

      {/* EDIT MODAL */}
      <EditTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transaction={editingTx}
        accountId={account.id}
        suggestions={availableLabels}
        savedLabels={savedLabels}
        onSave={onAddTransaction}
        onDelete={onDeleteTransaction}
      />
    </div>
  );
};

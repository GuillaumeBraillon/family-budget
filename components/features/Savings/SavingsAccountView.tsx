
import React, { useMemo, useState } from 'react';
import { Account, Transfer, SavedLabel } from '../../../types';
import { SavingsKPIs } from './molecules/SavingsKPIs';
import { SavingsHistoryTable } from './molecules/SavingsHistoryTable';
import { VariableTransactionForm } from '../Operations/components/VariableTransactionForm';

interface SavingsAccountViewProps {
  account: Account;
  transfers: Transfer[];
  allAccounts: Account[];
  savedLabels?: SavedLabel[];
  onUpsertTransfer: (t: Transfer) => void;
  onDeleteTransfer: (id: string) => void;
}

export const SavingsAccountView: React.FC<SavingsAccountViewProps> = ({ account, transfers, allAccounts, savedLabels, onUpsertTransfer, onDeleteTransfer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null); // Hack: on passe un faux VariableTransaction au form
  const [editingTransferReal, setEditingTransferReal] = useState<Transfer | null>(null);

  // Conversion Transfer -> HistoryItem avec signe +/-
  const history = useMemo(() => {
    // 1. Trier chronologiquement croissant pour le calcul du solde
    const sorted = [...transfers].sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
    });
    
    let runningBalance = 0; 
    
    const withBalance = sorted.map(tx => {
      // Si ce compte est la destination, c'est un crédit (+). Sinon c'est un débit (-).
      const isCredit = tx.destinationAccountId === account.id;
      const signedAmount = isCredit ? tx.amount : -tx.amount;
      
      runningBalance += signedAmount;
      
      return { 
          ...tx, 
          amount: signedAmount, // Montant signé pour l'affichage
          balanceAfter: runningBalance 
      };
    });

    // 2. Inverser pour affichage décroissant
    return withBalance.reverse();
  }, [transfers, account.id]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return history.reduce((acc, t) => {
        const d = new Date(t.date);
        const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

        if (t.amount > 0) acc.totalCredit += t.amount;
        else acc.totalDebit += Math.abs(t.amount); 

        if (isThisMonth) {
            if (t.amount > 0) acc.monthCredit += t.amount;
            else acc.monthDebit += Math.abs(t.amount);
            acc.monthOpsCount++;
        }

        return acc;
    }, { totalCredit: 0, totalDebit: 0, monthCredit: 0, monthDebit: 0, monthOpsCount: 0 });
  }, [history]);

  const totalBalance = history.length > 0 ? history[0].balanceAfter : 0;
  const monthNet = stats.monthCredit - stats.monthDebit;

  const handleEdit = (tx: any) => {
    // Retrouver le transfert original non signé
    const original = transfers.find(t => t.id === tx.id);
    if (!original) return;

    setEditingTransferReal(original);
    
    // Mapping pour le formulaire générique
    setEditingTx({
        id: original.id,
        date: original.date,
        label: original.label,
        amount: original.amount,
        accountId: original.sourceAccountId,
        type: 'EXPENSE',
        category: 'Virement Interne',
        isWaiting: false,
        isExtra: false,
        comments: original.destinationAccountId
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <SavingsKPIs 
        totalBalance={totalBalance}
        monthNet={monthNet}
        stats={stats}
      />

      <SavingsHistoryTable 
        history={history}
        onAddTransaction={() => { setEditingTransferReal(null); setEditingTx(null); setIsModalOpen(true); }}
        onEditTransaction={handleEdit}
      />

      <VariableTransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        accounts={allAccounts} 
        categories={[]} 
        people={[]} 
        onAddTransaction={() => {}}
        onUpsertTransfer={onUpsertTransfer}
        onDeleteTransaction={() => {
            if (editingTransferReal) onDeleteTransfer(editingTransferReal.id);
        }}
        defaultDate={new Date().toISOString().split('T')[0]} 
        savedLabels={savedLabels}
        editingTransaction={editingTx}
        initialMode="TRANSFER"
        lockMode={true}
      />
    </div>
  );
};

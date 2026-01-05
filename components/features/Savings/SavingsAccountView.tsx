
import React, { useMemo, useState } from 'react';
import { Account, Transfer, SavedLabel, VariableTransaction, CategoryDef } from '../../../types';
import { SavingsHistoryTable } from './molecules/SavingsHistoryTable';
import { VariableTransactionForm } from '../Operations/components/VariableTransactionForm';
import { ListSorter, SortOrder } from '../../ui/molecules/ListSorter';

interface SavingsAccountViewProps {
  account: Account;
  transfers: Transfer[];
  directOps: VariableTransaction[];
  history: any[]; // Historique calculé passé par le parent
  allAccounts: Account[];
  categories: CategoryDef[];
  savedLabels?: SavedLabel[];
  onUpsertTransfer: (t: Transfer) => void;
  onUpsertTransaction: (t: VariableTransaction) => void;
  onDeleteTransfer: (id: string) => void;
}

export const SavingsAccountView: React.FC<SavingsAccountViewProps> = ({ 
  account, transfers, directOps, history, allAccounts, categories, savedLabels, 
  onUpsertTransfer, onUpsertTransaction, onDeleteTransfer 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editingTransferReal, setEditingTransferReal] = useState<Transfer | null>(null);
  const [initialFormMode, setInitialFormMode] = useState<'STANDARD' | 'TRANSFER'>('TRANSFER');

  // Tri
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Tri pour l'affichage (L'utilisateur peut changer l'ordre sans casser les soldes calculés qui sont dans 'history')
  const displayedHistory = useMemo(() => {
      return [...history].sort((a, b) => {
          let res = 0;
          if (sortKey === 'amount') {
              res = Math.abs(a.amount) - Math.abs(b.amount);
          } else if (sortKey === 'label') {
              res = a.label.localeCompare(b.label);
          } else {
              // Date
              const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
              if (timeDiff !== 0) res = timeDiff;
              else res = (a.createdAt || '').localeCompare(b.createdAt || '');
          }
          return sortOrder === 'asc' ? res : -res;
      });
  }, [history, sortKey, sortOrder]);

  const handleAdd = () => {
      setEditingTransferReal(null);
      setEditingTx(null);
      setInitialFormMode('TRANSFER'); // Par défaut
      setIsModalOpen(true);
  };

  const handleEdit = (tx: any) => {
    if (tx.source === 'TRANSFER') {
        const original = transfers.find(t => t.id === tx.id);
        if (original) {
            setEditingTransferReal(original);
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
            setInitialFormMode('TRANSFER');
            setIsModalOpen(true);
        }
    } else {
        // Opération directe (Intérêts)
        const original = directOps.find(t => t.id === tx.id);
        if (original) {
            setEditingTransferReal(null);
            setEditingTx(original);
            setInitialFormMode('STANDARD');
            setIsModalOpen(true);
        }
    }
  };

  const sortOptions = [
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Montant' },
      { key: 'label', label: 'Libellé' }
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex justify-end">
          <ListSorter 
            options={sortOptions} 
            currentSort={sortKey} 
            currentOrder={sortOrder} 
            onSortChange={(k, o) => { setSortKey(k); setSortOrder(o); }} 
          />
      </div>

      <SavingsHistoryTable 
        history={displayedHistory as any[]}
        onAddTransaction={handleAdd}
        onEditTransaction={handleEdit}
      />

      <VariableTransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        accounts={[account, ...allAccounts.filter(a => a.id !== account.id)]} // Mettre le compte courant en premier pour l'UX
        categories={categories} 
        people={[]} 
        onAddTransaction={onUpsertTransaction}
        onUpsertTransfer={onUpsertTransfer}
        onDeleteTransaction={() => {
            // Suppression générique
            if (editingTransferReal) onDeleteTransfer(editingTransferReal.id);
            else if (editingTx) onDeleteTransfer(editingTx.id); 
        }}
        defaultDate={new Date().toISOString().split('T')[0]} 
        savedLabels={savedLabels}
        editingTransaction={editingTx}
        initialMode={initialFormMode}
        lockMode={false} // Autoriser le changement de mode pour choisir "Intérêts"
      />
    </div>
  );
};

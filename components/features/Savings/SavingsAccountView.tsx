
import React, { useMemo, useState } from 'react';
import { Account, Transfer, SavedLabel, VariableTransaction, CategoryDef } from '../../../types';
import { SavingsKPIs } from './molecules/SavingsKPIs';
import { SavingsHistoryTable } from './molecules/SavingsHistoryTable';
import { VariableTransactionForm } from '../Operations/components/VariableTransactionForm';
import { ListSorter, SortOrder } from '../../ui/molecules/ListSorter';

interface SavingsAccountViewProps {
  account: Account;
  transfers: Transfer[];
  directOps: VariableTransaction[];
  allAccounts: Account[];
  categories: CategoryDef[];
  savedLabels?: SavedLabel[];
  onUpsertTransfer: (t: Transfer) => void;
  onUpsertTransaction: (t: VariableTransaction) => void;
  onDeleteTransfer: (id: string) => void;
}

export const SavingsAccountView: React.FC<SavingsAccountViewProps> = ({ account, transfers, directOps, allAccounts, categories, savedLabels, onUpsertTransfer, onUpsertTransaction, onDeleteTransfer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editingTransferReal, setEditingTransferReal] = useState<Transfer | null>(null);
  const [initialFormMode, setInitialFormMode] = useState<'STANDARD' | 'TRANSFER'>('TRANSFER');

  // Tri
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Conversion Transfer & DirectOps -> HistoryItem
  // Note: On calcule d'abord l'historique complet chronologique pour avoir les bons soldes
  const historyWithBalances = useMemo(() => {
    // 1. Unification des flux (Virements + Opérations directes comme les intérêts)
    const combinedOps = [
        ...transfers.map(t => {
            const isCredit = t.destinationAccountId === account.id;
            return {
                id: t.id,
                date: t.date,
                label: t.label,
                amount: isCredit ? t.amount : -t.amount, // Signé
                source: 'TRANSFER',
                createdAt: t.createdAt
            };
        }),
        ...directOps.map(op => {
            const isCredit = op.type === 'INCOME';
            return {
                id: op.id,
                date: op.date,
                label: op.label,
                amount: isCredit ? op.amount : -op.amount, // Signé
                source: 'DIRECT',
                createdAt: op.id // Fallback
            };
        })
    ];

    // 2. Tri chronologique croissant pour le calcul du solde
    const chronological = combinedOps.sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
    
    let runningBalance = 0; 
    
    return chronological.map(tx => {
      runningBalance += tx.amount;
      return { 
          ...tx, 
          balanceAfter: runningBalance,
          // Re-map pour l'interface de DataListRow qui attend des props spécifiques
          sourceAccountId: '', // Non utilisé en affichage direct
          destinationAccountId: ''
      };
    });
  }, [transfers, directOps, account.id]);

  // 3. Tri pour l'affichage (L'utilisateur peut changer l'ordre sans casser les soldes calculés)
  const displayedHistory = useMemo(() => {
      return [...historyWithBalances].sort((a, b) => {
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
  }, [historyWithBalances, sortKey, sortOrder]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return historyWithBalances.reduce((acc, t) => {
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
  }, [historyWithBalances]);

  const totalBalance = historyWithBalances.length > 0 ? historyWithBalances[historyWithBalances.length - 1].balanceAfter : 0;
  const monthNet = stats.monthCredit - stats.monthDebit;

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
      <SavingsKPIs 
        totalBalance={totalBalance}
        monthNet={monthNet}
        stats={stats}
      />

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

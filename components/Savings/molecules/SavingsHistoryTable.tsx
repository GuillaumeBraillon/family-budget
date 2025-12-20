
import React from 'react';
import { SavingsTransaction } from '../../../types';
import { DataList, DataListRow } from '../../molecules/DataList';

interface HistoryItem extends SavingsTransaction {
  balanceAfter: number;
}

interface SavingsHistoryTableProps {
  history: HistoryItem[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: SavingsTransaction) => void;
  onDeleteTransaction?: (id: string) => void; // Optionnel car géré dans la modale
}

export const SavingsHistoryTable: React.FC<SavingsHistoryTableProps> = ({ 
  history, 
  onAddTransaction, 
  onEditTransaction,
}) => {
  return (
    <DataList
        title="Historique"
        count={history.length}
        onAdd={onAddTransaction}
        addButtonLabel="Ajouter une ligne"
        emptyMessage="Aucune transaction enregistrée pour ce compte."
    >
        {history.map((tx) => (
             <DataListRow
                key={tx.id}
                date={{ day: new Date(tx.date).getDate(), month: new Date(tx.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase() }}
                label={tx.label}
                amount={tx.amount}
                isIncome={tx.amount > 0}
                onClick={() => onEditTransaction(tx)}
                badge={
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-mono">
                        Solde: {tx.balanceAfter.toFixed(2)}€
                    </span>
                }
             />
        ))}
    </DataList>
  );
};

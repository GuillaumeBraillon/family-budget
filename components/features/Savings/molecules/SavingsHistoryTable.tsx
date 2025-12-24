
import React from 'react';
import { Transfer } from '../../../../types';
import { DataList } from '../../../ui/molecules/DataList';
import { DataListRow } from '../../../ui/molecules/DataListRow';

interface HistoryItem extends Transfer {
  balanceAfter: number;
}

interface SavingsHistoryTableProps {
  history: HistoryItem[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transfer) => void;
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
                amount={Math.abs(tx.amount)} // Affichage valeur absolue, le signe est géré par isIncome
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


import React from 'react';
import { VariableTransaction, Account, Person } from '../../../types';
import { DataList, DataListRow } from '../../molecules/DataList';

interface VariableOperationsListProps {
  transactions: VariableTransaction[];
  accounts: Account[];
  people: Person[];
  onDeleteTransaction?: (id: string) => void; // Optionnel ici car géré dans le form d'édition
  onEditTransaction: (tx: VariableTransaction) => void;
  monthShort: string;
  onAddClick?: () => void; // Pour déclencher l'ouverture du formulaire d'ajout
}

export const VariableOperationsList: React.FC<VariableOperationsListProps> = ({ 
  transactions, accounts, people, onEditTransaction, monthShort, onAddClick
}) => {
  return (
    <DataList 
        title="Détail des opérations" 
        count={transactions.length}
        onAdd={onAddClick}
        addButtonLabel="Ajouter une opération"
        emptyMessage="Aucune dépense variable enregistrée pour cette période."
    >
        {transactions.map(item => {
            const account = accounts.find(a => a.id === item.accountId);
            const person = people.find(p => p.id === item.beneficiaryId);
            const date = new Date(item.date);
            const day = date.getDate();
            const isIncome = item.type === 'INCOME';
            
            return (
                <DataListRow
                    key={item.id}
                    date={{ day, month: monthShort }}
                    label={item.label}
                    amount={item.amount}
                    isIncome={isIncome}
                    category={item.category}
                    subCategory={item.subCategory}
                    beneficiary={person?.name}
                    isChild={person?.isChild}
                    accountName={account?.name}
                    onClick={() => onEditTransaction(item)}
                />
            );
        })}
    </DataList>
  );
};

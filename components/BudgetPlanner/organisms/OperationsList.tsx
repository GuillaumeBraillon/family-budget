
import React from 'react';
import { PlannedItem, Person, Account } from '../../../types';
import { DataList, DataListRow } from '../../molecules/DataList';

interface OperationsListProps {
  items: PlannedItem[];
  monthShort: string;
  people: Person[];
  accounts: Account[];
  currentDate: Date;
  onItemClick: (item: PlannedItem) => void;
}

export const OperationsList: React.FC<OperationsListProps> = ({
  items,
  monthShort,
  people,
  accounts,
  currentDate,
  onItemClick
}) => {
  
  const getExtraProgress = (item: PlannedItem) => {
    if (!item.isExtra || !item.startMonth || !item.endMonth) return null;
    const start = new Date(item.startMonth + '-01');
    const end = new Date(item.endMonth + '-01');
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const currentMonthIndex = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth()) + 1;
    
    return {
      text: `${currentMonthIndex}/${totalMonths}`,
      isLast: currentMonthIndex === totalMonths
    };
  };

  return (
    <DataList 
        title="Détail des opérations" 
        count={items.length} 
        emptyMessage="Aucune opération prévue pour cette période."
    >
        {items.map(item => {
             const progress = getExtraProgress(item);
             const person = people.find(p => p.id === item.beneficiaryId);
             const account = accounts.find(a => a.id === item.accountId);
             
             return (
                <DataListRow
                    key={item.instanceId}
                    date={{ day: item.day, month: monthShort }}
                    label={item.label}
                    amount={item.amount}
                    originalAmount={item.originalAmount}
                    isIncome={item.type === 'INCOME'}
                    category={item.category}
                    subCategory={item.subCategory}
                    beneficiary={person?.name}
                    isChild={person?.isChild}
                    accountName={account?.name}
                    isPaid={!!item.isPaid}
                    onClick={() => onItemClick(item)}
                    badge={item.isExtra && progress ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          progress.isLast ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          Temp {progress.text}
                        </span>
                    ) : null}
                />
             );
        })}
    </DataList>
  );
};

import React from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '../../ui/Card';
import { OperationRow } from '../molecules/OperationRow';
import { PlannedItem, Person, Account } from '../../../types';

interface OperationsListProps {
  items: PlannedItem[];
  monthShort: string;
  people: Person[];
  accounts: Account[];
  currentDate: Date;
  onItemClick: (item: PlannedItem) => void;
}

/**
 * Composant affichant la liste filtrée des opérations pour une période donnée.
 */
export const OperationsList: React.FC<OperationsListProps> = ({
  items,
  monthShort,
  people,
  accounts,
  currentDate,
  onItemClick
}) => {
  /**
   * Calcule la progression (ex: 2/12) pour les dépenses configurées avec une durée limitée.
   */
  const getExtraProgress = (item: PlannedItem) => {
    if (!item.isExtra || !item.startMonth || !item.endMonth) return null;
    const start = new Date(item.startMonth + '-01');
    const end = new Date(item.endMonth + '-01');
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Calcul de la différence en mois
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const currentMonthIndex = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth()) + 1;
    
    return {
      text: `${currentMonthIndex}/${totalMonths}`,
      isLast: currentMonthIndex === totalMonths
    };
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Détail des opérations</h3>
        <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-500 font-medium">
          {items.length} éléments
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map(item => (
          <OperationRow
            key={item.instanceId}
            item={item}
            monthShort={monthShort}
            person={people.find(p => p.id === item.beneficiaryId)}
            account={accounts.find(a => a.id === item.accountId)}
            extraProgress={getExtraProgress(item)}
            onClick={() => onItemClick(item)}
          />
        ))}
        {items.length === 0 && (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Calendar size={48} className="mb-4 text-slate-200" />
            <p className="text-sm">Aucune opération prévue pour cette période.</p>
          </div>
        )}
      </div>
    </Card>
  );
};
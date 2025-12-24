
import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { usePlannerUI } from '../../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, AppSettings, VariableTransaction, OperationFilters, SavingsTransaction, SavedLabel } from '../../../types';

// Imports UI Atomic (Generic)
import { MonthNavigator } from '../../ui/molecules/MonthNavigator';
import { FilterBar } from '../../ui/molecules/FilterBar';
import { WeekSelector } from '../../ui/molecules/WeekSelector';
import { QuickPeriodSummary } from '../../ui/molecules/QuickPeriodSummary';
import { SearchBar } from '../../ui/atoms/SearchBar';

// Imports Feature-Specific Components
import { OperationsList } from './components/OperationsList';
import { PlannerModals } from './components/PlannerModals';
import { VariableTransactionForm } from './components/VariableTransactionForm';

interface OperationsViewProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[]; 
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  settings: AppSettings;
  categories: any[];
  savedLabels?: SavedLabel[]; // Liste complète des libellés
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onUpsertVariable: (t: VariableTransaction) => void;
  onDeleteVariable: (id: string) => void;
  onUpsertSavings?: (t: SavingsTransaction) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({ 
  configs, incomeConfigs, variableTransactions, accounts, people, paidItems, settings, categories, savedLabels,
  onTogglePaid, onUpsertVariable, onDeleteVariable, onUpsertSavings
}) => {
  const ui = usePlannerUI();
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  
  const [filters, setFilters] = useState<OperationFilters>({
    flux: 'ALL', source: 'ALL', status: 'ALL', extra: 'ALL', transfer: 'EXCLUDE', salary: 'EXCLUDE', accountIds: [], beneficiaryIds: []
  });
  
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, ui.currentDate, ui.searchQuery, settings, filters);
  const currentWeekIndex = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === currentWeekIndex);
  const currentItems = currentWeekData?.items || [];

  const quickStats = useMemo(() => {
    const stats = { expenses: { real: 0, planned: 0, pending: 0, extra: 0 }, income: { real: 0, planned: 0, pending: 0, extra: 0 } };
    currentItems.forEach(item => {
        if (item.category === 'Virement Interne') return;
        if (item.type === 'INCOME' && item.isSalary) return;

        const target = item.type === 'INCOME' ? stats.income : stats.expenses;
        
        if (item.source === 'VARIABLE') {
            if (item.isPaid) target.real += item.amount; else target.pending += item.amount;
        } else {
            target.planned += item.originalAmount;
            if (item.isPaid) target.real += item.amount; else target.pending += item.amount;
        }

        if (item.isExtra) {
            target.extra += item.amount;
        }
    });
    return stats;
  }, [currentItems]);

  const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(ui.currentDate);

  const handleItemClick = (item: PlannedItem) => {
    if (item.source === 'RECURRING') {
      item.isPaid ? ui.openUncheckModal(item) : ui.openConfirmModal(item, accounts.find(a => a.id === item.accountId)?.id || accounts[0]?.id || '');
    } else {
      const tx = variableTransactions.find(t => t.id === item.instanceId);
      if (tx) { setEditingVar(tx); setIsVarFormOpen(true); }
    }
  };

  const defaultVarDate = (() => {
      const today = new Date();
      if (today.getMonth() === ui.currentDate.getMonth() && today.getFullYear() === ui.currentDate.getFullYear()) return today.toISOString().split('T')[0];
      if (currentWeekData) return new Date(ui.currentDate.getFullYear(), ui.currentDate.getMonth(), currentWeekData.startDate, 12).toISOString().split('T')[0];
      return new Date().toISOString().split('T')[0];
  })();

  return (
    <div className="space-y-6">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <MonthNavigator date={ui.currentDate} onPrev={ui.handlePrevMonth} onNext={ui.handleNextMonth} />
            <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
          </div>
          <WeekSelector 
            weeks={filteredWeeks} 
            activeWeek={currentWeekIndex} 
            onSelect={ui.setActiveWeek} 
            searchQuery={ui.searchQuery}
          />
          <QuickPeriodSummary expenses={quickStats.expenses} income={quickStats.income} />
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <FilterBar filters={filters} onFilterChange={setFilters} accounts={accounts} people={people} />
          </div>
          <OperationsList items={currentItems} monthShort={monthShort} people={people} accounts={accounts} currentDate={ui.currentDate} onItemClick={handleItemClick} onAddClick={() => { setEditingVar(null); setIsVarFormOpen(true); }} />
      </div>
      <PlannerModals confirmModal={ui.confirmModal} uncheckModal={ui.uncheckModal} accounts={accounts} onTogglePaid={onTogglePaid} onCloseConfirm={ui.closeConfirmModal} onCloseUncheck={ui.closeUncheckModal} setConfirmModal={ui.setConfirmModal} />
      <VariableTransactionForm 
        isOpen={isVarFormOpen} 
        onClose={() => setIsVarFormOpen(false)} 
        accounts={accounts} 
        categories={categories} 
        people={people} 
        onAddTransaction={onUpsertVariable} 
        onDeleteTransaction={onDeleteVariable} 
        defaultDate={defaultVarDate} 
        savedLabels={savedLabels} // Liste complète
        labelsSuggestions={settings.variable_labels} // Fallback string[]
        editingTransaction={editingVar} 
        onUpsertSavings={onUpsertSavings} 
      />
    </div>
  );
};

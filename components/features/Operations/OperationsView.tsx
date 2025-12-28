
import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { usePlannerUI } from '../../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, AppSettings, VariableTransaction, OperationFilters, SavedLabel } from '../../../types';
import { Calendar, CalendarRange } from 'lucide-react';

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
}

export const OperationsView: React.FC<OperationsViewProps> = ({ 
  configs, incomeConfigs, variableTransactions, accounts, people, paidItems, settings, categories, savedLabels,
  onTogglePaid, onUpsertVariable, onDeleteVariable
}) => {
  const ui = usePlannerUI();
  const [scope, setScope] = useState<'MONTH' | 'PERIOD'>('PERIOD');
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  
  // Par défaut, on masque les virements internes car ils ont leur propre vue
  const [filters, setFilters] = useState<OperationFilters>({
    flux: 'ALL', source: 'ALL', status: 'ALL', extra: 'ALL', transfer: 'EXCLUDE', salary: 'EXCLUDE', accountIds: [], beneficiaryIds: []
  });
  
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, ui.currentDate, ui.searchQuery, settings, filters);
  const currentWeekIndex = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === currentWeekIndex);
  
  // Calcul des éléments affichés selon le scope
  const currentItems = useMemo(() => {
    if (scope === 'MONTH') {
        // En vue MOIS, on aplatit toutes les semaines et on trie par jour
        return filteredWeeks.flatMap(w => w.items).sort((a, b) => {
             const dayDiff = a.day - b.day;
             if (dayDiff !== 0) return dayDiff;
             return a.instanceId.localeCompare(b.instanceId);
        });
    }
    // En vue PÉRIODE, on prend uniquement la semaine active
    return currentWeekData?.items || [];
  }, [scope, filteredWeeks, currentWeekData]);

  const quickStats = useMemo(() => {
    const stats = { expenses: { real: 0, planned: 0, pending: 0, extra: 0 }, income: { real: 0, planned: 0, pending: 0, extra: 0 } };
    currentItems.forEach(item => {
        if (item.category === 'Virement Interne') return;
        
        // Suppression de l'exclusion des salaires ici. Ils sont gérés par les filtres (currentItems).
        // if (item.type === 'INCOME' && item.isSalary) return; 

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
      if (scope === 'PERIOD' && currentWeekData) return new Date(ui.currentDate.getFullYear(), ui.currentDate.getMonth(), currentWeekData.startDate, 12).toISOString().split('T')[0];
      return new Date().toISOString().split('T')[0];
  })();

  return (
    <div className="space-y-6">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <MonthNavigator date={ui.currentDate} onPrev={ui.handlePrevMonth} onNext={ui.handleNextMonth} />
                
                {/* Sélecteur de Vue (Mois vs Période) */}
                <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center justify-center shadow-sm">
                    <button 
                        onClick={() => setScope('MONTH')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${scope === 'MONTH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Calendar size={14} /> Mois
                    </button>
                    <button 
                        onClick={() => setScope('PERIOD')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${scope === 'PERIOD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <CalendarRange size={14} /> Période
                    </button>
                </div>
            </div>
            <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
          </div>

          {scope === 'PERIOD' && (
            <WeekSelector 
                weeks={filteredWeeks} 
                activeWeek={currentWeekIndex} 
                onSelect={ui.setActiveWeek} 
                searchQuery={ui.searchQuery}
            />
          )}

          <QuickPeriodSummary expenses={quickStats.expenses} income={quickStats.income} />
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <FilterBar 
                filters={filters} 
                onFilterChange={setFilters} 
                accounts={accounts} 
                people={people}
                hiddenFilters={['transfer']} 
              />
          </div>
          
          <OperationsList 
            items={currentItems} 
            monthShort={monthShort} 
            people={people} 
            accounts={accounts} 
            currentDate={ui.currentDate} 
            onItemClick={handleItemClick} 
            onAddClick={() => { setEditingVar(null); setIsVarFormOpen(true); }} 
          />
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
        savedLabels={savedLabels} 
        labelsSuggestions={settings.variable_labels} 
        editingTransaction={editingVar} 
        initialMode="STANDARD" 
        lockMode={true} 
      />
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { usePlannerUI } from '../../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, AppSettings, VariableTransaction, OperationFilters, SavedLabel, Tag, CategoryDef } from '../../../types';
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
  categories: CategoryDef[];
  savedLabels?: SavedLabel[]; 
  tags?: Tag[];
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onUpsertVariable: (t: VariableTransaction) => void;
  onDeleteVariable: (id: string) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({ 
  configs, incomeConfigs, variableTransactions, accounts, people, paidItems, settings, categories, savedLabels, tags = [],
  onTogglePaid, onUpsertVariable, onDeleteVariable
}) => {
  const ui = usePlannerUI();
  const [scope, setScope] = useState<'MONTH' | 'PERIOD'>('PERIOD');
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  
  const [filters, setFilters] = useState<OperationFilters>({
    flux: 'ALL', 
    source: 'ALL', 
    status: 'ALL', 
    extra: 'ALL', 
    transfer: 'EXCLUDE', 
    salary: 'EXCLUDE', 
    accountIds: [], 
    beneficiaryIds: [], 
    tagIds: [],
    tagMode: 'INCLUDE'
  });
  
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, ui.currentDate, ui.searchQuery, settings, categories, filters);
  const currentWeekIndex = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === currentWeekIndex);
  
  const currentItems = useMemo(() => {
    if (scope === 'MONTH') {
        return filteredWeeks.flatMap(w => w.items).sort((a, b) => {
             const dayDiff = a.day - b.day;
             if (dayDiff !== 0) return dayDiff;
             return a.instanceId.localeCompare(b.instanceId);
        });
    }
    return currentWeekData?.items || [];
  }, [scope, filteredWeeks, currentWeekData]);

  const quickStats = useMemo(() => {
    const stats = { expenses: { real: 0, planned: 0, pending: 0, extra: 0 }, income: { real: 0, planned: 0, pending: 0, extra: 0 } };
    currentItems.forEach(item => {
        if (item.category === 'Virement Interne') return;
        
        // Détection intelligente du remboursement
        // Si c'est un revenu (Crédit) MAIS que la catégorie est de type Dépense = Remboursement
        const isRefund = item.type === 'INCOME' && (
            item.category === 'Dépenses' || 
            item.category === 'Remboursement' ||
            categories.find(c => c.name === item.category)?.type === 'EXPENSE'
        );

        let target;
        let amount = item.amount;

        if (item.type === 'EXPENSE') {
            target = stats.expenses;
        } else if (isRefund) {
            // C'est un remboursement : on le traite comme une dépense NÉGATIVE
            target = stats.expenses;
            amount = -item.amount;
        } else {
            target = stats.income;
        }
        
        if (item.source === 'VARIABLE') {
            if (item.isPaid) target.real += amount; else target.pending += amount;
        } else {
            // Pour les remboursements récurrents (rare mais possible), on ajuste le planifié
            const plannedAmount = (item.type === 'INCOME' && isRefund) ? -item.originalAmount : item.originalAmount;
            target.planned += plannedAmount;
            if (item.isPaid) target.real += amount; else target.pending += amount;
        }

        if (item.isExtra) {
            target.extra += amount;
        }
    });
    return stats;
  }, [currentItems, categories]);

  const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(ui.currentDate);

  const handleItemClick = (item: PlannedItem) => {
    if (item.source === 'RECURRING') {
      item.isPaid ? ui.openUncheckModal(item) : ui.openConfirmModal(item, accounts.find(a => a.id === item.accountId)?.id || accounts[0]?.id || '');
    } else {
      const tx = variableTransactions.find(t => t.id === item.instanceId);
      if (tx) { setEditingVar(tx); setIsVarFormOpen(true); }
    }
  };

  const handleExport = () => {
    if (currentItems.length === 0) return;

    const headers = ['Date', 'Libellé', 'Montant', 'Type', 'Catégorie', 'Sous-Catégorie', 'Bénéficiaire', 'Compte', 'Statut', 'Note', 'Tags'];
    const csvContent = [
        headers.join(';'),
        ...currentItems.map(item => {
            const dateStr = item.paidDetails?.paymentDate || 
                `${ui.currentDate.getFullYear()}-${String(ui.currentDate.getMonth()+1).padStart(2,'0')}-${String(item.day).padStart(2,'0')}`;
            
            const personName = people.find(p => p.id === item.beneficiaryId)?.name || '';
            const accountName = accounts.find(a => a.id === item.accountId)?.name || '';
            const status = item.isPaid ? 'Réel' : 'En attente';
            const type = item.type === 'INCOME' ? 'Revenu' : 'Dépense';
            const amount = item.amount.toFixed(2).replace('.', ','); 
            const itemTags = item.tagIds ? tags.filter(t => item.tagIds?.includes(t.id)).map(t => t.name).join(', ') : '';

            const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

            return [
                dateStr,
                escapeCsv(item.label),
                amount,
                type,
                escapeCsv(item.category),
                escapeCsv(item.subCategory || ''),
                escapeCsv(personName),
                escapeCsv(accountName),
                status,
                escapeCsv(item.comments || ''),
                escapeCsv(itemTags)
            ].join(';');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `budget_export_${scope.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                tags={tags}
              />
          </div>
          
          <OperationsList 
            items={currentItems} 
            monthShort={monthShort} 
            people={people} 
            accounts={accounts} 
            tags={tags}
            currentDate={ui.currentDate} 
            onItemClick={handleItemClick} 
            onAddClick={() => { setEditingVar(null); setIsVarFormOpen(true); }} 
            onExport={handleExport}
          />
      </div>
      
      <PlannerModals 
        confirmModal={ui.confirmModal} 
        uncheckModal={ui.uncheckModal} 
        accounts={accounts} 
        tags={tags}
        onTogglePaid={onTogglePaid} 
        onCloseConfirm={ui.closeConfirmModal} 
        onCloseUncheck={ui.closeUncheckModal} 
        setConfirmModal={ui.setConfirmModal} 
      />
      
      <VariableTransactionForm 
        isOpen={isVarFormOpen} 
        onClose={() => setIsVarFormOpen(false)} 
        accounts={accounts} 
        categories={categories} 
        people={people} 
        tags={tags}
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

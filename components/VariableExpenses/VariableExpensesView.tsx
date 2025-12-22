
import React, { useState } from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerUI } from '../../hooks/usePlannerUI';
import { VariableTransaction, Account, AppSettings, IncomeConfig, Person, CategoryDef, PaidItemDetails } from '../../types';
import { InfoBox } from '../ui/InfoBox';
import { ShoppingBag } from 'lucide-react';

import { MonthNavigator } from '../molecules/MonthNavigator';
import { SearchBar } from '../atoms/SearchBar';
import { WeekSelector } from '../../ui/molecules/WeekSelector';
import { VariableTransactionForm } from './organisms/VariableTransactionForm';
import { VariableOperationsList } from './organisms/VariableOperationsList';
import { VariableStatsSummary } from './organisms/VariableStatsSummary';
import { VariableDetailedAnalysis } from './organisms/VariableDetailedAnalysis';

interface VariableExpensesViewProps {
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  settings: AppSettings;
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  people: Person[];
  categories: CategoryDef[];
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const VariableExpensesView: React.FC<VariableExpensesViewProps> = ({
  variableTransactions, accounts, settings, categories, people, incomeConfigs, paidItems,
  onAddTransaction, onDeleteTransaction
}) => {
  const ui = usePlannerUI();
  const [editingTransaction, setEditingTransaction] = useState<VariableTransaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { filteredWeeks } = usePlanner([], [], {}, variableTransactions, ui.currentDate, ui.searchQuery, settings);
  
  const currentMonth = ui.currentDate.getMonth();
  const currentYear = ui.currentDate.getFullYear();
  const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(ui.currentDate);

  const currentMonthTransactions = variableTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const safeActiveWeek = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const activeWeekData = filteredWeeks.find(w => w.weekNumber === safeActiveWeek);

  const filteredTransactions = currentMonthTransactions.filter(t => {
      const day = new Date(t.date).getDate();
      const inPeriod = activeWeekData && day >= activeWeekData.startDate && day <= activeWeekData.endDate;
      
      const normalizedQuery = ui.searchQuery.toLowerCase().replace(/,/g, '.');
      const matchesSearch = !ui.searchQuery 
          || t.label.toLowerCase().includes(normalizedQuery)
          || t.category.toLowerCase().includes(normalizedQuery)
          || t.amount.toString().includes(normalizedQuery);

      return inPeriod && matchesSearch;
  });

  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pour les statistiques, on exclut les virements internes
  const statsTransactions = filteredTransactions.filter(t => t.category !== 'Virement Interne');

  const defaultFormDate = (() => {
      const today = new Date();
      if (today.getMonth() === currentMonth && today.getFullYear() === currentYear && activeWeekData) {
          const d = today.getDate();
          if (d >= activeWeekData.startDate && d <= activeWeekData.endDate) {
              return today.toISOString().split('T')[0];
          }
      }
      if (activeWeekData) {
          const d = new Date(currentYear, currentMonth, activeWeekData.startDate, 12, 0, 0);
          return d.toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
  })();

  const handleEdit = (tx: VariableTransaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingTransaction(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <InfoBox 
            title="Dépenses Variables au Réel"
            description="Suivez ici vos dépenses quotidiennes. Les montants des 'Revenus Fixes' sont calculés à partir de vos saisies réelles dans l'Échéancier pour une précision maximale."
            icon={<ShoppingBag size={18} />}
        />

        <div className="flex flex-col md:flex-row justify-between gap-4">
            <MonthNavigator 
              date={ui.currentDate} 
              onPrev={ui.handlePrevMonth} 
              onNext={ui.handleNextMonth} 
            />
            
            <SearchBar 
              value={ui.searchQuery} 
              onChange={ui.setSearchQuery} 
              placeholder="Rechercher une dépense..." 
            />
        </div>

        <WeekSelector 
            weeks={filteredWeeks} 
            activeWeek={safeActiveWeek} 
            onSelect={ui.setActiveWeek} 
            searchQuery={ui.searchQuery}
        />

        {/* Stats uniquement sur les vraies dépenses/revenus (pas de virements) */}
        <VariableStatsSummary 
            budget={activeWeekData?.periodLimit || 0}
            expenses={statsTransactions.filter(t => t.type !== 'INCOME').reduce((sum, t) => sum + t.amount, 0)}
            income={statsTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)}
        />

        <VariableDetailedAnalysis 
            transactions={statsTransactions}
            people={people}
            accounts={accounts}
        />

        {/* La liste affiche TOUT, y compris les virements, pour la traçabilité */}
        <VariableOperationsList 
            transactions={filteredTransactions}
            accounts={accounts}
            people={people}
            onEditTransaction={handleEdit}
            monthShort={monthShort}
            onAddClick={handleAddClick}
        />

        <VariableTransactionForm 
            isOpen={isFormOpen}
            onClose={closeForm}
            accounts={accounts}
            categories={categories}
            people={people}
            onAddTransaction={onAddTransaction}
            onDeleteTransaction={onDeleteTransaction}
            defaultDate={defaultFormDate}
            labelsSuggestions={settings.variable_labels}
            editingTransaction={editingTransaction}
        />
    </div>
  );
};

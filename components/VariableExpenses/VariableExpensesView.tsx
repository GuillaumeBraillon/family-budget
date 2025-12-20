
import React, { useState } from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerUI } from '../../hooks/usePlannerUI';
import { VariableTransaction, Account, AppSettings, IncomeConfig, Person, CategoryDef } from '../../types';
import { InfoBox } from '../ui/InfoBox';
import { ShoppingBag } from 'lucide-react';

import { MonthNavigator } from '../BudgetPlanner/molecules/MonthNavigator';
import { SearchBar } from '../BudgetPlanner/atoms/SearchBar';
import { VariableTransactionForm } from './organisms/VariableTransactionForm';
import { VariablePeriodSelector } from './molecules/VariablePeriodSelector';
import { VariableOperationsList } from './organisms/VariableOperationsList';

interface VariableExpensesViewProps {
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  settings: AppSettings;
  incomeConfigs: IncomeConfig[];
  people: Person[];
  categories: CategoryDef[];
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const VariableExpensesView: React.FC<VariableExpensesViewProps> = ({
  variableTransactions, accounts, settings, categories, people,
  onAddTransaction, onDeleteTransaction
}) => {
  // Réutilisation de la logique UI du Planner (mois, recherche, activeWeek)
  const ui = usePlannerUI();
  const [editingTransaction, setEditingTransaction] = useState<VariableTransaction | null>(null);
  
  // On utilise usePlanner pour obtenir la structure des périodes (weeks)
  const { filteredWeeks } = usePlanner([], [], {}, ui.currentDate, '', settings);
  
  const currentMonth = ui.currentDate.getMonth();
  const currentYear = ui.currentDate.getFullYear();
  const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(ui.currentDate);

  // Filtrage des transactions pour le mois sélectionné
  const currentMonthTransactions = variableTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calcul de la période active par défaut si nécessaire
  const safeActiveWeek = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const activeWeekData = filteredWeeks.find(w => w.weekNumber === safeActiveWeek);

  // Filtrage des transactions pour la période active ET la recherche
  const filteredTransactions = currentMonthTransactions.filter(t => {
      // Filtre période
      const day = new Date(t.date).getDate();
      const inPeriod = activeWeekData && day >= activeWeekData.startDate && day <= activeWeekData.endDate;
      
      // Filtre recherche
      const matchesSearch = !ui.searchQuery 
          || t.label.toLowerCase().includes(ui.searchQuery.toLowerCase())
          || t.category.toLowerCase().includes(ui.searchQuery.toLowerCase());

      return inPeriod && matchesSearch;
  });

  // Tri par date décroissante
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calcul de la date par défaut pour le formulaire (aujourd'hui ou début de période)
  const defaultFormDate = (() => {
      const today = new Date();
      // Si aujourd'hui est dans la période active et le mois affiché
      if (today.getMonth() === currentMonth && today.getFullYear() === currentYear && activeWeekData) {
          const d = today.getDate();
          if (d >= activeWeekData.startDate && d <= activeWeekData.endDate) {
              return today.toISOString().split('T')[0];
          }
      }
      // Sinon, 1er jour de la période active
      if (activeWeekData) {
          // Astuce pour éviter le décalage UTC lors de la création de la string date
          const d = new Date(currentYear, currentMonth, activeWeekData.startDate, 12, 0, 0);
          return d.toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
  })();

  const handleEdit = (tx: VariableTransaction) => {
    setEditingTransaction(tx);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <InfoBox 
            title="Dépenses Variables au Réel"
            description="Suivez ici vos dépenses quotidiennes (Courses, Loisirs...). Sélectionnez une période pour voir le détail et ajoutez vos tickets de caisse pour tenir à jour votre 'Reste à vivre'."
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

        <VariablePeriodSelector 
            weeks={filteredWeeks}
            activeWeek={safeActiveWeek}
            onSelect={ui.setActiveWeek}
            transactions={currentMonthTransactions}
            accounts={accounts}
            people={people}
        />

        <VariableTransactionForm 
            accounts={accounts}
            categories={categories}
            people={people}
            onAddTransaction={(t) => { onAddTransaction(t); setEditingTransaction(null); }}
            defaultDate={defaultFormDate}
            labelsSuggestions={settings.variable_labels}
            editingTransaction={editingTransaction}
            onCancelEdit={handleCancelEdit}
        />

        <VariableOperationsList 
            transactions={filteredTransactions}
            accounts={accounts}
            people={people}
            onDeleteTransaction={onDeleteTransaction}
            onEditTransaction={handleEdit}
            monthShort={monthShort}
        />
    </div>
  );
};

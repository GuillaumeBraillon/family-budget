import React from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerUI } from '../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem } from '../../types';
import { DetailedAnalysis } from './organisms/DetailedAnalysis';
import { StatsSummary } from './organisms/StatsSummary';
import { OperationsList } from './organisms/OperationsList';
import { PlannerModals } from './organisms/PlannerModals';
import { MonthNavigator } from './molecules/MonthNavigator';
import { SearchBar } from './atoms/SearchBar';
import { WeekSelector } from './molecules/WeekSelector';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
}

/**
 * Composant principal du Planner Budgétaire.
 * Organise la vue en utilisant des composants spécialisés pour chaque section.
 */
export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ 
  configs, incomeConfigs, accounts, people, paidItems, onTogglePaid 
}) => {
  const ui = usePlannerUI();
  const { filteredWeeks, getStats } = usePlanner(configs, incomeConfigs, paidItems, ui.currentDate, ui.searchQuery);
  const stats = getStats(ui.activeWeek);
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === ui.activeWeek);

  const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(ui.currentDate);

  const handleItemClick = (item: PlannedItem) => {
    if (item.isPaid) {
      ui.openUncheckModal(item);
    } else {
      const defaultAccount = accounts.find(a => a.id === item.accountId)?.id || accounts[0]?.id || '';
      ui.openConfirmModal(item, defaultAccount);
    }
  };

  return (
    <div className="space-y-6">
      {/* BARRE D'OUTILS : NAVIGATION ET RECHERCHE */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <MonthNavigator 
          date={ui.currentDate} 
          onPrev={ui.handlePrevMonth} 
          onNext={ui.handleNextMonth} 
        />
        
        <SearchBar 
          value={ui.searchQuery} 
          onChange={ui.setSearchQuery} 
          placeholder="Rechercher une opération..." 
        />
      </div>

      {/* SÉLECTEUR DE SEMAINE */}
      <WeekSelector 
        weeks={filteredWeeks} 
        activeWeek={ui.activeWeek} 
        onSelect={ui.setActiveWeek} 
      />

      {/* RÉSUMÉ DES STATS (KPIs) */}
      <StatsSummary stats={stats} accounts={accounts} />

      {/* ANALYSE DÉTAILLÉE (Bénéficiaires et Comptes) */}
      <DetailedAnalysis stats={stats} people={people} accounts={accounts} />

      {/* LISTE DES OPÉRATIONS DÉTAILLÉES */}
      <OperationsList 
        items={currentWeekData?.items || []}
        monthShort={monthShort}
        people={people}
        accounts={accounts}
        currentDate={ui.currentDate}
        onItemClick={handleItemClick}
      />

      {/* MODALES DE GESTION (Confirmation / Annulation) */}
      <PlannerModals 
        confirmModal={ui.confirmModal}
        uncheckModal={ui.uncheckModal}
        accounts={accounts}
        onTogglePaid={onTogglePaid}
        onCloseConfirm={ui.closeConfirmModal}
        onCloseUncheck={ui.closeUncheckModal}
        setConfirmModal={ui.setConfirmModal}
      />
    </div>
  );
};
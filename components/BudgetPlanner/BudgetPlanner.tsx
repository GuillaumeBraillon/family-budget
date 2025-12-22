
import React from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerUI } from '../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, AppSettings } from '../../types';
import { DetailedAnalysis } from './organisms/DetailedAnalysis';
import { StatsSummary } from './organisms/StatsSummary';
import { OperationsList } from './organisms/OperationsList';
import { PlannerModals } from './organisms/PlannerModals';
import { MonthNavigator } from './molecules/MonthNavigator';
import { SearchBar } from './atoms/SearchBar';
import { WeekSelector } from './molecules/WeekSelector';
import { InfoBox } from '../ui/InfoBox';
import { Target } from 'lucide-react';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[]; 
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  settings: AppSettings;
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ 
  configs, incomeConfigs, accounts, people, paidItems, settings,
  onTogglePaid
}) => {
  const ui = usePlannerUI();
  
  const { filteredWeeks, getStats } = usePlanner(configs, incomeConfigs, paidItems, ui.currentDate, ui.searchQuery, settings);
  
  // Correction de l'index de semaine active si le découpage change
  const currentWeekIndex = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const stats = getStats(currentWeekIndex);
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === currentWeekIndex);

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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <InfoBox 
            title="Suivi & Pointage"
            description="Cochez les opérations au fur et à mesure qu'elles apparaissent sur vos comptes bancaires réels. Le 'Reste à payer' s'ajuste automatiquement pour vous donner une vision claire de votre fin de mois."
            icon={<Target size={18} />}
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
              placeholder="Rechercher une opération..." 
            />
          </div>

          <WeekSelector 
            weeks={filteredWeeks} 
            activeWeek={currentWeekIndex} 
            onSelect={ui.setActiveWeek} 
          />

          <StatsSummary stats={stats} accounts={accounts} />

          <DetailedAnalysis stats={stats} people={people} accounts={accounts} />

          <OperationsList 
            items={currentWeekData?.items || []}
            monthShort={monthShort}
            people={people}
            accounts={accounts}
            currentDate={ui.currentDate}
            onItemClick={handleItemClick}
          />
      </div>

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

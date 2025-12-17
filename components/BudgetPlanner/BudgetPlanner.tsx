
import React from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerUI } from '../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem } from '../../types';
import { ConfigTab } from '../../hooks/useConfigurationUI';
import { DetailedAnalysis } from './organisms/DetailedAnalysis';
import { StatsSummary } from './organisms/StatsSummary';
import { OperationsList } from './organisms/OperationsList';
import { PlannerModals } from './organisms/PlannerModals';
import { MonthNavigator } from './molecules/MonthNavigator';
import { SearchBar } from './atoms/SearchBar';
import { WeekSelector } from './molecules/WeekSelector';
import { Settings2, TrendingUp, Wallet } from 'lucide-react';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onNavigateToConfig: (tab: ConfigTab) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ 
  configs, incomeConfigs, accounts, people, paidItems, onTogglePaid, onNavigateToConfig
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

      {/* RACCOURCIS DE GESTION DES MODÈLES */}
      <div className="flex flex-wrap items-center gap-3 py-1 px-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Settings2 size={12}/> Modèles :
          </span>
          <button 
            onClick={() => onNavigateToConfig('operations')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
          >
              <TrendingUp size={14}/> Revenus récurrents
          </button>
          <button 
            onClick={() => onNavigateToConfig('operations')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
          >
              <Wallet size={14}/> Dépenses récurrentes
          </button>
      </div>

      {/* RÉSUMÉ DES STATS (KPIs) */}
      <StatsSummary stats={stats} accounts={accounts} />

      {/* ANALYSE DÉTAILLÉE */}
      <DetailedAnalysis stats={stats} people={people} accounts={accounts} />

      {/* LISTE DES OPÉRATIONS */}
      <OperationsList 
        items={currentWeekData?.items || []}
        monthShort={monthShort}
        people={people}
        accounts={accounts}
        currentDate={ui.currentDate}
        onItemClick={handleItemClick}
      />

      {/* MODALES */}
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

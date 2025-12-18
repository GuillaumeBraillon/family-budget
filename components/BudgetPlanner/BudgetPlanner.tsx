
import React, { useState } from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerUI } from '../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, CategoryDef, AppSettings } from '../../types';
import { DetailedAnalysis } from './organisms/DetailedAnalysis';
import { StatsSummary } from './organisms/StatsSummary';
import { OperationsList } from './organisms/OperationsList';
import { PlannerModals } from './organisms/PlannerModals';
import { MonthNavigator } from './molecules/MonthNavigator';
import { SearchBar } from './atoms/SearchBar';
import { WeekSelector } from './molecules/WeekSelector';
import { OperationsManager } from '../Configuration/organisms/OperationsManager';
import { InfoBox } from '../ui/InfoBox';
import { CalendarRange, ListChecks, Settings2, Target } from 'lucide-react';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[]; 
  categories: CategoryDef[];
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  settings: AppSettings;
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onAddConfig: (c: ExpenseConfig) => void;
  onUpdateConfig: (c: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome: (i: IncomeConfig) => void;
  onUpdateIncome: (i: IncomeConfig) => void;
  onDeleteIncome: (id: string) => void;
}

type PlannerViewMode = 'calendar' | 'models';

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ 
  configs, incomeConfigs, categories, accounts, people, paidItems, settings,
  onTogglePaid, onAddConfig, onUpdateConfig, onDeleteConfig,
  onAddIncome, onUpdateIncome, onDeleteIncome
}) => {
  const ui = usePlannerUI();
  const [viewMode, setViewMode] = useState<PlannerViewMode>('calendar');
  
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
      <div className="flex justify-center mb-2">
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-full max-w-sm">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'calendar' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListChecks size={16} /> Suivi Mensuel
          </button>
          <button 
            onClick={() => setViewMode('models')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'models' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarRange size={16} /> Modèles Récurrents
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
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
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <InfoBox 
              title="Gestion des Modèles"
              description="Ici, configurez vos revenus et dépenses qui se répètent chaque mois. Ces règles génèrent automatiquement votre échéancier dans l'onglet 'Suivi Mensuel'."
              icon={<Settings2 size={18} />}
              className="mb-6"
           />

           <OperationsManager 
                configs={configs} 
                incomeConfigs={incomeConfigs}
                categories={categories}
                people={people}
                accounts={accounts}
                onAddConfig={onAddConfig}
                onUpdateConfig={onUpdateConfig}
                onDeleteConfig={onDeleteConfig}
                onAddIncome={onAddIncome}
                onUpdateIncome={onUpdateIncome}
                onDeleteIncome={onDeleteIncome}
            />
        </div>
      )}

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

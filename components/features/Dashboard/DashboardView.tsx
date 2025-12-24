
import React, { useMemo, useState } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { DashboardHeader } from './components/DashboardHeader';
import { SavingsSummaryCard } from './components/SavingsSummaryCard';
import { HealthCard, CashFlowCard, ExtrasCard, TopExpensesCard } from './components/AnalyticsCards';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, Transfer, VariableTransaction, PlannedItem } from '../../../types';

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  transfers: Transfer[];
  variableTransactions?: VariableTransaction[];
  onNavigateToPlanner: () => void;
  onNavigateToConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  accounts, people, configs, incomeConfigs, paidItems, settings, transfers, variableTransactions = [],
  onNavigateToPlanner, 
  onNavigateToConfig 
}) => {
  const currentDate = new Date();
  const [scope, setScope] = useState<'MONTH' | 'PERIOD'>('MONTH');
  
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, currentDate, '', settings);
  
  const currentDay = currentDate.getDate();
  const currentPeriod = useMemo(() => {
      return filteredWeeks.find(w => currentDay >= w.startDate && currentDay <= w.endDate) || filteredWeeks[0];
  }, [filteredWeeks, currentDay]);

  const relevantItems: PlannedItem[] = useMemo(() => {
      if (scope === 'MONTH') {
          return filteredWeeks.flatMap(w => w.items);
      } else {
          return currentPeriod ? currentPeriod.items : [];
      }
  }, [filteredWeeks, scope, currentPeriod]);

  const analytics = useMemo(() => {
      let income = 0;
      let expenses = 0;
      let plannedExpenses = 0;
      let extras = 0;
      
      const catMap: Record<string, number> = {};
      const benMap: Record<string, number> = {};
      const accMap: Record<string, { real: number, planned: number }> = {};

      relevantItems.forEach(item => {
          if (item.category === 'Virement Interne') return;

          const amount = item.amount;
          const isExpense = item.type === 'EXPENSE';
          const isReal = item.isPaid;

          if (isExpense) {
              if (isReal) expenses += amount;
              plannedExpenses += (item.source === 'RECURRING' ? item.originalAmount : (isReal ? amount : 0)); 
              
              if (item.isExtra) extras += amount;

              const cat = item.category || 'Aucune';
              if (isReal) catMap[cat] = (catMap[cat] || 0) + amount;

              const ben = people.find(p => p.id === item.beneficiaryId)?.name || 'Commun';
              if (isReal) benMap[ben] = (benMap[ben] || 0) + amount;

          } else {
              if (isReal) income += amount;
          }

          if (isExpense) {
              const accName = accounts.find(a => a.id === item.accountId)?.name || 'N/A';
              if (!accMap[accName]) accMap[accName] = { real: 0, planned: 0 };
              
              if (item.source === 'RECURRING') {
                  accMap[accName].planned += item.originalAmount;
              }
              if (isReal) {
                  accMap[accName].real += amount;
              }
          }
      });

      const topCategories = Object.entries(catMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

      const topBeneficiaries = Object.entries(benMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

      const byAccount = Object.entries(accMap).map(([name, vals]) => ({
          name,
          real: vals.real,
          planned: vals.planned,
          diff: vals.planned - vals.real
      })).sort((a, b) => a.diff - b.diff);

      return {
          income,
          expenses,
          plannedExpenses, 
          balance: income - expenses,
          extras,
          savingsRatio: 0,
          topCategories,
          topBeneficiaries,
          byAccount
      };
  }, [relevantItems, people, accounts]);

  const periodLimit = scope === 'MONTH' ? settings.monthly_envelope : (currentPeriod?.periodLimit || 0); 
  analytics.plannedExpenses += periodLimit; 

  const navTo = (path: string) => {
      onNavigateToPlanner();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <SavingsSummaryCard 
        accounts={accounts} 
        transfers={transfers} 
      />

      <DashboardHeader 
        currentDate={currentDate} 
        onNavigateToPlanner={onNavigateToPlanner} 
        scope={scope}
        setScope={setScope}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          <div className="xl:col-span-1 h-full min-h-[280px]">
              <HealthCard data={analytics} onNavigate={navTo} />
          </div>
          <div className="xl:col-span-1 h-full min-h-[280px]">
              <CashFlowCard data={analytics} onNavigate={navTo} />
          </div>
          <div className="xl:col-span-1 h-full min-h-[280px]">
              <ExtrasCard data={analytics} onNavigate={navTo} />
          </div>
          <div className="xl:col-span-1 h-full min-h-[280px]">
              <TopExpensesCard data={analytics} onNavigate={navTo} />
          </div>
      </div>
    </div>
  );
};

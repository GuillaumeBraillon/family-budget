
import React, { useMemo, useState } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { DashboardHeader } from './components/DashboardHeader';
import { SavingsSummaryCard } from './components/SavingsSummaryCard';
import { HealthCard, CashFlowCard, ExtrasCard, TopExpensesCard } from './components/AnalyticsCards';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, Transfer, VariableTransaction, PlannedItem, CategoryDef } from '../../../types';

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  transfers: Transfer[];
  variableTransactions?: VariableTransaction[];
  categories: CategoryDef[];
  onNavigateToPlanner: () => void;
  onNavigateToConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  accounts, people, configs, incomeConfigs, paidItems, settings, transfers, variableTransactions = [], categories,
  onNavigateToPlanner, 
  onNavigateToConfig 
}) => {
  const currentDate = new Date();
  const [scope, setScope] = useState<'MONTH' | 'PERIOD'>('MONTH');
  
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, currentDate, '', settings, categories);
  
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
          
          // Détection des remboursements via le type de catégorie
          const isRefund = item.type === 'INCOME' && (
              item.category === 'Dépenses' || 
              item.category === 'Remboursement' ||
              categories.find(c => c.name === item.category)?.type === 'EXPENSE'
          );

          if (isExpense) {
              if (isReal) expenses += amount;
              plannedExpenses += (item.source === 'RECURRING' ? item.originalAmount : (isReal ? amount : 0)); 
              
              if (item.isExtra) extras += amount;

              const cat = item.category || 'Aucune';
              if (isReal) catMap[cat] = (catMap[cat] || 0) + amount;

              const ben = people.find(p => p.id === item.beneficiaryId)?.name || 'Commun';
              if (isReal) benMap[ben] = (benMap[ben] || 0) + amount;

          } else if (isRefund) {
              // C'est un remboursement : on déduit des dépenses réelles
              if (isReal) {
                  expenses -= amount;
                  // On réduit aussi le montant dans les stats par catégorie
                  const cat = item.category === 'Dépenses' ? 'Remboursement' : item.category;
                  // Si c'est une catégorie connue, on déduit le montant des stats de cette catégorie
                  if (catMap[cat] !== undefined) {
                      catMap[cat] -= amount;
                  }
              }
          } else {
              // Vrai revenu
              if (isReal) income += amount;
          }

          // Stats par compte
          const accName = accounts.find(a => a.id === item.accountId)?.name || 'N/A';
          if (!accMap[accName]) accMap[accName] = { real: 0, planned: 0 };

          if (isExpense) {
              if (item.source === 'RECURRING') {
                  accMap[accName].planned += item.originalAmount;
              }
              if (isReal) {
                  accMap[accName].real += amount;
              }
          } else if (isRefund && isReal) {
              // Pour un remboursement, on crédite le "réel dépensé" (ça diminue la dépense nette)
              accMap[accName].real -= amount;
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
  }, [relevantItems, people, accounts, categories]);

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

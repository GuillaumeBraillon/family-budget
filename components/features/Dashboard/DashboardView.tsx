
import React, { useMemo } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { StatsSummary } from '../../BudgetPlanner/organisms/StatsSummary'; // A deplacer idealement ou a garder comme composant legacy temporaire si specifique
import { DetailedAnalysis } from '../../BudgetPlanner/organisms/DetailedAnalysis'; // Idem
import { DashboardHeader } from '../../Dashboard/DashboardHeader';
import { SavingsSummaryCard } from '../../Dashboard/SavingsSummaryCard';
import { SummaryColumn } from './components/SummaryColumn';
import { InfoBox } from '../../ui/InfoBox';
import { LayoutDashboard } from 'lucide-react';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, AccountType, SavingsTransaction, VariableTransaction } from '../../../types';

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  savingsTransactions: SavingsTransaction[];
  variableTransactions?: VariableTransaction[];
  onNavigateToPlanner: () => void;
  onNavigateToConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  accounts, people, configs, incomeConfigs, paidItems, settings, savingsTransactions, variableTransactions = [],
  onNavigateToPlanner, 
  onNavigateToConfig 
}) => {
  const currentDate = new Date();
  
  const monthlySettings: AppSettings = useMemo(() => ({
    ...settings,
    period_type: 'FIXED_DAYS',
    period_value: 32 
  }), [settings]);

  const { getStats, filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, currentDate, '', monthlySettings);
  
  const currentMonthStats = getStats(1);

  const savingsAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.SAVINGS), [accounts]);
  
  const currentMonthVars = useMemo(() => {
     const cm = currentDate.getMonth();
     const cy = currentDate.getFullYear();
     return (variableTransactions || []).filter(t => {
         const d = new Date(t.date);
         return d.getMonth() === cm && d.getFullYear() === cy;
     });
  }, [variableTransactions, currentDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <SavingsSummaryCard 
        accounts={savingsAccounts} 
        transactions={savingsTransactions} 
      />

      <DashboardHeader 
        currentDate={currentDate} 
        onNavigateToPlanner={onNavigateToPlanner} 
      />

      <InfoBox 
        title="Centre d'Analyse"
        description="Retrouvez ici la synthèse mensuelle de vos flux financiers. Les indicateurs calculent votre reste à payer global et analysent la contribution de chaque membre du foyer."
        icon={<LayoutDashboard size={18} />}
      />
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex-1 space-y-6 w-full">
               <StatsSummary stats={currentMonthStats} accounts={accounts} />
               <DetailedAnalysis stats={currentMonthStats} people={people} accounts={accounts} />
          </div>

          <div className="w-full xl:w-96 flex-shrink-0">
             <SummaryColumn 
                transactions={currentMonthVars}
                weeks={filteredWeeks}
                incomeConfigs={incomeConfigs}
                people={people}
                settings={settings}
                currentDate={currentDate}
                paidItems={paidItems}
             />
          </div>
      </div>
    </div>
  );
};

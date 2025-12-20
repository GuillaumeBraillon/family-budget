
import React, { useMemo } from 'react';
import { usePlanner } from '../../hooks/usePlanner';
import { StatsSummary } from '../BudgetPlanner/organisms/StatsSummary';
import { DetailedAnalysis } from '../BudgetPlanner/organisms/DetailedAnalysis';
import { DashboardHeader } from './DashboardHeader';
import { SavingsSummaryCard } from './SavingsSummaryCard';
import { SummaryColumn } from '../VariableExpenses/SummaryColumn';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, AccountType, SavingsTransaction, VariableTransaction } from '../../types';

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  savingsTransactions: SavingsTransaction[];
  variableTransactions?: VariableTransaction[]; // Optionnel si pas encore passé par App.tsx, mais recommandé
  onNavigateToPlanner: () => void;
  onNavigateToConfig: () => void;
}

export const DashboardPlaceholder: React.FC<DashboardViewProps> = ({ 
  accounts, people, configs, incomeConfigs, paidItems, settings, savingsTransactions, variableTransactions = [],
  onNavigateToPlanner, 
  onNavigateToConfig 
}) => {
  const currentDate = new Date();
  
  // ASTUCE : On force une configuration "Période unique" pour le dashboard
  const monthlySettings: AppSettings = useMemo(() => ({
    ...settings,
    period_type: 'FIXED_DAYS',
    period_value: 32 // Force une période plus longue que n'importe quel mois
  }), [settings]);

  const { getStats, filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, currentDate, '', monthlySettings);
  
  // On récupère les stats de la "Période 1" qui correspond ici à tout le mois
  const currentMonthStats = getStats(1);

  // Filtrage des comptes d'épargne
  const savingsAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.SAVINGS), [accounts]);
  
  // Filtrage des dépenses variables du mois pour le résumé
  const currentMonthVars = useMemo(() => {
     const cm = currentDate.getMonth();
     const cy = currentDate.getFullYear();
     return variableTransactions.filter(t => {
         const d = new Date(t.date);
         return d.getMonth() === cm && d.getFullYear() === cy;
     });
  }, [variableTransactions, currentDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* COMPTES EPARGNE - VUE REGROUPÉE */}
      <SavingsSummaryCard 
        accounts={savingsAccounts} 
        transactions={savingsTransactions} 
      />

      {/* En-tête du Dashboard */}
      <DashboardHeader 
        currentDate={currentDate} 
        onNavigateToPlanner={onNavigateToPlanner} 
      />
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex-1 space-y-6 w-full">
               {/* Cartes de Synthèse (Reste à payer, Budget Période/Mois) */}
               <StatsSummary stats={currentMonthStats} accounts={accounts} />

               {/* Analyse Détaillée (Flux période, Flux par compte) */}
               <DetailedAnalysis stats={currentMonthStats} people={people} accounts={accounts} />
          </div>

          {/* RÉSUMÉ MENSUEL (Déplacé ici depuis Variables) */}
          <div className="w-full xl:w-96 flex-shrink-0">
             <SummaryColumn 
                transactions={currentMonthVars}
                weeks={filteredWeeks}
                incomeConfigs={incomeConfigs}
                people={people}
                settings={settings}
                currentDate={currentDate}
             />
          </div>
      </div>

    </div>
  );
};

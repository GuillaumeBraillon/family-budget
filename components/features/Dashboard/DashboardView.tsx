
import React, { useMemo, useState } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { DashboardHeader } from './components/DashboardHeader';
import { SavingsSummaryCard } from './components/SavingsSummaryCard';
import { HealthCard, CashFlowCard, ExtrasCard, TopExpensesCard } from './components/AnalyticsCards';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, AccountType, SavingsTransaction, VariableTransaction, PlannedItem } from '../../../types';

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
  const [scope, setScope] = useState<'MONTH' | 'PERIOD'>('MONTH');
  
  // Utilisation du hook planner en mode mensuel complet pour récupérer toutes les données brutes
  const monthlySettings: AppSettings = useMemo(() => ({
    ...settings,
    period_type: 'FIXED_DAYS',
    period_value: 32 // Astuce pour avoir 1 seule grosse période mensuelle par défaut si besoin, mais usePlanner gère déjà le découpage
  }), [settings]);

  // On récupère aussi le découpage réel pour le scope "Période"
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, currentDate, '', settings);
  
  // --- IDENTIFICATION DE LA PÉRIODE COURANTE ---
  const currentDay = currentDate.getDate();
  const currentPeriod = useMemo(() => {
      // Trouve la période qui contient le jour actuel
      return filteredWeeks.find(w => currentDay >= w.startDate && currentDay <= w.endDate) || filteredWeeks[0];
  }, [filteredWeeks, currentDay]);

  const relevantItems: PlannedItem[] = useMemo(() => {
      if (scope === 'MONTH') {
          // Pour le mois, on prend tout (filteredWeeks contient tout le mois découpé)
          return filteredWeeks.flatMap(w => w.items);
      } else {
          // Pour la période, on prend uniquement les items de la période active
          return currentPeriod ? currentPeriod.items : [];
      }
  }, [filteredWeeks, scope, currentPeriod]);

  // --- CALCUL DES KPIS ANALYTIQUES ---
  const analytics = useMemo(() => {
      let income = 0;
      let expenses = 0;
      let plannedExpenses = 0;
      let extras = 0;
      
      const catMap: Record<string, number> = {};
      const benMap: Record<string, number> = {};
      const accMap: Record<string, { real: number, planned: number }> = {};

      relevantItems.forEach(item => {
          // Ignorer les virements internes pour l'analyse pure
          if (item.category === 'Virement Interne') return;

          const amount = item.amount;
          const isExpense = item.type === 'EXPENSE';
          const isReal = item.isPaid;

          // 1. Totaux Globaux
          if (isExpense) {
              if (isReal) expenses += amount;
              plannedExpenses += (item.source === 'RECURRING' ? item.originalAmount : (isReal ? amount : 0)); // Pour le variable non payé, on ne le compte pas en "prévu" sauf si déjà réalisé ? Ou alors on prend tout.
              // Correction logique "Prévu" :
              // - Récurrent : Toujours le montant original
              // - Variable : Le montant réel si payé, sinon 0 (car pas de prévision variable stricte hors budget global)
              
              if (item.isExtra) extras += amount;

              // 2. Répartition Catégorie (Dépenses uniquement)
              const cat = item.category || 'Aucune';
              if (isReal) catMap[cat] = (catMap[cat] || 0) + amount;

              // 3. Répartition Bénéficiaire (Dépenses uniquement)
              const ben = people.find(p => p.id === item.beneficiaryId)?.name || 'Commun';
              if (isReal) benMap[ben] = (benMap[ben] || 0) + amount;

          } else {
              if (isReal) income += amount;
          }

          // 4. Par Compte (Dépenses uniquement pour la santé budgétaire)
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

      // Top Categories
      const topCategories = Object.entries(catMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

      // Top Beneficiaries
      const topBeneficiaries = Object.entries(benMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

      // Account Diff
      const byAccount = Object.entries(accMap).map(([name, vals]) => ({
          name,
          real: vals.real,
          planned: vals.planned,
          diff: vals.planned - vals.real // Positive = Économie, Negative = Dépassement
      })).sort((a, b) => a.diff - b.diff);

      return {
          income,
          expenses,
          plannedExpenses, // Note: Variable expenses only count in planned if paid, usually budget is fixed envelope.
          balance: income - expenses,
          extras,
          savingsRatio: 0,
          topCategories,
          topBeneficiaries,
          byAccount
      };
  }, [relevantItems, people, accounts]);

  // Ajustement du "Prévu" : Pour les dépenses variables, on ajoute le budget période au lieu de la somme des items
  // Car les items variables n'ont pas de "prévision" individuelle avant d'être créés.
  // Pour le mois : Budget Mensuel. Pour la période : Budget de la période trouvée.
  const periodLimit = scope === 'MONTH' ? settings.monthly_envelope : (currentPeriod?.periodLimit || 0); 
  analytics.plannedExpenses += periodLimit; 

  const navTo = (path: string) => {
      if (path === 'planner') onNavigateToPlanner();
      if (path === 'balances') { /* Hack: Balances is a view, managed by App.tsx state. Passed prop needed? No, user provided onNavigateToPlanner only. */ } 
      // Pour simplifier, on redirige tout vers planner ou config si besoin, mais ici on a juste onNavigateToPlanner.
      // On va supposer que le parent gère la navigation si on ajoute des props, sinon on utilise planner par défaut.
      onNavigateToPlanner();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* RÉCAPITULATIF PATRIMOINE (Tous les comptes) */}
      <SavingsSummaryCard 
        accounts={accounts} 
        transactions={savingsTransactions} 
      />

      <DashboardHeader 
        currentDate={currentDate} 
        onNavigateToPlanner={onNavigateToPlanner} 
        scope={scope}
        setScope={setScope}
      />
      
      {/* NOUVELLE GRILLE ANALYTIQUE */}
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

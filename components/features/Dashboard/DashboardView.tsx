/**
 * @file Vue principale du Dashboard (refactorisée)
 * @description Composant orchestrateur simplifié qui délègue les calculs aux hooks spécialisés.
 * Applique les principes Atomic Design + SRP pour une architecture maintenable.
 *
 * @architecture
 * **Refactorisation appliquée :**
 * - Logique de calcul → useDashboardData (globalMonthlyData + annualData)
 * - Composant → Orchestration pure (~60L au lieu de 313L)
 *
 * **Réduction de complexité :**
 * - Avant : 313 lignes, logique mélangée avec UI (2 useMemo massifs)
 * - Après : ~60 lignes, séparation claire des responsabilités
 * - Gain : -81% de code dans le composant, +testabilité
 */
import React, { useState, useMemo } from "react";
import { useDashboardData } from "../../../hooks/dashboard";
import { useBalancesData } from "../../../hooks/balances";
import { usePeriodNav } from "../../../contexts/PeriodNavigationContext";
import { MonthSelector } from "./components/MonthSelector";
import { GlobalMonthlyAnalysis } from "./components/GlobalMonthlyAnalysis";
import { PendingOperationsCard } from "../Balances/components/PendingOperationsCard";
import { FamilyVariableBalanceCard } from "../Balances/components/FamilyVariableBalanceCard";
import { PersonalBudgetSummary } from "../Balances/components/PersonalBudgetSummary";
import { PeriodNavigationBar } from "../../ui/molecules/PeriodNavigationBar";
import {
  Account,
  Person,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  AppSettings,
  VariableTransaction,
  CategoryDef,
  OperationFilters,
  Transfer,
} from "../../../types";
import { useAccountBalancesAtDate } from "../../../hooks/accounts/useAccountBalancesAtDate";
import { SavingsSummaryCard } from "./components/SavingsSummaryCard";

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  transfers?: Transfer[];
  variableTransactions?: VariableTransaction[];
  categories: CategoryDef[];
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
  onNavigateToConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems: paidItemsFromBudget,
  transfers = [],
  settings,
  variableTransactions = [],
  categories,
  onNavigateToPlanner,
}) => {
  // Récupérer les paidItems depuis la prop (chargés par App.tsx via useBudget)
  // --- ÉTAT UI (Navigation année) ---
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- NAVIGATION DE PÉRIODE (partagée via context) ---
  const { currentDate, scope, activeWeek } = usePeriodNav();

  // --- HOOK SPÉCIALISÉ (Logique métier déléguée) ---
  const { globalMonthlyData } = useDashboardData({
    accounts,
    configs,
    incomeConfigs,
    paidItems: paidItemsFromBudget,
    variableTransactions,
    settings,
    categories,
    selectedYear,
  });

  const {
    familyBeneficiaryIds,
    familyVariableBudgetTotal,
    familyVariableNet,
    familyVariableNetBreakdown,
    familyVariableBudgetRemaining,
    pendingVariablesDetails,
    pendingRecurringDetails,
    filteredPeriodBudgets,
    budgetPeriodeGlobal,
    realConsumption,
    distributableBalance,
    consumedDetails,
  } = useBalancesData({
    accounts,
    people,
    configs,
    incomeConfigs,
    paidItems: paidItemsFromBudget,
    variableTransactions,
    settings,
    categories,
    currentDate,
    scope,
    activeWeek,
  });

  const totalPendingRecurring = useMemo(() => pendingRecurringDetails.reduce((sum, d) => sum + d.amount, 0), [pendingRecurringDetails]);

  // --- SOLDES AJUSTÉS À LA PÉRIODE SÉLECTIONNÉE ---
  // En mode MONTH : coupure = dernier jour du mois
  // En mode PERIOD : coupure = dernier jour de la période active
  const cutoffDate = useMemo(() => {
    if (scope === "PERIOD") {
      const activePeriod = filteredPeriodBudgets.find((p) => p.weekNumber === activeWeek);
      if (activePeriod) {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), activePeriod.endDate);
      }
    }
    // Dernier jour du mois sélectionné
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [scope, activeWeek, filteredPeriodBudgets, currentDate]);

  const accountsAtDate = useAccountBalancesAtDate(accounts, paidItemsFromBudget, variableTransactions, transfers, cutoffDate);
  const totalPendingVariables = useMemo(() => pendingVariablesDetails.reduce((sum, d) => sum + d.amount, 0), [pendingVariablesDetails]);
  const totalPending = totalPendingRecurring + totalPendingVariables;

  const standardNet = familyVariableNetBreakdown?.nature.standard || 0;
  const refundsAmount = familyVariableNetBreakdown?.nature.refunds || 0;
  const extraNet = familyVariableNetBreakdown?.nature.extra || 0;
  const realNet = familyVariableNetBreakdown?.status.real ?? 0;
  const waitingNet = familyVariableNetBreakdown?.status.waiting || 0;
  const waitingStandardNet = familyVariableNetBreakdown?.status.waitingStandard ?? 0;
  const totalNet = familyVariableNetBreakdown?.status.real ?? familyVariableNet;
  const displayedFamilyNet = standardNet - waitingStandardNet;

  const handleNavigateToOperations = (date: Date, filters: Partial<OperationFilters>) => {
    onNavigateToPlanner(date, filters, scope === "PERIOD" ? activeWeek : undefined);
  };

  // Budget personnel calculé sur le mois entier → toujours ouvrir en vue mois (sans weekNumber)
  const handleNavigateToMonth = (date: Date, filters: Partial<OperationFilters>) => {
    onNavigateToPlanner(date, filters, undefined);
  };

  return (
    <div className="flex flex-col gap-1.5 md:gap-2 m-2">
      {/* Navigation de période */}
      <PeriodNavigationBar filteredPeriodBudgets={filteredPeriodBudgets} />

      {/* SECTION ÉPARGNE */}
      <SavingsSummaryCard accounts={accountsAtDate} />

      {/* SECTION SOLDES : Opérations en attente + Budget variable Famille */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 md:gap-2">
        {/* SECTION OPÉRATIONS EN ATTENTE */}
        <PendingOperationsCard
          remainingToPay={totalPending}
          pendingRecurring={totalPendingRecurring}
          totalPendingVariable={totalPendingVariables}
          currentDate={currentDate}
          onNavigate={handleNavigateToOperations}
        />
        {/* SECTION BUDGET FAMILLE */}
        <FamilyVariableBalanceCard
          familyVariableBudgetTotal={familyVariableBudgetTotal}
          familyVariableNet={familyVariableNet}
          familyVariableRemaining={familyVariableBudgetRemaining}
          standardNet={standardNet}
          refundsAmount={refundsAmount}
          extraNet={extraNet}
          totalNet={totalNet}
          realNet={realNet}
          waitingNet={waitingNet}
          displayedFamilyNet={displayedFamilyNet}
          familyBeneficiaryIds={familyBeneficiaryIds}
          currentDate={currentDate}
          onNavigate={handleNavigateToOperations}
        />
        {/* SECTION BUDGET PERSONNEL */}
        <PersonalBudgetSummary
          totalPersonalBudget={budgetPeriodeGlobal}
          spentPersonalBudget={realConsumption}
          distributableBudget={distributableBalance}
          beneficiariesDetails={consumedDetails}
          currentDate={currentDate}
          onNavigateToOperations={handleNavigateToMonth}
        />
      </div>

      {/* SÉLECTEUR D'ANNÉE */}
      <MonthSelector currentDate={new Date()} year={selectedYear} onYearChange={setSelectedYear} />

      {/* SECTION MACRO : Trésorerie Globale & Épargne */}
      <GlobalMonthlyAnalysis data={globalMonthlyData} year={selectedYear} onNavigateToPlanner={onNavigateToPlanner} />
    </div>
  );
};

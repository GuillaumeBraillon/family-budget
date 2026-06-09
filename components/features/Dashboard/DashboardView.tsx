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
import { GlobalMonthlyAnalysis } from "./components/GlobalMonthlyAnalysis";
import { PendingOperationsCard } from "../Balances/components/PendingOperationsCard";
import { FamilyVariableBalanceCard } from "../Balances/components/FamilyVariableBalanceCard";
import { SimplifiedFamilyCard } from "./components/SimplifiedFamilyCard";
import { SavingsJointFlowsCard } from "./components/SavingsJointFlowsCard";
import { PersonalBudgetSummary } from "../Balances/components/PersonalBudgetSummary";
import { PeriodNavigationBar } from "../../ui/molecules/PeriodNavigationBar";
import {
  Account,
  AccountType,
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
import { SavingsByCategoryCard } from "./components/SavingsByCategoryCard";

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
    familyVariableBudgetTotalAmount,
    familyVariableMonthBudgetAmount,
    familyVariablePeriodsCount,
    familyVariablePeriodValue,
    familyVariableNetAmount,
    familyVariableNetBreakdown,
    familyVariableBudgetRemainingAmount,
    paidRecurringAmount,
    paidRecurringNetAmount,
    totalRecurringAmount,
    pendingVariableDetails,
    pendingRecurringDetails,
    filteredPeriodBudgets,
    totalPersonalBudgetAmount,
    personalBudgetConsumedAmount,
    totalPersonalRemainingAmount,
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

  const totalPendingRecurringAmount = useMemo(() => pendingRecurringDetails.reduce((sum, d) => sum + d.amount, 0), [pendingRecurringDetails]);

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
  const totalPendingVariableAmount = useMemo(() => pendingVariableDetails.reduce((sum, d) => sum + d.amount, 0), [pendingVariableDetails]);
  const totalPendingAmount = totalPendingRecurringAmount + totalPendingVariableAmount;

  const savingsJointFlowSummary = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const selectedPeriod = filteredPeriodBudgets.find((period) => period.weekNumber === activeWeek);
    const accountById = new Map(accountsAtDate.map((acc) => [acc.id, acc]));
    const pairTotals = new Map<string, { from: string; to: string; amount: number }>();
    const usedBySavingsAccount = new Map<string, number>();

    const addPairTotal = (from: string, to: string, amount: number) => {
      if (amount <= 0) return;
      const key = `${from}__${to}`;
      const existing = pairTotals.get(key);
      if (existing) {
        existing.amount += amount;
      } else {
        pairTotals.set(key, { from, to, amount });
      }
    };

    const isInSelectedScope = (dateString: string): boolean => {
      const date = new Date(dateString);
      const inCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      if (!inCurrentMonth) return false;

      if (scope === "MONTH") return true;
      if (!selectedPeriod) return false;

      const day = date.getDate();
      return day >= selectedPeriod.startDate && day <= selectedPeriod.endDate;
    };

    let savedAmount = 0;
    let usedAmount = 0;

    transfers.forEach((transfer) => {
      if (!isInSelectedScope(transfer.date)) return;

      const source = accountById.get(transfer.sourceAccountId);
      const destination = accountById.get(transfer.destinationAccountId);
      if (!source || !destination) return;

      if (source.type === AccountType.SAVINGS && destination.isJoint === true) {
        usedAmount += transfer.amount;
        usedBySavingsAccount.set(source.id, (usedBySavingsAccount.get(source.id) || 0) + transfer.amount);
      } else if (source.isJoint === true && destination.type === AccountType.SAVINGS) {
        savedAmount += transfer.amount;
        addPairTotal(source.name, destination.name, transfer.amount);
      }
    });

    const savingsRows = accountsAtDate
      .filter((acc) => acc.type === AccountType.SAVINGS)
      .map((acc) => {
        const used = usedBySavingsAccount.get(acc.id) || 0;
        return {
          accountName: acc.name,
          balance: acc.currentBalance,
          usedAmount: used,
          netAfterUsed: acc.currentBalance - used,
        };
      })
      .sort((a, b) => a.accountName.localeCompare(b.accountName));

    const savingsBalanceTotal = savingsRows.reduce((sum, row) => sum + row.balance, 0);
    const savingsNetAfterUsed = savingsRows.reduce((sum, row) => sum + row.netAfterUsed, 0);

    const lines = Array.from(pairTotals.values()).sort((a, b) => {
      const fromCompare = a.from.localeCompare(b.from);
      if (fromCompare !== 0) return fromCompare;
      return a.to.localeCompare(b.to);
    });

    return {
      savedAmount,
      usedAmount,
      savingsBalanceTotal,
      savingsNetAfterUsed,
      lines,
      savingsRows,
    };
  }, [transfers, currentDate, scope, filteredPeriodBudgets, activeWeek, accountsAtDate]);

  // --- CALCUL DES RETARDS (OPÉRATIONS EN ATTENTE AVANT LA COUPURE) ---
  const overduePendingRecurringAmount = useMemo(() => {
    return filteredPeriodBudgets
      .filter((period) => period.weekNumber < activeWeek)
      .flatMap((period) => period.items)
      .filter(
        (item) => item.source === "RECURRING" && !item.isPaid && item.category !== "Virement Interne" && item.subCategory !== "Intérêts" && !item.isSalary
      )
      .reduce((sum, item) => sum + (item.type === "INCOME" ? -item.amount : item.amount), 0);
  }, [filteredPeriodBudgets, activeWeek]);

  // Même logique pour les variables
  const overduePendingVariableAmount = useMemo(() => {
    return filteredPeriodBudgets
      .filter((period) => period.weekNumber < activeWeek)
      .flatMap((period) => period.items)
      .filter((item) => item.source === "VARIABLE" && !item.isPaid && item.category !== "Virement Interne" && item.subCategory !== "Intérêts" && !item.isSalary)
      .reduce((sum, item) => sum + (item.type === "INCOME" ? -item.amount : item.amount), 0);
  }, [filteredPeriodBudgets, activeWeek]);

  const standardAmount = familyVariableNetBreakdown?.nature.standard || 0;
  const refundsAmount = familyVariableNetBreakdown?.nature.refunds || 0;
  const extraAmount = familyVariableNetBreakdown?.nature.extra || 0;
  const realAmount = familyVariableNetBreakdown?.status.real ?? 0;
  const waitingAmount = familyVariableNetBreakdown?.status.waiting || 0;
  const waitingStandardAmount = familyVariableNetBreakdown?.status.waitingStandard ?? 0;
  const totalAmount = familyVariableNetBreakdown?.status.real ?? familyVariableNetAmount;
  const displayedFamilyAmount = standardAmount - waitingStandardAmount;

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
        {/* Budget personnel (Mensuel) */}
        <PersonalBudgetSummary
          totalPersonalBudgetAmount={totalPersonalBudgetAmount}
          spentPersonalBudgetAmount={personalBudgetConsumedAmount}
          totalPersonalRemainingAmount={totalPersonalRemainingAmount}
          beneficiariesDetails={consumedDetails}
          currentDate={currentDate}
          onNavigateToOperations={handleNavigateToMonth}
        />

        {/* Flux Joint / Épargne */}
        <SavingsJointFlowsCard summary={savingsJointFlowSummary} />

        {/* Suivi du mois */}
        <SimplifiedFamilyCard
          familyVariableBudgetTotalAmount={familyVariableBudgetTotalAmount}
          displayedFamilyAmount={displayedFamilyAmount}
          familyBeneficiaryIds={familyBeneficiaryIds}
          paidRecurringNetAmount={paidRecurringNetAmount}
          totalPendingRecurringAmount={totalPendingRecurringAmount}
          currentDate={currentDate}
          onNavigateToOperations={handleNavigateToOperations}
        />

        {/* Budget Famille */}
        <FamilyVariableBalanceCard
          familyVariableBudgetTotalAmount={familyVariableBudgetTotalAmount}
          familyVariableMonthBudgetAmount={familyVariableMonthBudgetAmount}
          familyVariablePeriodsCount={familyVariablePeriodsCount}
          familyVariablePeriodValue={familyVariablePeriodValue ?? 0}
          familyVariableNetAmount={familyVariableNetAmount}
          familyVariableRemainingAmount={familyVariableBudgetRemainingAmount}
          standardAmount={standardAmount}
          refundsAmount={refundsAmount}
          extraAmount={extraAmount}
          totalAmount={totalAmount}
          realAmount={realAmount}
          waitingAmount={waitingAmount}
          displayedFamilyAmount={displayedFamilyAmount}
          familyBeneficiaryIds={familyBeneficiaryIds}
          currentDate={currentDate}
          onNavigateToOperations={handleNavigateToOperations}
        />

        {/* Opérations en attente*/}
        <PendingOperationsCard
          totalPendingAmount={totalPendingAmount}
          totalPendingRecurringAmount={totalPendingRecurringAmount}
          totalPendingVariableAmount={totalPendingVariableAmount}
          paidRecurringAmount={paidRecurringAmount}
          paidRecurringNetAmount={paidRecurringNetAmount}
          totalRecurringAmount={totalRecurringAmount}
          overduePendingRecurringAmount={overduePendingRecurringAmount}
          overduePendingVariableAmount={overduePendingVariableAmount}
          currentDate={currentDate}
          onNavigateToOperations={handleNavigateToOperations}
        />
      </div>

      {/* Soldes par catégorie */}
      <SavingsByCategoryCard
        accounts={accounts}
        configs={configs}
        incomeConfigs={incomeConfigs}
        paidItems={paidItemsFromBudget}
        variableTransactions={variableTransactions}
        categories={categories}
        year={selectedYear}
        onYearChange={setSelectedYear}
        onNavigateToPlanner={onNavigateToPlanner}
        people={people}
      />

      {/* Trésorerie Globale & Épargne */}
      <GlobalMonthlyAnalysis data={globalMonthlyData} year={selectedYear} onNavigateToPlanner={onNavigateToPlanner} onYearChange={setSelectedYear} />
    </div>
  );
};

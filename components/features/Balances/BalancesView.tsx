/**
 * @file Vue des soldes bancaires (refactorisée)
 * @description Composant orchestrateur simplifié qui délègue les calculs aux hooks spécialisés.
 * Applique les principes Atomic Design + SRP pour une architecture maintenable.
 *
 * @architecture
 * **Refactorisation appliquée :**
 * - Logique de calcul → useBalancesData (carryovers, consommations, détails)
 * - Génération des lignes → useBalancesRows (personal/joint avec redistribution)
 * - Composant → Orchestration pure (~150L au lieu de 788L)
 *
 * **Réduction de complexité :**
 * - Avant : 788 lignes, logique mélangée avec UI
 * - Après : ~150 lignes, séparation claire des responsabilités
 * - Gain : -80% de code dans le composant, +testabilité
 */
import React, { useMemo } from "react";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction, CategoryDef, OperationFilters } from "../../../types";
import { useBalancesData, useBalancesRows } from "../../../hooks/balances";
import { usePeriodNav } from "../../../contexts/PeriodNavigationContext";
import { getBeneficiaryStandardShare, isBudgetExcluded } from "../../../services/financeUtils";
import { PeriodNavigationBar } from "../../ui/molecules/PeriodNavigationBar";
import { BalancesTable } from "./components/BalancesTable";
import { TransferSummaryCard } from "./components/TransferSummaryCard";

interface BalancesViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  categories: CategoryDef[];
  onUpdateAccount: (account: Account) => void;
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  settings,
  categories,
  onUpdateAccount,
  onNavigateToPlanner,
}) => {
  // --- NAVIGATION DE PÉRIODE (partagée via context) ---
  const { currentDate, scope, activeWeek } = usePeriodNav();

  // --- HOOKS SPÉCIALISÉS (Logique métier déléguée) ---

  // Hook 1 : Calculs de données (carryovers, budget, consommation, détails)
  const { totalPersonalRemainingAmount, jointAccount, personalAccounts, consumedDetails, stats, filteredPeriodBudgets } = useBalancesData({
    accounts,
    people,
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    settings,
    categories,
    currentDate,
    scope,
    activeWeek,
  });

  // Hook 2 : Génération des lignes avec redistribution 2-pass
  const { jointRows, personalRows, totalPersonalRow, transferSummary } = useBalancesRows({
    people,
    jointAccount,
    personalAccounts,
    consumedDetails,
    stats,
  });

  // --- HANDLERS ---

  const handleUpdateBalance = (id: string, newBalance: number) => {
    const account = accounts.find((a) => a.id === id);
    if (account) {
      onUpdateAccount({ ...account, currentBalance: newBalance });
    }
  };

  const relevantPendingItems = useMemo(() => {
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((period) => period.weekNumber <= activeWeek);

    return relevantPeriods.flatMap((period) => period.items).filter((item) => !item.isPaid && !item.isSalary && !isBudgetExcluded(item));
  }, [filteredPeriodBudgets, scope, activeWeek]);

  const relevantPaidItems = useMemo(() => {
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((period) => period.weekNumber <= activeWeek);

    return relevantPeriods.flatMap((period) => period.items).filter((item) => item.isPaid && !item.isSalary && !isBudgetExcluded(item));
  }, [filteredPeriodBudgets, scope, activeWeek]);

  const accountOwnerIdByAccountId = useMemo(() => {
    return personalAccounts.reduce<Record<string, string>>((acc, account) => {
      acc[account.id] = account.ownerId;
      return acc;
    }, {});
  }, [personalAccounts]);

  const personalPendingByBeneficiaryId = useMemo(() => {
    const ownerIds = Array.from(new Set(personalAccounts.map((account) => account.ownerId)));

    return ownerIds.reduce<Record<string, number>>((acc, ownerId) => {
      const pendingAmount = relevantPendingItems.reduce((sum, item) => {
        const ownerShare = getBeneficiaryStandardShare(item, ownerId);
        if (ownerShare <= 0) return sum;
        return sum + (item.type === "EXPENSE" ? -ownerShare : ownerShare);
      }, 0);

      acc[ownerId] = pendingAmount;
      return acc;
    }, {});
  }, [personalAccounts, relevantPendingItems]);

  const personalPaidConsumedByBeneficiaryId = useMemo(() => {
    const ownerIds = Array.from(new Set(personalAccounts.map((account) => account.ownerId)));

    return ownerIds.reduce<Record<string, number>>((acc, ownerId) => {
      const paidConsumedAmount = relevantPaidItems.reduce((sum, item) => {
        const ownerShare = getBeneficiaryStandardShare(item, ownerId);
        if (ownerShare <= 0) return sum;
        return sum + (item.type === "EXPENSE" ? ownerShare : -ownerShare);
      }, 0);

      acc[ownerId] = paidConsumedAmount;
      return acc;
    }, {});
  }, [personalAccounts, relevantPaidItems]);

  const excessAccounts = useMemo(() => {
    return personalRows
      .map((row) => {
        const ownerId = accountOwnerIdByAccountId[row.id];
        const countedPendingAmount = ownerId ? (personalPendingByBeneficiaryId[ownerId] ?? 0) : 0;
        const paidConsumedAmount = ownerId ? (personalPaidConsumedByBeneficiaryId[ownerId] ?? 0) : 0;
        const availableTarget = (row.target ?? 0) - countedPendingAmount;
        const accountPendingAmount = row.pendingAmount ?? 0;
        const pendingCreditAmount = Math.max(accountPendingAmount, 0);
        const hasPendingCredit = pendingCreditAmount > 0.01;
        const availableTotal = availableTarget + paidConsumedAmount;
        const immediateAmount = row.balance - availableTarget;
        const projectedAmount = immediateAmount + pendingCreditAmount;
        const personalProjectedAmount = availableTarget + countedPendingAmount;
        const hasSamePendingAmount = Math.abs(accountPendingAmount - countedPendingAmount) < 0.01;

        return {
          accountId: row.id,
          accountName: row.name,
          excessAmount: hasPendingCredit ? projectedAmount : immediateAmount,
          countedPendingAmount,
          paidConsumedAmount,
          accountPendingAmount,
          pendingCreditAmount,
          hasPendingCredit,
          availableTarget,
          availableTotal,
          immediateAmount,
          projectedAmount,
          personalProjectedAmount,
          hasSamePendingAmount,
        };
      })
      .filter((entry) => entry.excessAmount > 0.01)
      .sort((a, b) => b.excessAmount - a.excessAmount);
  }, [personalRows, accountOwnerIdByAccountId, personalPendingByBeneficiaryId, personalPaidConsumedByBeneficiaryId]);

  const deficitAccounts = useMemo(() => {
    return personalRows
      .map((row) => {
        const ownerId = accountOwnerIdByAccountId[row.id];
        const countedPendingAmount = ownerId ? (personalPendingByBeneficiaryId[ownerId] ?? 0) : 0;
        const paidConsumedAmount = ownerId ? (personalPaidConsumedByBeneficiaryId[ownerId] ?? 0) : 0;
        const availableTarget = (row.target ?? 0) - countedPendingAmount;
        const accountPendingAmount = row.pendingAmount ?? 0;
        const pendingCreditAmount = Math.max(accountPendingAmount, 0);
        const hasPendingCredit = pendingCreditAmount > 0.01;
        const availableTotal = availableTarget + paidConsumedAmount;
        const immediateAmount = availableTarget - row.balance;
        const projectedAmount = immediateAmount - pendingCreditAmount;
        const personalProjectedAmount = availableTarget + countedPendingAmount;

        return {
          accountId: row.id,
          accountName: row.name,
          deficitAmount: hasPendingCredit ? projectedAmount : immediateAmount,
          countedPendingAmount,
          paidConsumedAmount,
          accountPendingAmount,
          pendingCreditAmount,
          hasPendingCredit,
          availableTarget,
          availableTotal,
          immediateAmount,
          projectedAmount,
          personalProjectedAmount,
        };
      })
      .filter((entry) => entry.deficitAmount > 0.01)
      .sort((a, b) => b.deficitAmount - a.deficitAmount);
  }, [personalRows, accountOwnerIdByAccountId, personalPendingByBeneficiaryId, personalPaidConsumedByBeneficiaryId]);

  return (
    <div className="flex flex-col gap-1.5 md:gap-2 m-2">
      {/* Navigation de période */}
      <PeriodNavigationBar filteredPeriodBudgets={filteredPeriodBudgets} />

      {jointRows.length > 0 && (
        <BalancesTable
          title="Compte Pivot"
          rows={jointRows}
          onUpdateBalance={handleUpdateBalance}
          onNavigateToPlanner={onNavigateToPlanner}
          currentDate={currentDate}
          activeWeek={scope === "PERIOD" ? activeWeek : undefined}
        />
      )}

      <BalancesTable
        title="Comptes Courants"
        rows={personalRows}
        onUpdateBalance={handleUpdateBalance}
        totalRow={totalPersonalRow}
        onNavigateToPlanner={onNavigateToPlanner}
        currentDate={currentDate}
        activeWeek={scope === "PERIOD" ? activeWeek : undefined}
        totalPersonalRemainingAmount={totalPersonalRemainingAmount}
        excessAccounts={excessAccounts}
        deficitAccounts={deficitAccounts}
      />

      <TransferSummaryCard transferSummary={transferSummary} />
    </div>
  );
};

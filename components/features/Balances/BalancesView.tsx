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
 */
import React, { useMemo } from "react";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction, CategoryDef, OperationFilters } from "../../../types";
import { useBalancesData, useBalancesRows } from "../../../hooks/balances";
import { usePeriodNav } from "../../../contexts/PeriodNavigationContext";
import { useAdminView } from "../../../contexts/AdminViewContext";
import { getBeneficiaryStandardShare, isBudgetExcluded } from "../../../services/financeUtils";
import { computePersonalVariance } from "../../../hooks/balances/varianceUtils";
import { PeriodNavigationBar } from "../../ui/molecules/PeriodNavigationBar";
import { TransferSummaryCard } from "./components/TransferSummaryCard";
import { BalancesTable } from "./components/BalancesTable";

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
  isAdmin?: boolean;
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
  isAdmin: actualIsAdmin = false,
}) => {
  // --- NAVIGATION DE PÉRIODE (partagée via context) ---
  const { currentDate, scope, activeWeek } = usePeriodNav();
  const { viewAsNonAdmin } = useAdminView();
  const canEditBalances = actualIsAdmin && !viewAsNonAdmin;

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
    if (!canEditBalances) return;

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

  const personalVarianceAccounts = useMemo(() => {
    return personalRows.map((row) => {
      const ownerId = accountOwnerIdByAccountId[row.id];
      const countedPendingAmount = ownerId ? (personalPendingByBeneficiaryId[ownerId] ?? 0) : 0;
      const paidConsumedAmount = ownerId ? (personalPaidConsumedByBeneficiaryId[ownerId] ?? 0) : 0;
      const availableTarget = row.target ?? 0;
      const accountPendingAmount = row.pendingAmount ?? 0;

      const variance = computePersonalVariance({
        balance: row.balance,
        availableTarget,
        paidConsumedAmount,
        countedPendingAmount,
        accountPendingAmount,
      });

      return {
        accountId: row.id,
        beneficiaryId: ownerId,
        accountName: row.name,
        countedPendingAmount,
        paidConsumedAmount,
        accountPendingAmount,
        availableTarget,
        ...variance,
      };
    });
  }, [personalRows, accountOwnerIdByAccountId, personalPendingByBeneficiaryId, personalPaidConsumedByBeneficiaryId]);

  const excessAccounts = useMemo(() => {
    return personalVarianceAccounts
      .map((entry) => ({ ...entry, excessAmount: entry.immediateAmount }))
      .filter((entry) => entry.excessAmount > 0.01)
      .sort((a, b) => b.excessAmount - a.excessAmount);
  }, [personalVarianceAccounts]);

  const deficitAccounts = useMemo(() => {
    return personalVarianceAccounts
      .map((entry) => ({ ...entry, deficitAmount: -entry.immediateAmount }))
      .filter((entry) => entry.deficitAmount > 0.01)
      .sort((a, b) => b.deficitAmount - a.deficitAmount);
  }, [personalVarianceAccounts]);

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
          canEditBalances={canEditBalances}
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
        varianceAccounts={personalVarianceAccounts}
        excessAccounts={excessAccounts}
        deficitAccounts={deficitAccounts}
        canEditBalances={canEditBalances}
      />

      <TransferSummaryCard transferSummary={transferSummary} />
    </div>
  );
};

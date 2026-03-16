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

  const excessAccounts = useMemo(() => {
    return personalAccounts
      .map((account) => {
        const ownerDetails = consumedDetails.find((detail) => detail.beneficiaryId === account.ownerId);
        const ownerRemaining = ownerDetails?.remaining ?? 0;
        const excessAmount = account.currentBalance - ownerRemaining;

        return {
          accountName: account.name,
          excessAmount,
        };
      })
      .filter((entry) => entry.excessAmount > 0.01)
      .sort((a, b) => b.excessAmount - a.excessAmount);
  }, [personalAccounts, consumedDetails]);

  const deficitAccounts = useMemo(() => {
    return personalAccounts
      .map((account) => {
        const ownerDetails = consumedDetails.find((detail) => detail.beneficiaryId === account.ownerId);
        const ownerRemaining = ownerDetails?.remaining ?? 0;
        const deficitAmount = ownerRemaining - account.currentBalance;

        return {
          accountName: account.name,
          deficitAmount,
        };
      })
      .filter((entry) => entry.deficitAmount > 0.01)
      .sort((a, b) => b.deficitAmount - a.deficitAmount);
  }, [personalAccounts, consumedDetails]);

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

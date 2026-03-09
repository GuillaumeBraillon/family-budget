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
import { useAccountsSorting } from "../../../hooks/accounts/useAccountsSorting";
import { usePeriodNav } from "../../../contexts/PeriodNavigationContext";
import { PeriodNavigationBar } from "../../ui/molecules/PeriodNavigationBar";
import { BalancesTable } from "./components/BalancesTable";
import { TransferSummaryCard } from "./components/TransferSummaryCard";
import { arrayMove } from "@dnd-kit/sortable";

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
  onUpdateAccountsSorting: (newSorting: string[]) => void;
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
  onUpdateAccountsSorting,
  onNavigateToPlanner,
}) => {
  // --- NAVIGATION DE PÉRIODE (partagée via context) ---
  const { currentDate, scope, activeWeek } = usePeriodNav();

  // --- TRI MANUEL ---
  const { sortAccounts, sortKey } = useAccountsSorting(settings.accounts_sorting || []);
  const sortedAccounts = useMemo(() => sortAccounts(accounts), [accounts, sortAccounts]);

  const handleAccountMove = (id: string, newIndex: number) => {
    const currentList = sortedAccounts;
    const oldIndex = currentList.findIndex((a) => a.id === id);
    if (oldIndex === -1) return;

    const reordered = arrayMove<Account>(currentList, oldIndex, newIndex);
    const newSortingIds = reordered.map((a) => a.id);
    onUpdateAccountsSorting(newSortingIds);
  };

  // --- HOOKS SPÉCIALISÉS (Logique métier déléguée) ---

  // Hook 1 : Calculs de données (carryovers, budget, consommation, détails)
  const { distributableBudgetAmount, jointAccount, personalAccounts, consumedDetails, stats, filteredPeriodBudgets } = useBalancesData({
    accounts: sortedAccounts,
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
  const { jointRows, personalRows, totalPersonalRow, virLddsTotal, lddsToJoint, lddsToPersonals } = useBalancesRows({
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

  // Récupération de la dette totale pour l'affichage header

  // Détection du surplus des comptes courants (pour labels intelligents)
  const hasCurrentAccountsSurplus = personalRows.some((r) => r.transfer < -10);

  return (
    <div className="flex flex-col gap-1.5 md:gap-2 m-2">
      {/* Navigation de période */}
      <PeriodNavigationBar filteredPeriodBudgets={filteredPeriodBudgets} />

      {jointRows.length > 0 && (
        <BalancesTable
          title="Compte Pivot"
          rows={jointRows}
          onUpdateBalance={handleUpdateBalance}
          hasCurrentAccountsSurplus={hasCurrentAccountsSurplus}
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
        distributableAmount={distributableBudgetAmount}
        onMove={handleAccountMove}
        isManualSort={sortKey === "manual"}
      />

      <TransferSummaryCard amount={virLddsTotal} toJoint={lddsToJoint} toPersonals={lddsToPersonals} />
    </div>
  );
};

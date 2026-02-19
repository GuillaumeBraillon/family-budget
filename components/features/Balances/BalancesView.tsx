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
import React, { useState, useMemo } from "react";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction, CategoryDef, OperationFilters } from "../../../types";
import { useBalancesData, useBalancesRows } from "../../../hooks/balances";
import { useAccountsSorting, AccountSortKey } from "../../../hooks/accounts/useAccountsSorting";
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { ScopeSelector } from "../../ui/molecules/ScopeSelector";
import { WeekSelector } from "../../ui/molecules/WeekSelector";
import { BalancesHeader } from "./components/BalancesHeader";
import { BalancesTable } from "./components/BalancesTable";
import { TransferSummaryCard } from "./components/TransferSummaryCard";
import { BudgetDistributionSummary } from "./components/BudgetDistributionSummary";
import { CalculationDetailsCard } from "./components/CalculationDetailsCard";
import { ListSorter } from "../../ui/molecules/ListSorter";
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
  // --- ÉTAT UI (Navigation) ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scope, setScope] = useState<"MONTH" | "PERIOD">("PERIOD");

  // Déterminer la période active (semaine actuelle du mois affiché)
  const getWeekFromDate = (date: Date): number => {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  const [activeWeek, setActiveWeek] = useState(() => {
    const today = new Date();
    // Si on affiche le mois en cours, utiliser la période actuelle
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      return getWeekFromDate(today);
    }
    // Sinon, première période du mois
    return 1;
  });

  // --- TRI MANUEL ---
  const { sortAccounts, sortKey, sortOrder, setSorting } = useAccountsSorting(settings.accounts_sorting || []);
  const sortedAccounts = useMemo(() => sortAccounts(accounts), [accounts, sortAccounts]);

  const accountSortOptions = [
    { key: "manual", label: "Manuel" },
    { key: "name", label: "Nom" },
    { key: "balance", label: "Solde" },
    { key: "type", label: "Type" },
  ];

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
  const {
    periodCarryovers,
    budgetPeriodeGlobal,
    pendingRecurring: _pendingRecurring,
    realConsumption,
    distributableBalance,
    checkingAccounts,
    jointAccount,
    personalAccounts,
    totalPersonalBalance,
    pendingVariablesDetails,
    pendingRecurringDetails,
    totalDebtDetails,
    consumedDetails,
    stats,
    filteredPeriodBudgets,
  } = useBalancesData({
    accounts: sortedAccounts,
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
    _accounts: accounts,
    people,
    budgetPeriodeGlobal,
    totalPersonalBalance,
    distributableBalance,
    jointAccount,
    personalAccounts,
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
  const _totalPendingHeader = checkingAccounts.reduce((sum, acc) => {
    return sum + (stats.byAccount[acc.id]?.remaining || 0);
  }, 0);

  // Détection du surplus des comptes courants (pour labels intelligents)
  const hasCurrentAccountsSurplus = personalRows.some((r) => r.transfer < -10);

  // Handler pour navigation vers Opérations
  const handleNavigateToOperations = (date: Date, filters: Record<string, unknown>) => {
    onNavigateToPlanner(date, filters as Partial<OperationFilters>, scope === "PERIOD" ? activeWeek : undefined);
  };

  // Handlers de navigation
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); // Éviter le bug du "31 février"
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setActiveWeek(1); // Réinitialiser à la première période
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); // Éviter le bug du "31 février"
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setActiveWeek(1); // Réinitialiser à la première période
  };

  return (
    <div className="space-y-1 animate-in fade-in duration-500">
      {/* Navigation de période */}
      <div className="flex flex-row gap-1.5 md:gap-2 items-center flex-wrap">
        <MonthNavigator date={currentDate} onPrev={handlePrevMonth} onNext={handleNextMonth} />
        <ScopeSelector scope={scope} onScopeChange={setScope} />
        {scope === "PERIOD" && <WeekSelector weeks={filteredPeriodBudgets} activeWeek={activeWeek} onSelect={setActiveWeek} searchQuery="" showBadge={false} />}
      </div>

      <BalancesHeader
        resteAPayer={jointAccount ? stats.byAccount[jointAccount.id]?.remaining || 0 : 0}
        pendingRecurring={jointAccount ? pendingRecurringDetails.find((d) => d.name === jointAccount.name)?.amount || 0 : 0}
        pendingVariablesDetails={jointAccount ? pendingVariablesDetails.filter((d) => d.name === jointAccount.name) : []}
        pendingRecurringDetails={jointAccount ? pendingRecurringDetails.filter((d) => d.name === jointAccount.name) : []}
        totalDetails={jointAccount ? totalDebtDetails.filter((d) => d.name === jointAccount.name) : []}
        currentDate={currentDate}
        activeWeek={scope === "PERIOD" ? activeWeek : undefined}
        onNavigateToOperations={handleNavigateToOperations}
      />

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

      {/* SECTION RÉPARTITION BUDGÉTAIRE */}
      <BudgetDistributionSummary
        totalEnvelope={budgetPeriodeGlobal}
        usedEnvelope={realConsumption}
        distributable={distributableBalance}
        consumedDetails={consumedDetails}
        previousCarryover={scope === "PERIOD" && activeWeek > 1 ? periodCarryovers[activeWeek - 1]?.carryover : undefined}
        budgetBase={scope === "PERIOD" ? periodCarryovers[activeWeek]?.budgetBase : undefined}
        carryoverStrategy={settings.carryover_strategy || "NEXT_PERIOD"}
      />

      <div className="flex justify-end mb-2">
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <ListSorter options={accountSortOptions} currentSort={sortKey} currentOrder={sortOrder} onSortChange={(k, o) => setSorting(k as AccountSortKey, o)} />
        </div>
      </div>

      <BalancesTable
        title="Comptes Courants"
        rows={personalRows}
        onUpdateBalance={handleUpdateBalance}
        totalRow={totalPersonalRow}
        onNavigateToPlanner={onNavigateToPlanner}
        currentDate={currentDate}
        activeWeek={scope === "PERIOD" ? activeWeek : undefined}
        distributableAmount={distributableBalance}
        onMove={handleAccountMove}
        isManualSort={sortKey === "manual"}
      />

      <TransferSummaryCard amount={virLddsTotal} toJoint={lddsToJoint} toPersonals={lddsToPersonals} />

      {/* SECTION DÉTAILS DES CALCULS */}
      <CalculationDetailsCard
        budgetPeriod={budgetPeriodeGlobal}
        consumption={realConsumption}
        distributable={distributableBalance}
        totalPersonalBalance={totalPersonalBalance}
        personalExcess={totalPersonalBalance - distributableBalance}
        jointGap={jointAccount ? (stats.byAccount[jointAccount.id]?.remaining || 0) - jointAccount.currentBalance : 0}
        amountToTake={Math.max(
          0,
          Math.min(
            jointAccount ? (stats.byAccount[jointAccount.id]?.remaining || 0) - jointAccount.currentBalance : 0,
            totalPersonalBalance - distributableBalance
          )
        )}
        totalSurplus={personalRows.reduce((sum, r) => sum + Math.abs(Math.min(0, r.transfer)), 0)}
        lddsNeeded={virLddsTotal}
      />
    </div>
  );
};

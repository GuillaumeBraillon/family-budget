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
import React, { useState } from "react";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction, CategoryDef, OperationFilters } from "../../../types";
import { useBalancesData, useBalancesRows } from "../../../hooks/balances";
import { Calendar, CalendarRange } from "lucide-react";
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { WeekSelector } from "../../ui/molecules/WeekSelector";
import { BalancesHeader } from "./components/BalancesHeader";
import { BalancesTable } from "./components/BalancesTable";
import { TransferSummaryCard } from "./components/TransferSummaryCard";
import { BudgetDistributionSummary } from "./components/BudgetDistributionSummary";
import { CalculationDetailsCard } from "./components/CalculationDetailsCard";

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

  // --- HOOKS SPÉCIALISÉS (Logique métier déléguée) ---

  // Hook 1 : Calculs de données (carryovers, budget, consommation, détails)
  const {
    periodCarryovers,
    budgetPeriodeGlobal,
    pendingRecurring,
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
    accounts,
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
    accounts,
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
  const totalPendingHeader = checkingAccounts.reduce((sum, acc) => {
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
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setActiveWeek(1); // Réinitialiser à la première période
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setActiveWeek(1); // Réinitialiser à la première période
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Navigation de période */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <MonthNavigator date={currentDate} onPrev={handlePrevMonth} onNext={handleNextMonth} />

          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center justify-center shadow-sm">
            <button
              onClick={() => setScope("MONTH")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                scope === "MONTH" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Calendar size={14} /> Mois
            </button>
            <button
              onClick={() => setScope("PERIOD")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                scope === "PERIOD" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <CalendarRange size={14} /> Période
            </button>
          </div>
        </div>
      </div>

      {/* Sélecteur de période si en mode PERIOD */}
      {scope === "PERIOD" && <WeekSelector weeks={filteredPeriodBudgets} activeWeek={activeWeek} onSelect={setActiveWeek} searchQuery="" showBadge={false} />}

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

      <BalancesTable
        title="Comptes Courants"
        rows={personalRows}
        onUpdateBalance={handleUpdateBalance}
        totalRow={totalPersonalRow}
        onNavigateToPlanner={onNavigateToPlanner}
        currentDate={currentDate}
        activeWeek={scope === "PERIOD" ? activeWeek : undefined}
      />

      <TransferSummaryCard amount={virLddsTotal} toJoint={lddsToJoint} toPersonals={lddsToPersonals} />
    </div>
  );
};

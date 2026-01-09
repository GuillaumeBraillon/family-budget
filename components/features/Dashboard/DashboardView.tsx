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
import React, { useState } from "react";
import { useDashboardData } from "../../../hooks/dashboard";
import { DashboardHeader } from "./components/DashboardHeader";
import { SavingsSummaryCard } from "./components/SavingsSummaryCard";
import { AnnualIncomeAnalysis } from "./components/charts/AnnualIncomeAnalysis";
import { GlobalMonthlyAnalysis } from "./components/charts/GlobalMonthlyAnalysis";
import {
  Account,
  Person,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  AppSettings,
  Transfer,
  VariableTransaction,
  CategoryDef,
  OperationFilters,
} from "../../../types";

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  transfers: Transfer[];
  variableTransactions?: VariableTransaction[];
  categories: CategoryDef[];
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
  onNavigateToConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  configs,
  incomeConfigs,
  paidItems,
  settings,
  transfers,
  variableTransactions = [],
  categories,
  onNavigateToPlanner,
}) => {
  // --- ÉTAT UI (Navigation année) ---
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- HOOK SPÉCIALISÉ (Logique métier déléguée) ---

  // Hook : Calculs de données (globalMonthlyData + annualData avec périodes)
  const { globalMonthlyData, annualData } = useDashboardData({
    accounts,
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    settings,
    categories,
    selectedYear,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SavingsSummaryCard accounts={accounts} transfers={transfers} paidItems={paidItems} />

      <DashboardHeader currentDate={new Date()} onNavigateToPlanner={() => onNavigateToPlanner(new Date())} />

      {/* SECTION MACRO : CASHFLOW GLOBAL (Salaires inclus) */}
      <GlobalMonthlyAnalysis data={globalMonthlyData} year={selectedYear} />

      {/* SECTION MICRO : ANALYSE PAR PÉRIODE (Salaires exclus) */}
      <AnnualIncomeAnalysis data={annualData} year={selectedYear} onYearChange={setSelectedYear} onNavigateToPlanner={onNavigateToPlanner} />
    </div>
  );
};

/**
 * @file Hook de calcul des données budgétaires pour la vue Balances
 * @description Centralise les calculs de reports de périodes, consommations variables,
 * et détails par compte. Applique le principe de responsabilité unique en isolant
 * toute la logique de calcul du composant d'affichage.
 *
 * @architecture
 * **Responsabilités :**
 * - Calcul des reports budgétaires (carryover) selon stratégie (NEXT_PERIOD / SPREAD_REMAINING)
 * - Calcul du budget de période ajusté
 * - Calcul de la consommation variable réelle (Standard uniquement)
 * - Génération des détails par compte (pending, recurring, debt, consumption)
 *
 * **Principes appliqués :**
 * - **SRP** : Ne gère QUE les calculs de données, pas l'affichage
 * - **DRY** : Fonctions helpers réutilisées (getStandardAmount)
 * - **Memoization** : Tous les calculs sont memoizés pour performance
 *
 * @dependencies
 * - hooks/usePlanner : Génération des instances mensuelles
 * - types.ts : Interfaces métier
 */
import { useMemo } from "react";
import { usePlanner } from "../usePlanner";
import { Account, ExpenseConfig, IncomeConfig, PaidItemDetails, VariableTransaction, AppSettings, CategoryDef, PlannedItem } from "../../types";

/**
 * Calcule le montant Standard d'une opération (hors Extra).
 * Helper partagé entre plusieurs calculs.
 *
 * @param {PlannedItem} item - Opération à analyser
 * @returns {number} Montant Standard en € (0 si 100% Extra)
 */
const getStandardAmount = (item: PlannedItem): number => {
  // Si toggle global Extra activé : tout est Extra, rien de Standard
  if (item.isExtraGlobal) return 0;

  // Pas de tags : tout le montant est Standard
  if (!item.tagAmounts || item.tagAmounts.length === 0) {
    return item.amount;
  }

  // Avec tags : calculer la somme des montants Extra
  const extraSum = item.tagAmounts.filter((ta) => ta.isExtra === true).reduce((sum, ta) => sum + ta.amount, 0);

  // Retourner le montant Standard (total - Extra)
  return Math.max(0, item.amount - extraSum);
};

interface UseBalancesDataParams {
  accounts: Account[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  categories: CategoryDef[];
  currentDate: Date;
  scope: "MONTH" | "PERIOD";
  activeWeek: number;
}

/**
 * Hook de calcul des données budgétaires pour la vue Balances.
 *
 * @description
 * Centralise tous les calculs financiers nécessaires pour afficher les soldes
 * et la répartition budgétaire. Utilise usePlanner pour générer les instances
 * mensuelles, puis applique la logique de carryover et les filtres.
 *
 * **Workflow de calcul :**
 * 1. **Génération du planner** : Instances mensuelles via usePlanner
 * 2. **Calcul des carryovers** : Reports selon stratégie (NEXT_PERIOD / SPREAD_REMAINING)
 * 3. **Budget de période** : Ajusté avec reports
 * 4. **Consommation variable** : Filtrage Standard uniquement
 * 5. **Détails par compte** : Pending, recurring, debt, consumption
 *
 * @param {UseBalancesDataParams} params - Paramètres de calcul
 * @returns {Object} Données calculées
 * @returns {Object} periodCarryovers - Reports par période
 * @returns {number} budgetPeriodeGlobal - Budget ajusté de la période
 * @returns {number} pendingRecurring - Opérations récurrentes en attente
 * @returns {number} realConsumption - Consommation variable réelle
 * @returns {number} distributableBalance - Reste disponible
 * @returns {Array} checkingAccounts - Comptes courants filtrés
 * @returns {Account | undefined} jointAccount - Compte joint (si existe)
 * @returns {Array} personalAccounts - Comptes personnels
 * @returns {number} totalPersonalBalance - Total des soldes persos
 * @returns {Array} pendingVariablesDetails - Détails variables en attente
 * @returns {Array} pendingRecurringDetails - Détails récurrents en attente
 * @returns {Array} totalDebtDetails - Détails dettes par compte
 * @returns {Array} consumedDetails - Détails consommation par compte
 * @returns {Object} stats - Statistiques de période (via usePlanner)
 * @returns {Array} filteredPeriodBudgets - Périodes avec items filtrés
 *
 * @example
 * ```tsx
 * const {
 *   budgetPeriodeGlobal,
 *   realConsumption,
 *   distributableBalance,
 *   checkingAccounts,
 *   personalAccounts,
 *   stats
 * } = useBalancesData({
 *   accounts,
 *   configs,
 *   incomeConfigs,
 *   paidItems,
 *   variableTransactions,
 *   settings,
 *   categories,
 *   currentDate,
 *   scope: "PERIOD",
 *   activeWeek: 1
 * });
 * ```
 */
export const useBalancesData = ({
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
}: UseBalancesDataParams) => {
  // 1. Génération du planner (instances mensuelles + filtrage)
  const { calculatePeriodStatistics, filteredPeriodBudgets } = usePlanner(
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    currentDate,
    "",
    settings,
    categories
  );

  const stats = calculatePeriodStatistics(activeWeek);

  // 2. Calcul des reports budgétaires (carryover) selon stratégie
  const periodCarryovers = useMemo(() => {
    const carryovers: Record<number, { budgetBase: number; consumption: number; carryover: number; adjustedBudget: number }> = {};
    const strategy = settings.carryover_strategy || "NEXT_PERIOD";

    // ÉTAPE 1 : Calculer la consommation de chaque période
    const periodConsumptions: Record<number, number> = {};
    filteredPeriodBudgets.forEach((period) => {
      const periodNumber = period.weekNumber;
      const periodVariableItems = period.items.filter((i) => i.source === "VARIABLE" && i.category !== "Virement Interne" && i.subCategory !== "Intérêts");

      let periodExpenses = 0;
      let periodIncome = 0;

      periodVariableItems.forEach((i) => {
        const standardAmount = getStandardAmount(i);

        if (i.type === "EXPENSE") {
          periodExpenses += standardAmount;
        } else if (i.type === "INCOME") {
          periodIncome += standardAmount;
        }
      });

      periodConsumptions[periodNumber] = periodExpenses - periodIncome;
    });

    // ÉTAPE 2 : Calculer les reports selon la stratégie
    if (strategy === "NEXT_PERIOD") {
      // Stratégie 1 : Report cumulatif simple
      let cumulativeCarryover = 0;

      filteredPeriodBudgets.forEach((period) => {
        const periodNumber = period.weekNumber;
        const periodBudget = period.periodLimit || 0;
        const adjustedBudget = periodBudget + cumulativeCarryover;
        const periodConsumption = periodConsumptions[periodNumber] || 0;
        const remainingBalance = adjustedBudget - periodConsumption;

        carryovers[periodNumber] = {
          budgetBase: periodBudget,
          consumption: periodConsumption,
          carryover: remainingBalance,
          adjustedBudget: adjustedBudget,
        };

        cumulativeCarryover = remainingBalance;
      });
    } else {
      // Stratégie 2 : Étalement sur périodes restantes
      filteredPeriodBudgets.forEach((period, index) => {
        const periodNumber = period.weekNumber;
        const periodBudget = period.periodLimit || 0;

        let carryoverForThisPeriod = 0;

        // Analyser toutes les périodes précédentes
        for (let i = 0; i < index; i++) {
          const prevPeriod = filteredPeriodBudgets[i];
          const prevBudget = prevPeriod.periodLimit || 0;
          const prevConsumption = periodConsumptions[prevPeriod.weekNumber] || 0;
          let prevRawCarryover = prevBudget - prevConsumption;

          // Soustraire les ajustements déjà appliqués par les périodes encore plus anciennes
          for (let j = 0; j < i; j++) {
            const veryPrevPeriod = filteredPeriodBudgets[j];
            const veryPrevBudget = veryPrevPeriod.periodLimit || 0;
            const veryPrevConsumption = periodConsumptions[veryPrevPeriod.weekNumber] || 0;
            const veryPrevRawCarryover = veryPrevBudget - veryPrevConsumption;

            const remainingPeriodsFromVeryPrev = filteredPeriodBudgets.length - j - 1;
            if (remainingPeriodsFromVeryPrev > 0) {
              if (veryPrevRawCarryover < 0) {
                prevRawCarryover -= veryPrevRawCarryover / remainingPeriodsFromVeryPrev;
              } else if (veryPrevRawCarryover > 0) {
                prevRawCarryover -= veryPrevRawCarryover / remainingPeriodsFromVeryPrev;
              }
            }
          }

          // Étaler le report nettoyé sur les périodes restantes
          const remainingPeriods = filteredPeriodBudgets.length - i - 1;
          if (remainingPeriods > 0) {
            if (prevRawCarryover < 0) {
              carryoverForThisPeriod += prevRawCarryover / remainingPeriods;
            } else if (prevRawCarryover > 0) {
              carryoverForThisPeriod += prevRawCarryover / remainingPeriods;
            }
          }
        }

        const adjustedBudget = periodBudget + carryoverForThisPeriod;
        const periodConsumption = periodConsumptions[periodNumber] || 0;
        const remainingBalance = adjustedBudget - periodConsumption;

        carryovers[periodNumber] = {
          budgetBase: periodBudget,
          consumption: periodConsumption,
          carryover: remainingBalance,
          adjustedBudget: adjustedBudget,
        };
      });
    }

    return carryovers;
  }, [filteredPeriodBudgets, settings.carryover_strategy]);

  // 3. Budget alloué pour la période (adapté selon le scope)
  const budgetPeriodeGlobal =
    scope === "MONTH"
      ? filteredPeriodBudgets.reduce((sum, p) => sum + (p.periodLimit || 0), 0)
      : periodCarryovers[activeWeek]?.adjustedBudget || stats.periodLimit;

  // 4. Calcul des opérations récurrentes en attente
  const pendingRecurring = stats.fixedToPay + stats.fixedDelays;

  // 5. Identification des comptes
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === "COURANT"), [accounts]);
  const jointAccount = checkingAccounts.find((a) => a.isJoint);
  const personalAccounts = checkingAccounts.filter((a) => !a.isJoint);

  // 6. Calcul du total des soldes personnels actuels
  const totalPersonalBalance = personalAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 7. Récupération des données selon le scope
  const scopeItems = useMemo(() => {
    if (scope === "MONTH") {
      return filteredPeriodBudgets.flatMap((w) => w.items);
    } else {
      const currentWeekData = filteredPeriodBudgets.find(
        (w) => w.weekNumber === (filteredPeriodBudgets.some((w) => w.weekNumber === activeWeek) ? activeWeek : 1)
      );
      return currentWeekData?.items || [];
    }
  }, [scope, filteredPeriodBudgets, activeWeek]);

  // 8. Calcul de la consommation variable totale
  const variableItems = scopeItems.filter((i) => i.source === "VARIABLE" && i.category !== "Virement Interne" && i.subCategory !== "Intérêts");

  let varExpenses = 0;
  let varIncome = 0;

  variableItems.forEach((i) => {
    const standardAmount = getStandardAmount(i);

    if (i.type === "EXPENSE") {
      varExpenses += standardAmount;
    } else if (i.type === "INCOME") {
      varIncome += standardAmount;
    }
  });

  const realConsumption = varExpenses - varIncome;
  const distributableBalance = Math.max(0, budgetPeriodeGlobal - realConsumption);

  // 9. Détails par compte (pour tooltips/affichage)
  const pendingVariablesDetails = useMemo(() => {
    // Filtrer les périodes selon le scope
    // MONTH : toutes les périodes
    // PERIOD : cumul des périodes 1 à activeWeek (cohérence avec récurrentes)
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    return checkingAccounts
      .map((acc) => {
        const totalPending = relevantPeriods
          .flatMap((w) => w.items)
          .filter((i) => i.accountId === acc.id && i.source === "VARIABLE" && i.type === "EXPENSE" && !i.isPaid && i.subCategory !== "Intérêts")
          .reduce((sum, i) => sum + i.amount, 0);

        return { name: acc.name, amount: totalPending };
      })
      .filter((x) => x.amount > 0);
  }, [filteredPeriodBudgets, checkingAccounts, scope, activeWeek]);

  const pendingRecurringDetails = useMemo(() => {
    // Filtrer les périodes selon le scope
    // MONTH : toutes les périodes
    // PERIOD : cumul des périodes 1 à activeWeek (car opération peut tomber plus tard)
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    const relevantItems = relevantPeriods
      .flatMap((w) => w.items)
      .filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne" && i.type === "EXPENSE");

    return checkingAccounts
      .map((acc) => {
        const amount = relevantItems.filter((i) => i.accountId === acc.id).reduce((sum, i) => sum + i.amount, 0);
        return { name: acc.name, amount };
      })
      .filter((x) => x.amount > 0);
  }, [filteredPeriodBudgets, activeWeek, checkingAccounts, scope]);

  const totalDebtDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const remaining = stats.byAccount[acc.id]?.remaining || 0;
        return { name: acc.name, amount: remaining };
      })
      .filter((x) => x.amount > 0);
  }, [checkingAccounts, stats]);

  const consumedDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const items = variableItems.filter((i) => i.accountId === acc.id);

        let expense = 0;
        let income = 0;

        items.forEach((i) => {
          const standardAmount = getStandardAmount(i);

          if (i.type === "EXPENSE") {
            expense += standardAmount;
          } else if (i.type === "INCOME") {
            income += standardAmount;
          }
        });

        return { name: acc.name, amount: expense - income };
      })
      .filter((x) => Math.abs(x.amount) > 0.01);
  }, [checkingAccounts, variableItems]);

  return {
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
  };
};

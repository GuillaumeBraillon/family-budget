/**
 * @file Hook de calcul des données budgétaires pour la vue Balances
 * @description Centralise les calculs de reports de périodes, consommations variables,
 * et détails par compte. Applique le principe de responsabilité unique en isolant
 * toute la logique de calcul du composant d'affichage.
 *
 * @architecture
 * **Responsabilités :**
 * - Calcul des reports budgétaires (carryover) en mode ALLOWANCE
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
import { Account, ExpenseConfig, IncomeConfig, PaidItemDetails, VariableTransaction, AppSettings, CategoryDef, PlannedItem, Person } from "../../types";
import {
  resolveBeneficiaryAmounts,
  getBeneficiaryStandardShare,
  getBeneficiaryExtraShare,
  isBudgetExcluded,
  getFamilyBeneficiaryIds,
} from "../../services/financeUtils";

export interface FamilyVariableNetBreakdown {
  nature: {
    standard: number;
    refunds: number;
    extra: number;
    total: number;
  };
  status: {
    real: number;
    waiting: number;
    realStandard: number;
    waitingStandard: number;
    realExtra: number;
    waitingExtra: number;
  };
}

export const calculateFamilyVariableNet = (items: PlannedItem[], familyBeneficiaryIds: string[]): number => {
  if (!familyBeneficiaryIds.length) return 0;

  const uniqueFamilyBeneficiaryIds = Array.from(new Set(familyBeneficiaryIds));

  return items.reduce((total, item) => {
    if (item.source !== "VARIABLE") return total;
    if (isBudgetExcluded(item)) return total;

    const standardFamilyShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryStandardShare(item, beneficiaryId), 0);
    const extraFamilyShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryExtraShare(item, beneficiaryId), 0);
    const totalFamilyShare = standardFamilyShare + extraFamilyShare;

    if (item.type === "EXPENSE") return total + totalFamilyShare;
    if (item.type === "INCOME") return total - totalFamilyShare;
    return total;
  }, 0);
};

export const calculateFamilyVariableNetBreakdown = (items: PlannedItem[], familyBeneficiaryIds: string[]): FamilyVariableNetBreakdown => {
  if (!familyBeneficiaryIds.length) {
    return {
      nature: { standard: 0, refunds: 0, extra: 0, total: 0 },
      status: { real: 0, waiting: 0, realStandard: 0, waitingStandard: 0, realExtra: 0, waitingExtra: 0 },
    };
  }

  const uniqueFamilyBeneficiaryIds = Array.from(new Set(familyBeneficiaryIds));

  let standard = 0;
  let extra = 0;
  let refundsStandard = 0;
  let refundsExtra = 0;
  let real = 0;
  let waiting = 0;
  let realStandard = 0;
  let waitingStandard = 0;
  let realExtra = 0;
  let waitingExtra = 0;

  items.forEach((item) => {
    if (item.source !== "VARIABLE") return;
    if (isBudgetExcluded(item)) return;

    const standardShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryStandardShare(item, beneficiaryId), 0);
    const extraShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryExtraShare(item, beneficiaryId), 0);

    if (item.type === "EXPENSE") {
      const totalShare = standardShare + extraShare;
      standard += standardShare;
      extra += extraShare;

      if (item.isPaid) {
        real += totalShare;
        realStandard += standardShare;
        realExtra += extraShare;
      } else {
        waiting += totalShare;
        waitingStandard += standardShare;
        waitingExtra += extraShare;
      }
      return;
    }

    if (item.type === "INCOME") {
      const totalShare = standardShare + extraShare;
      standard -= standardShare;
      extra -= extraShare;

      if (item.isRefund) {
        refundsStandard += standardShare;
        refundsExtra += extraShare;
      }

      if (item.isPaid) {
        real -= totalShare;
        realStandard -= standardShare;
        realExtra -= extraShare;
      } else {
        waiting -= totalShare;
        waitingStandard -= standardShare;
        waitingExtra -= extraShare;
      }
      return;
    }
  });

  return {
    nature: {
      standard,
      refunds: refundsStandard + refundsExtra,
      extra,
      total: standard + extra,
    },
    status: {
      real,
      waiting,
      realStandard,
      waitingStandard,
      realExtra,
      waitingExtra,
    },
  };
};

export const calculateFamilyVariableBudgetTotal = (monthlyBudget: number, totalPeriodsInMonth: number, periodsInScopeCount: number): number => {
  if (monthlyBudget <= 0) return 0;
  if (totalPeriodsInMonth <= 0) return 0;
  if (periodsInScopeCount <= 0) return 0;

  return (monthlyBudget / totalPeriodsInMonth) * periodsInScopeCount;
};

export const calculateFamilyVariableMonthlyCarryover = (monthlyBudget: number, previousMonthSpents: number[]): number => {
  if (previousMonthSpents.length === 0) return 0;

  return previousMonthSpents.reduce((carryover, spent) => carryover + (monthlyBudget - spent), 0);
};

export const calculateFamilyVariablePeriodCarryover = (
  monthlyBudget: number,
  openingCarryover: number,
  periodSpents: number[]
): {
  periodBudgets: number[];
  periodRemaining: number[];
  monthBudget: number;
  monthSpent: number;
  monthRemaining: number;
} => {
  const totalPeriods = periodSpents.length;
  if (totalPeriods <= 0) {
    return {
      periodBudgets: [],
      periodRemaining: [],
      monthBudget: monthlyBudget + openingCarryover,
      monthSpent: 0,
      monthRemaining: monthlyBudget + openingCarryover,
    };
  }

  const periodBaseBudget = totalPeriods > 0 ? monthlyBudget / totalPeriods : 0;
  let carryover = openingCarryover;

  const periodBudgets: number[] = [];
  const periodRemaining: number[] = [];

  periodSpents.forEach((spent) => {
    const periodBudget = periodBaseBudget + carryover;
    const remaining = periodBudget - spent;

    periodBudgets.push(periodBudget);
    periodRemaining.push(remaining);

    carryover = remaining;
  });

  const monthSpent = periodSpents.reduce((sum, spent) => sum + spent, 0);
  const monthBudget = monthlyBudget + openingCarryover;
  const monthRemaining = monthBudget - monthSpent;

  return {
    periodBudgets,
    periodRemaining,
    monthBudget,
    monthSpent,
    monthRemaining,
  };
};

interface UseBalancesDataParams {
  accounts: Account[];
  people: Person[];
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
 * 2. **Calcul des carryovers** : Reports mensuels en mode ALLOWANCE
 * 3. **Budget de période** : Ajusté avec reports
 * 4. **Consommation variable** : Filtrage Standard uniquement
 * 5. **Détails par compte** : Pending, recurring, debt, consumption
 *
 * @param {UseBalancesDataParams} params - Paramètres de calcul
 * @returns {Object} Données calculées
 * @returns {Object} periodCarryovers - Reports par période
 * @returns {number} totalPersonalBudgetAmount - Budget ajusté de la période
 * @returns {number} totalPendingRecurringAmount - Opérations récurrentes en attente
 * @returns {number} personalBudgetConsumedAmount - Consommation variable réelle
 * @returns {number} distributableBudgetAmount - Reste disponible
 * @returns {Array} checkingAccounts - Comptes courants filtrés
 * @returns {Account | undefined} jointAccount - Compte joint (si existe)
 * @returns {Array} personalAccounts - Comptes personnels
 * @returns {number} totalPersonalBalance - Total des soldes persos
 * @returns {Array} pendingVariableDetails - Détails variables en attente
 * @returns {Array} pendingRecurringDetails - Détails récurrents en attente
 * @returns {Array} totalDebtDetails - Détails dettes par compte
 * @returns {Array} consumedDetails - Détails consommation par compte
 * @returns {Object} stats - Statistiques de période (via usePlanner)
 * @returns {Array} filteredPeriodBudgets - Périodes avec items filtrés
 *
 * @example
 * ```tsx
 * const {
 *   totalPersonalBudgetAmount,
 *   personalBudgetConsumedAmount,
 *   distributableBudgetAmount,
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
}: UseBalancesDataParams) => {
  const personalBeneficiaryIds = useMemo(() => {
    const nonChildIds = new Set(people.filter((person) => !person.isChild).map((person) => person.id));
    return Array.from(new Set(accounts.filter((account) => account.type === "COURANT" && !account.isJoint).map((account) => account.ownerId))).filter((id) =>
      nonChildIds.has(id)
    );
  }, [accounts, people]);

  const familyBeneficiaryIds = useMemo(() => getFamilyBeneficiaryIds(people), [people]);

  const allowanceContext = useMemo(() => {
    const allowancePerBeneficiary = Number(settings.personal_budget_amount || 350);
    if (personalBeneficiaryIds.length === 0) {
      return {
        allowancePerBeneficiary,
        previousCarryoverTotal: 0,
        availableMonthlyAllowance: 0,
        carryoverByBeneficiary: {} as Record<string, number>,
      };
    }

    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    const monthKeys = new Set<string>();
    const monthlySpentByBeneficiary: Record<string, Record<string, number>> = {};

    Object.values(paidItems).forEach((details) => {
      if (details.category === "Virement Interne" || details.subCategory === "Intérêts") return;
      if (details.isSalary) return;
      // EXPENSE consomme l'allowance ; INCOME non-salarial la réduit (remboursements, etc.)
      if (details.type !== "EXPENSE" && details.type !== "INCOME") return;

      const monthKey = details.paymentDate.slice(0, 7);
      if (monthKey >= currentMonthKey) return;

      monthKeys.add(monthKey);

      resolveBeneficiaryAmounts(details)
        .filter((ba) => personalBeneficiaryIds.includes(ba.beneficiaryId))
        .forEach((ba) => {
          const standardShare = getBeneficiaryStandardShare(details, ba.beneficiaryId);
          if (!monthlySpentByBeneficiary[monthKey]) monthlySpentByBeneficiary[monthKey] = {};
          const delta = details.type === "EXPENSE" ? standardShare : -standardShare;
          monthlySpentByBeneficiary[monthKey][ba.beneficiaryId] = (monthlySpentByBeneficiary[monthKey][ba.beneficiaryId] || 0) + delta;
        });
    });

    const sortedMonths = Array.from(monthKeys).sort();
    const carryoverByBeneficiary: Record<string, number> = {};
    personalBeneficiaryIds.forEach((beneficiaryId) => {
      carryoverByBeneficiary[beneficiaryId] = 0;
    });

    sortedMonths.forEach((monthKey) => {
      personalBeneficiaryIds.forEach((beneficiaryId) => {
        const consumed = monthlySpentByBeneficiary[monthKey]?.[beneficiaryId] || 0;
        const available = allowancePerBeneficiary + carryoverByBeneficiary[beneficiaryId];
        carryoverByBeneficiary[beneficiaryId] = available - consumed;
      });
    });

    const previousCarryoverTotal = personalBeneficiaryIds.reduce((sum, beneficiaryId) => sum + (carryoverByBeneficiary[beneficiaryId] || 0), 0);
    const availableMonthlyAllowance = personalBeneficiaryIds.length * allowancePerBeneficiary + previousCarryoverTotal;

    return {
      allowancePerBeneficiary,
      previousCarryoverTotal,
      availableMonthlyAllowance,
      carryoverByBeneficiary,
    };
  }, [currentDate, paidItems, personalBeneficiaryIds, settings.personal_budget_amount]);

  // Retourne la somme des parts Standard pour tous les bénéficiaires personnels sur un item
  const getPersonalStandardAmount = (item: PlannedItem) => personalBeneficiaryIds.reduce((sum, id) => sum + getBeneficiaryStandardShare(item, id), 0);

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

  const statsWeekNumber = scope === "MONTH" ? filteredPeriodBudgets.reduce((maxWeek, period) => Math.max(maxWeek, period.weekNumber), 1) : activeWeek;

  const stats = calculatePeriodStatistics(statsWeekNumber);

  const familyVariableBudgetMonthly = Number(settings.family_variable_budget || 0);
  const familyOpeningCarryover = 0;

  const familyPeriodCarryover = useMemo(() => {
    const sortedPeriods = [...filteredPeriodBudgets].sort((a, b) => a.weekNumber - b.weekNumber);
    // Use only the REAL Standard part for carryover (exclude Extra AND waiting amounts)
    // nature.standard includes waiting items — we want only what has been actually spent (isPaid)
    const periodNets = sortedPeriods.map((period) => {
      const breakdown = calculateFamilyVariableNetBreakdown(period.items, familyBeneficiaryIds);
      return breakdown.status.realStandard;
    });

    return calculateFamilyVariablePeriodCarryover(familyVariableBudgetMonthly, familyOpeningCarryover, periodNets);
  }, [filteredPeriodBudgets, familyBeneficiaryIds, familyVariableBudgetMonthly, familyOpeningCarryover]);

  const familyVariableValuesByPeriod = useMemo(() => {
    const sortedPeriods = [...filteredPeriodBudgets].sort((a, b) => a.weekNumber - b.weekNumber);
    const byPeriod: Record<number, { budget: number; net: number; remaining: number }> = {};

    sortedPeriods.forEach((period, index) => {
      const net = calculateFamilyVariableNet(period.items, familyBeneficiaryIds);
      byPeriod[period.weekNumber] = {
        budget: familyPeriodCarryover.periodBudgets[index] || 0,
        net,
        remaining: familyPeriodCarryover.periodRemaining[index] || 0,
      };
    });

    return byPeriod;
  }, [filteredPeriodBudgets, familyBeneficiaryIds, familyPeriodCarryover.periodBudgets, familyPeriodCarryover.periodRemaining]);

  const familyVariableNetBreakdownByPeriod = useMemo(() => {
    const sortedPeriods = [...filteredPeriodBudgets].sort((a, b) => a.weekNumber - b.weekNumber);
    const byPeriod: Record<number, FamilyVariableNetBreakdown> = {};

    sortedPeriods.forEach((period) => {
      byPeriod[period.weekNumber] = calculateFamilyVariableNetBreakdown(period.items, familyBeneficiaryIds);
    });

    return byPeriod;
  }, [filteredPeriodBudgets, familyBeneficiaryIds]);

  const familyVariableMonthNetBreakdown = useMemo(
    () =>
      calculateFamilyVariableNetBreakdown(
        filteredPeriodBudgets.flatMap((period) => period.items),
        familyBeneficiaryIds
      ),
    [filteredPeriodBudgets, familyBeneficiaryIds]
  );

  const familyVariableNetBreakdown =
    scope === "MONTH"
      ? familyVariableMonthNetBreakdown
      : familyVariableNetBreakdownByPeriod[activeWeek] || {
          nature: { standard: 0, refunds: 0, extra: 0, total: 0 },
          status: { real: 0, waiting: 0, realStandard: 0, waitingStandard: 0, realExtra: 0, waitingExtra: 0 },
        };

  const familyVariableBudgetTotalAmount = scope === "MONTH" ? familyPeriodCarryover.monthBudget : familyVariableValuesByPeriod[activeWeek]?.budget || 0;
  const familyVariableNetAmount = familyVariableNetBreakdown.nature.total;
  // Remaining = budget - dépenses réelles standard uniquement (sans extras, sans attente)
  // Correspond à displayedFamilyNet = realStandard dans les composants
  const familyVariableBudgetRemainingAmount = familyVariableBudgetTotalAmount - familyVariableNetBreakdown.status.realStandard;

  // 2. Calcul des reports budgétaires (carryover) en mode ALLOWANCE
  const periodCarryovers = useMemo(() => {
    const carryovers: Record<number, { budgetBase: number; consumption: number; carryover: number; adjustedBudget: number }> = {};
    const monthlyBase = allowanceContext.availableMonthlyAllowance;

    filteredPeriodBudgets.forEach((period) => {
      carryovers[period.weekNumber] = {
        budgetBase: monthlyBase,
        consumption: 0,
        carryover: 0,
        adjustedBudget: monthlyBase,
      };
    });

    return carryovers;
  }, [allowanceContext.availableMonthlyAllowance, filteredPeriodBudgets]);

  // 3. Budget alloué pour la période (mode ALLOWANCE uniquement)
  const totalPersonalBudgetAmount = allowanceContext.availableMonthlyAllowance;

  // 4. Calcul des opérations récurrentes en attente
  const totalPendingRecurringAmount = stats.fixedToPay + stats.fixedDelays;

  // 5. Identification des comptes
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === "COURANT"), [accounts]);
  const jointAccount = checkingAccounts.find((a) => a.isJoint);
  const personalAccounts = checkingAccounts.filter((a) => !a.isJoint);

  // 6. Calcul du total des soldes personnels actuels
  const totalPersonalBalanceAmount = personalAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 7. Récupération des données selon le scope
  const scopeItems = useMemo(() => {
    return filteredPeriodBudgets.flatMap((w) => w.items);
  }, [filteredPeriodBudgets]);

  // 8. Calcul de la consommation variable (dépenses Standard moins tous les revenus attribués)
  const variableItems = scopeItems.filter((i) => !isBudgetExcluded(i));

  let personalBudgetConsumedAmount = 0;
  variableItems.forEach((i) => {
    if (i.type === "EXPENSE") {
      personalBudgetConsumedAmount += getPersonalStandardAmount(i);
    } else if (i.type === "INCOME" && !i.isSalary) {
      personalBudgetConsumedAmount -= getPersonalStandardAmount(i);
    }
  });

  // Peut être négatif si dépassement (pas de Math.max pour l'afficher correctement)
  const distributableBudgetAmount = totalPersonalBudgetAmount - personalBudgetConsumedAmount;

  // 9. Détails par compte (pour tooltips/affichage)
  const pendingVariableDetails = useMemo(() => {
    // Filtrer les périodes selon le scope
    // MONTH : toutes les périodes
    // PERIOD : cumul des périodes 1 à activeWeek (cohérence avec récurrentes)
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    return checkingAccounts
      .map((acc) => {
        const totalPending = relevantPeriods
          .flatMap((w) => w.items)
          .filter(
            (i) =>
              i.accountId === acc.id &&
              i.source === "VARIABLE" &&
              i.type === "EXPENSE" &&
              !i.isPaid &&
              i.category !== "Virement Interne" &&
              i.subCategory !== "Intérêts"
          )
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
      .filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne" && i.subCategory !== "Intérêts" && i.type === "EXPENSE");

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
    const relevantItems = filteredPeriodBudgets.flatMap((week) => week.items).filter((item) => !isBudgetExcluded(item));

    return personalBeneficiaryIds
      .map((beneficiaryId) => {
        const person = people.find((candidate) => candidate.id === beneficiaryId);
        if (!person) return null;

        let amount = 0;
        relevantItems.forEach((item) => {
          if (item.type === "EXPENSE") {
            const share = getBeneficiaryStandardShare(item, beneficiaryId);
            if (share > 0) amount += share;
          } else if (item.type === "INCOME" && !item.isSalary) {
            const share = getBeneficiaryStandardShare(item, beneficiaryId);
            if (share > 0) amount -= share;
          }
        });

        const available = allowanceContext.allowancePerBeneficiary + (allowanceContext.carryoverByBeneficiary[beneficiaryId] || 0);
        const remaining = available - amount;

        return { beneficiaryId, name: person.name, amount, available, remaining };
      })
      .filter((entry): entry is { beneficiaryId: string; name: string; amount: number; available: number; remaining: number } => !!entry);
  }, [filteredPeriodBudgets, people, personalBeneficiaryIds, allowanceContext.allowancePerBeneficiary, allowanceContext.carryoverByBeneficiary]);

  // Debug logs removed: ventilation mensuelle supprimée en production

  return {
    periodCarryovers,
    totalPersonalBudgetAmount,
    familyBeneficiaryIds,
    familyVariableBudgetTotalAmount,
    familyVariableNetAmount,
    familyVariableNetBreakdown,
    familyVariableBudgetRemainingAmount,
    totalPendingRecurringAmount,
    personalBudgetConsumedAmount,
    distributableBudgetAmount,
    checkingAccounts,
    jointAccount,
    personalAccounts,
    totalPersonalBalanceAmount,
    pendingVariableDetails,
    pendingRecurringDetails,
    totalDebtDetails,
    consumedDetails,
    stats,
    filteredPeriodBudgets,
    allowanceContext,
  };
};

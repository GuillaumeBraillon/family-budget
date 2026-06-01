/**
 * @file Hook de planification et calcul des périodes budgétaires mensuelles
 * @description Génère les instances mensuelles des opérations récurrentes (dépenses/revenus)
 * et les combine avec les transactions variables pour construire l'échéancier du mois.
 * Gère la découpe du mois en périodes (semaines, jours fixes, etc.) avec calculs statistiques.
 *
 * @architecture
 * **Concepts clés :**
 * - **Config** : Modèle d'opération récurrente (ex: loyer chaque mois)
 * - **Instance** : Occurrence mensuelle d'une config (ex: loyer de janvier 2025)
 * - **Instance ID** : Format `{configId}-YYYY-MM` pour identifi
 * - **PlannedItem** : Opération enrichie pour affichage (config + pointage + variable)
 * - **Période** : Découpage du mois selon `settings.period_type`
 *
 * **Système Extra à deux niveaux :**
 * 1. Niveau opération : Toggle global `isExtra`
 *
 * @dependencies
 * - date-fns : Manipulation des dates et calcul des périodes
 * - types.ts : Toutes les interfaces métier
 */
import { useMemo } from "react";
import { startOfMonth, endOfMonth, eachWeekOfInterval, getDate, getDaysInMonth } from "date-fns";
import { getStandardAmount, resolveBeneficiaryAmounts } from "../services/financeUtils";
import {
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  PlannedItem,
  WeeklyBudget,
  AppSettings,
  VariableTransaction,
  OperationFilters,
  CategoryDef,
  BeneficiaryAmount,
} from "../types";

const getValidBeneficiaryAmounts = (
  beneficiaryAmounts: BeneficiaryAmount[] | undefined,
  fallbackBeneficiaryId: string,
  fallbackAmount: number
): BeneficiaryAmount[] => {
  const normalizedAmounts = (beneficiaryAmounts || []).filter((beneficiaryAmount) => beneficiaryAmount.beneficiaryId && beneficiaryAmount.amount > 0);

  if (normalizedAmounts.length > 0) {
    return normalizedAmounts;
  }

  if (!fallbackBeneficiaryId || fallbackAmount <= 0) {
    return [];
  }

  return [{ beneficiaryId: fallbackBeneficiaryId, amount: fallbackAmount }];
};

/**
 * Hook de planification des périodes budgétaires mensuelles.
 *
 * @description
 * Génère l'échéancier complet du mois en combinant :
 * - Instances mensuelles des opérations récurrentes (configs)
 * - Transactions variables (hors modèles)
 * - Pointages réels (ajustements de montants/dates)
 *
 * **Algorithme de génération :**
 * 1. Découpe du mois en périodes selon `settings.period_type` :
 *    - FIXED_DAYS : Périodes de N jours (ex: semaines de 7 jours)
 *    - CALENDAR_WEEKS : Semaines calendaires (lundi-dimanche)
 *    - CUSTOM_SPLIT : Découpage équitable en N parts
 * 2. Création des instances mensuelles :
 *    - Vérification des dates de validité (startMonth/endMonth)
 *    - Application des pointages si existants (montant/date ajustés)
 * 3. Affectation aux périodes selon le jour du mois
 * 4. Tri intelligent avec système de scores (position manuelle prioritaire)
 * 5. Application des filtres (flux, source, statut, etc.)
 *
 * **Système de tri robuste :**
 * - Position manuelle (`item.position`) prioritaire si définie
 * - Sinon : score par défaut = BASE_SCORE (100 Milliards) + jour * 100M + hash(instanceId)
 * - Espace large (100M par jour) pour insertions avant/après via drag & drop
 *
 * @param {ExpenseConfig[]} configs - Modèles de dépenses récurrentes
 * @param {IncomeConfig[]} incomeConfigs - Modèles de revenus récurrents
 * @param {Record<string, PaidItemDetails>} paidItems - Pointages mensuels (instanceId -> détails)
 * @param {VariableTransaction[]} variableTransactions - Transactions hors modèles
 * @param {Date} currentDate - Mois affiché (seuls mois/année utilisés)
 * @param {string} searchQuery - Requête de recherche textuelle (filtre label/catégorie/montant)
 * @param {AppSettings} settings - Paramètres globaux (enveloppe, type de périodes)
 * @param {CategoryDef[]} categories - Définitions des catégories (pour détecter remboursements)
 * @param {OperationFilters} [filters] - Filtres optionnels (flux, source, statut, etc.)
 *
 * @returns {Object} Résultats de la planification
 * @returns {WeeklyBudget[]} filteredPeriodBudgets - Périodes avec items filtrés
 * @returns {Function} calculatePeriodStatistics - Fonction de calcul des stats d'une période
 *
 * @example
 * ```tsx
 * const { filteredPeriodBudgets, calculatePeriodStatistics } = usePlanner(
 *   configs,
 *   incomeConfigs,
 *   paidItems,
 *   variableTransactions,
 *   new Date(2025, 0, 1), // Janvier 2025
 *   "",
 *   settings,
 *   categories
 * );
 *
 * // Accès aux périodes
 * const firstPeriod = filteredPeriodBudgets[0];
 *
 * // Calcul des stats
 * const stats = calculatePeriodStatistics(firstPeriod.weekNumber);
 * ```
 */
export const usePlanner = (
  configs: ExpenseConfig[],
  incomeConfigs: IncomeConfig[],
  paidItems: Record<string, PaidItemDetails>,
  variableTransactions: VariableTransaction[],
  currentDate: Date,
  searchQuery: string,
  settings: AppSettings,
  categories: CategoryDef[],
  filters?: OperationFilters
) => {
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = getDaysInMonth(currentDate);

  // Maps pour résoudre rapidement les IDs de catégories et sous-catégories à partir de leurs noms
  const categoryNameToId = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.name, c.id));
    return map;
  }, [categories]);

  const subCategoryNameToId = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => c.subCategories?.forEach((sc) => map.set(sc.name, sc.id)));
    return map;
  }, [categories]);

  const periodBudgets = useMemo(() => {
    const periods: WeeklyBudget[] = [];
    const type = settings.period_type || "FIXED_DAYS";
    const val = settings.period_value || 7;

    const createPeriod = (start: number, end: number, num: number, limitOverride?: number) => {
      const _periodDays = end - start + 1;
      const distributedLimit = limitOverride ?? 0;

      return {
        weekNumber: num,
        label: `Période ${num} (${start} au ${end})`,
        items: [],
        startDate: start,
        endDate: end,
        periodLimit: distributedLimit,
      };
    };

    if (type === "FIXED_DAYS") {
      for (let start = 1; start <= daysInMonth; start += val) {
        const isLast = start + val - 1 >= daysInMonth;
        const end = isLast ? daysInMonth : start + val - 1;
        periods.push(createPeriod(start, end, periods.length + 1));
        if (isLast) break;
      }
    } else if (type === "CALENDAR_WEEKS") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarWeeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

      calendarWeeks.forEach((weekDate, idx) => {
        const start = getDate(weekDate < monthStart ? monthStart : weekDate);
        const nextWeek = new Date(weekDate);
        nextWeek.setDate(nextWeek.getDate() + 6);
        const end = getDate(nextWeek > monthEnd ? monthEnd : nextWeek);
        periods.push(createPeriod(start, end, idx + 1));
      });
    } else if (type === "CUSTOM_SPLIT") {
      const parts = Math.max(1, Math.min(daysInMonth, val));
      const daysPerPart = Math.floor(daysInMonth / parts);
      const equalLimit = 0;

      for (let i = 0; i < parts; i++) {
        const start = i * daysPerPart + 1;
        const end = i === parts - 1 ? daysInMonth : (i + 1) * daysPerPart;
        periods.push(createPeriod(start, end, i + 1, equalLimit));
      }
    }

    const assignToPeriod = (item: PlannedItem) => {
      const period = periods.find((p) => item.day >= p.startDate && item.day <= p.endDate);
      if (period) period.items.push(item);
    };

    const getDayFromDateStr = (dateStr?: string, defaultDay?: number) => {
      if (!dateStr) return defaultDay || 1;
      const parts = dateStr.split("-");
      if (parts.length === 3) return parseInt(parts[2], 10);
      return new Date(dateStr).getDate();
    };

    configs
      .filter((conf) => {
        if (!conf.startMonth) return true;
        if (currentMonthKey < conf.startMonth) return false;
        if (conf.endMonth && currentMonthKey > conf.endMonth) return false;
        return true;
      })
      .forEach((conf) => {
        const instanceId = `${conf.id}-${currentMonthKey}`;
        const paid = paidItems[instanceId];
        const isActuallyPaid = paid ? !paid.isWaiting : false;
        const day = paid ? getDayFromDateStr(paid.paymentDate, conf.dayOfMonth) : conf.dayOfMonth;

        const baseIsExtra = !!(paid?.isExtra ?? conf.isExtra);
        const beneficiaryAmounts = getValidBeneficiaryAmounts(paid?.beneficiaryAmounts, conf.beneficiaryId, paid ? paid.amount : conf.amount);

        assignToPeriod({
          type: "EXPENSE",
          source: "RECURRING",
          configId: conf.id,
          instanceId,
          day,
          label: paid ? paid.label : conf.label,
          amount: paid ? paid.amount : conf.amount,
          originalAmount: conf.amount,
          category: conf.category,
          categoryId: categoryNameToId.get(conf.category),
          subCategory: conf.subCategory,
          subCategoryId: conf.subCategory ? subCategoryNameToId.get(conf.subCategory) : undefined,
          beneficiaryId: conf.beneficiaryId,
          beneficiaryAmounts,
          accountId: conf.accountId,
          isExtra: baseIsExtra,
          isExtraGlobal: baseIsExtra, // Toggle brut
          isPaid: isActuallyPaid,
          isWaiting: !isActuallyPaid,
          paidDetails: paid,
          comments: paid?.comments || "",
        });
      });

    incomeConfigs.forEach((inc) => {
      const instanceId = `${inc.id}-${currentMonthKey}`;
      const paid = paidItems[instanceId];
      const isActuallyPaid = paid ? !paid.isWaiting : false;
      const day = paid ? getDayFromDateStr(paid.paymentDate, inc.dayOfMonth) : inc.dayOfMonth;

      const baseIsExtra = !!(paid?.isExtra ?? inc.isExtra);
      const beneficiaryAmounts = getValidBeneficiaryAmounts(paid?.beneficiaryAmounts, inc.beneficiaryId, paid ? paid.amount : inc.amount);

      assignToPeriod({
        type: "INCOME",
        source: "RECURRING",
        configId: inc.id,
        instanceId,
        day,
        label: paid ? paid.label : inc.label,
        amount: paid ? paid.amount : inc.amount,
        originalAmount: inc.amount,
        category: inc.category,
        categoryId: categoryNameToId.get(inc.category),
        subCategory: inc.subCategory,
        subCategoryId: inc.subCategory ? subCategoryNameToId.get(inc.subCategory) : undefined,
        beneficiaryId: inc.beneficiaryId,
        beneficiaryAmounts,
        accountId: inc.accountId,
        isPaid: isActuallyPaid,
        isWaiting: !isActuallyPaid,
        paidDetails: paid,
        isRefund: !!paid?.isRefund,
        isExtra: baseIsExtra,
        isExtraGlobal: baseIsExtra, // Toggle brut
        isSalary: !!inc.isSalary,
        comments: paid?.comments || "",
      });
    });

    variableTransactions
      .filter((vt) => {
        const d = new Date(vt.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      })
      .forEach((vt) => {
        const d = new Date(vt.date).getDate();
        assignToPeriod({
          type: vt.type === "INCOME" ? "INCOME" : "EXPENSE",
          source: "VARIABLE",
          configId: vt.id,
          instanceId: vt.id,
          day: d,
          label: vt.label,
          amount: vt.amount,
          originalAmount: vt.amount,
          category: vt.category,
          categoryId: categoryNameToId.get(vt.category),
          subCategory: vt.subCategory,
          subCategoryId: vt.subCategory ? subCategoryNameToId.get(vt.subCategory) : undefined,
          beneficiaryId: vt.beneficiaryId || "",
          beneficiaryAmounts:
            vt.beneficiaryAmounts && vt.beneficiaryAmounts.length > 0
              ? vt.beneficiaryAmounts
              : vt.beneficiaryId
                ? [{ beneficiaryId: vt.beneficiaryId, amount: vt.amount }]
                : [],
          accountId: vt.accountId,
          isPaid: !vt.isWaiting,
          isWaiting: !!vt.isWaiting,
          isRefund: !!vt.isRefund,
          isSalary: !!vt.isSalary,
          isExtra: !!vt.isExtra,
          isExtraGlobal: !!vt.isExtra, // Toggle brut de la variable
          comments: vt.comments || "",
        });
      });

    const sortingMap = new Map<string, number>();
    (settings.operations_sorting || []).forEach((id, index) => {
      if (!sortingMap.has(id)) {
        sortingMap.set(id, index);
      }
    });

    const getSortIndex = (item: { instanceId: string; configId: string }): number => {
      const exact = sortingMap.get(item.instanceId);
      if (exact !== undefined) return exact;

      // Compat legacy : ancien format stocké sur configId (ex: c2)
      const legacy = sortingMap.get(item.configId);
      if (legacy !== undefined) return legacy;

      return Infinity;
    };

    // --- SYSTÈME DE TRI ROBUSTE ---
    // Utilise operations_sorting pour cohérence totale
    periods.forEach((w) =>
      w.items.sort((a, b) => {
        const indexA = getSortIndex(a);
        const indexB = getSortIndex(b);

        // Si les deux sont hors de la liste, tri par jour puis ID
        if (indexA === Infinity && indexB === Infinity) {
          if (a.day !== b.day) return a.day - b.day;
          return a.instanceId.localeCompare(b.instanceId);
        }

        return indexA - indexB;
      })
    );
    return periods;
  }, [configs, incomeConfigs, paidItems, variableTransactions, currentMonthKey, settings, currentDate, daysInMonth, categoryNameToId, subCategoryNameToId]);

  const filteredPeriodBudgets = useMemo(() => {
    return periodBudgets.map((w) => {
      let items = w.items;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().replace(/,/g, ".");
        items = items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q) ||
            i.amount.toString().includes(q) ||
            (i.comments && i.comments.toLowerCase().includes(q))
        );
      }

      if (filters) {
        if (filters.flux !== "ALL") {
          if (filters.flux === "EXPENSE") {
            // Dépenses + remboursements (réduisent les dépenses)
            items = items.filter((i) => i.type === "EXPENSE" || (i.type === "INCOME" && i.isRefund));
          } else if (filters.flux === "INCOME") {
            // Revenus purs (sans remboursements)
            items = items.filter((i) => i.type === "INCOME" && !i.isRefund);
          } else if (filters.flux === "REFUND") {
            // Remboursements uniquement
            items = items.filter((i) => i.isRefund === true);
          }
        }
        if (filters.source !== "ALL") items = items.filter((i) => i.source === filters.source);
        if (filters.status !== "ALL") {
          const wantWaiting = filters.status === "WAITING";
          items = items.filter((i) => i.isWaiting === wantWaiting);
        }

        if (filters.nature === "ONLY") {
          items = items.filter((i) => i.isExtra === true);
        } else if (filters.nature === "EXCLUDE") {
          items = items.filter((i) => !i.isExtraGlobal);
        }

        if (filters.salary === "ONLY") items = items.filter((i) => i.isSalary === true);
        else if (filters.salary === "EXCLUDE") items = items.filter((i) => !i.isSalary);
        else if (filters.salary === "NONE") items = [];

        if (filters.isCategoryFilterActive || (filters.includedCategoryIds || []).length > 0) {
          items = items.filter((i) => i.categoryId && (filters.includedCategoryIds || []).includes(i.categoryId));
        }

        if (filters.isSubCategoryFilterActive || (filters.includedSubCategoryIds || []).length > 0) {
          items = items.filter((i) => i.subCategoryId && (filters.includedSubCategoryIds || []).includes(i.subCategoryId));
        }

        if (filters.isAccountFilterActive || filters.accountIds.length > 0) {
          items = items.filter((i) => filters.accountIds.includes(i.accountId));
        }
        if (filters.isBeneficiaryFilterActive || filters.beneficiaryIds.length > 0) {
          items = items.filter((i) => resolveBeneficiaryAmounts(i).some((ba) => filters.beneficiaryIds.includes(ba.beneficiaryId)));
        }
      }

      return { ...w, items };
    });
  }, [periodBudgets, searchQuery, filters]);

  /**
   * Calcule les statistiques financières d'une période budgétaire.
   *
   * @description
   * Analyse une période et toutes les périodes précédentes pour calculer :
   * - Dépenses fixes (payées, à payer, retards)
   * - Dépenses/revenus variables
   * - Soldes par compte
   * - Répartition par bénéficiaire
   * - Reste disponible dans l'enveloppe de la période
   *
   * **Logique des retards :**
   * Les opérations non pointées des périodes précédentes sont comptabilisées
   * comme "délais" et ajoutées aux calculs de la période active.
   *
   * **Remboursements :**
   * Les revenus dans des catégories de type EXPENSE ou nommées "Remboursement"
   * sont traités comme des réductions de dépenses (varExpenses -= montant).
   *
   * **Soldes par compte :**
   * - `paid` : Somme des opérations pointées (dépenses positives, revenus négatifs)
   * - `remaining` : Somme des opérations en attente
   * - `planned` : Somme des montants théoriques des configs (hors variables)
   * - `pendingCount` : Nombre d'opérations en attente
   *
   * @param {number} activeWeek - Numéro de la période active (1-indexé)
   * @returns {Object} Statistiques calculées
   * @returns {number} fixedPaid - Dépenses fixes déjà payées
   * @returns {number} fixedToPay - Dépenses fixes à payer cette période
   * @returns {number} fixedDelays - Dépenses fixes en retard (périodes précédentes)
   * @returns {number} fixedPlanned - Total théorique des dépenses fixes
   * @returns {number} varExpenses - Dépenses variables pointées (hors Extra)
   * @returns {number} varIncome - Revenus variables pointés (hors Extra, hors remboursements)
   * @returns {number} periodLimit - Budget alloué à cette période
   * @returns {number} varRemaining - Reste disponible (periodLimit + varIncome - varExpenses)
   * @returns {number} totalIncomeReal - Total des revenus pointés
   * @returns {Record<string, Object>} byAccount - Statistiques par compte (paid, remaining, remainingStandard, planned, pendingCount)
   * @returns {Record<string, Object>} expByBeneficiary - Dépenses par bénéficiaire (paid, planned)
   * @returns {Record<string, Object>} incByBeneficiary - Revenus par bénéficiaire (paid, planned)
   *
   */
  const calculatePeriodStatistics = (activeWeek: number) => {
    const safeActiveWeek = periodBudgets.some((w) => w.weekNumber === activeWeek) ? activeWeek : 1;
    const currentWeek = periodBudgets.find((w) => w.weekNumber === safeActiveWeek);
    const currentItems = currentWeek?.items || [];
    const previousUnpaidItems = periodBudgets
      .filter((w) => w.weekNumber < safeActiveWeek)
      .flatMap((w) => w.items)
      .filter((i) => !i.isPaid);

    const sum = (items: PlannedItem[], type: "EXPENSE" | "INCOME", useOriginal = false) =>
      items.filter((i) => i.type === type).reduce((acc, i) => acc + (useOriginal ? i.originalAmount : i.amount), 0);

    type AccountStats = { paid: number; remaining: number; remainingStandard: number; paidStandard: number; planned: number; pendingCount: number };
    type BeneficiaryStats = { paid: number; planned: number };

    const byAccount: Record<string, AccountStats> = {};
    const expByBeneficiary: Record<string, BeneficiaryStats> = {};
    const incByBeneficiary: Record<string, BeneficiaryStats> = {};

    [...currentItems, ...previousUnpaidItems].forEach((item) => {
      // Exclure les salaires en attente des calculs de soldes
      if (item.isSalary && item.isWaiting) return;

      if (!byAccount[item.accountId]) byAccount[item.accountId] = { paid: 0, remaining: 0, remainingStandard: 0, paidStandard: 0, planned: 0, pendingCount: 0 };
      const val = item.amount;
      const originalVal = item.originalAmount;

      if (item.isPaid) {
        const impact = item.type === "EXPENSE" ? val : -val;
        byAccount[item.accountId].paid += impact;

        const standardImpact = item.type === "EXPENSE" ? getStandardAmount(item) : -getStandardAmount(item);
        byAccount[item.accountId].paidStandard += standardImpact;
      } else {
        const impact = item.type === "EXPENSE" ? -val : val;
        byAccount[item.accountId].remaining += impact;
        byAccount[item.accountId].pendingCount++;

        const standardImpact = item.type === "EXPENSE" ? -getStandardAmount(item) : getStandardAmount(item);
        byAccount[item.accountId].remainingStandard += standardImpact;
      }

      if (item.source === "RECURRING") {
        byAccount[item.accountId].planned += item.type === "EXPENSE" ? originalVal : -originalVal;
      }

      if (item.category !== "Virement Interne") {
        const beneficiaryAmounts = resolveBeneficiaryAmounts(item);

        beneficiaryAmounts.forEach((beneficiaryAmount) => {
          const beneficiaryShare = item.amount > 0 ? beneficiaryAmount.amount / item.amount : 0;
          const plannedShare = beneficiaryShare * originalVal;

          if (item.isPaid) {
            if (!incByBeneficiary[beneficiaryAmount.beneficiaryId]) incByBeneficiary[beneficiaryAmount.beneficiaryId] = { paid: 0, planned: 0 };
            if (!expByBeneficiary[beneficiaryAmount.beneficiaryId]) expByBeneficiary[beneficiaryAmount.beneficiaryId] = { paid: 0, planned: 0 };

            if (item.type === "INCOME") incByBeneficiary[beneficiaryAmount.beneficiaryId].paid += beneficiaryAmount.amount;
            else expByBeneficiary[beneficiaryAmount.beneficiaryId].paid += beneficiaryAmount.amount;
          }

          if (item.source === "RECURRING") {
            if (item.type === "INCOME") {
              if (!incByBeneficiary[beneficiaryAmount.beneficiaryId]) incByBeneficiary[beneficiaryAmount.beneficiaryId] = { paid: 0, planned: 0 };
              incByBeneficiary[beneficiaryAmount.beneficiaryId].planned += plannedShare;
            } else {
              if (!expByBeneficiary[beneficiaryAmount.beneficiaryId]) expByBeneficiary[beneficiaryAmount.beneficiaryId] = { paid: 0, planned: 0 };
              expByBeneficiary[beneficiaryAmount.beneficiaryId].planned += plannedShare;
            }
          }
        });
      }
    });

    const periodLimit = currentWeek?.periodLimit || 0;

    return {
      fixedPaid: sum(
        currentItems.filter((i) => i.source === "RECURRING" && i.isPaid && i.category !== "Virement Interne"),
        "EXPENSE"
      ),
      fixedToPay: sum(
        currentItems.filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne"),
        "EXPENSE"
      ),
      fixedDelays: sum(
        previousUnpaidItems.filter((i) => i.source === "RECURRING" && i.category !== "Virement Interne"),
        "EXPENSE"
      ),
      fixedPlanned: sum(
        currentItems.filter((i) => i.source === "RECURRING" && i.category !== "Virement Interne"),
        "EXPENSE",
        true
      ),
      periodLimit,
      totalIncomeReal: sum(
        currentItems.filter((i) => i.isPaid && i.category !== "Virement Interne"),
        "INCOME"
      ),
      byAccount,
      expByBeneficiary,
      incByBeneficiary,
    };
  };

  // IDs des catégories/sous-catégories effectivement utilisées ce mois-ci (avant tout filtre)
  const availableCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    periodBudgets.forEach((w) =>
      w.items.forEach((item) => {
        if (item.categoryId) ids.add(item.categoryId);
      })
    );
    return Array.from(ids);
  }, [periodBudgets]);

  const availableSubCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    periodBudgets.forEach((w) =>
      w.items.forEach((item) => {
        if (item.subCategoryId) ids.add(item.subCategoryId);
      })
    );
    return Array.from(ids);
  }, [periodBudgets]);

  return { filteredPeriodBudgets, calculatePeriodStatistics, availableCategoryIds, availableSubCategoryIds };
};

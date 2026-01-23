/**
 * @file Hook de calcul des données du Dashboard
 * @description Centralise toute la logique de calcul des statistiques annuelles et mensuelles
 * pour le Dashboard. Extrait 280+ lignes de logique métier de DashboardView.tsx.
 *
 * @architecture
 * **Responsabilités :**
 * - Calcul du tableau macro annuel (salaires inclus)
 * - Calcul du tableau détaillé par période (salaires exclus)
 * - Détection des remboursements (helper)
 * - Filtrage des comptes courants
 * - Génération des périodes selon settings
 *
 * **Logique métier :**
 * - **globalMonthlyData** : Agrégation mensuelle pour cashflow global
 *   * Salaires récurrents
 *   * Autres revenus (récurrents + variables)
 *   * Dépenses (récurrentes + variables)
 *   * Balance et taux d'épargne
 *
 * - **annualData** : Détail mensuel par période (HORS SALAIRES)
 *   * Génération périodes (FIXED_DAYS, CUSTOM_SPLIT, CALENDAR_WEEKS)
 *   * Agrégation par période (revenus récurrents/variables, dépenses)
 *   * Traitement des remboursements (réduction dépenses)
 *
 * **Optimisation :**
 * Tous les calculs sont memoizés pour éviter les recalculs inutiles.
 *
 * @dependencies
 * - date-fns : getDaysInMonth pour calcul périodes
 * - types.ts : Interfaces métier
 */
import { useMemo, useCallback } from "react";
import { getDaysInMonth } from "date-fns";
import {
  Account,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  AppSettings,
  VariableTransaction,
  CategoryDef,
  AccountType,
  OperationFilters,
} from "../../types";

/**
 * Retourne les filtres standards pour le tableau "Analyse Complète (Réel)".
 *
 * @description
 * Fonction helper qui garantit la cohérence entre :
 * - Les calculs dans useDashboardData (données affichées)
 * - Les filtres de navigation dans AnnualIncomeAnalysis (ClickableAmount)
 *
 * **Règles de filtrage :**
 * - Statut : REAL uniquement (opérations pointées)
 * - Salaires : EXCLUS (tableau séparé "Trésorerie Globale")
 * - Virements internes : INCLUS (flux complet)
 * - Nature : TOUT (Standard + Extra)
 *
 * @param {("EXPENSE" | "INCOME")} flux - Type de flux (dépenses/revenus)
 * @param {("RECURRING" | "VARIABLE" | "ALL")} source - Source des opérations
 * @returns {OperationFilters} Filtres complets pour navigation
 *
 * @example
 * ```tsx
 * // Dans AnnualIncomeAnalysis
 * const filters = getDetailedAnalysisFilters("INCOME", "RECURRING");
 * <ClickableAmount filters={filters} />
 * ```
 */
export const getDetailedAnalysisFilters = (flux: "EXPENSE" | "INCOME", source: "RECURRING" | "VARIABLE" | "ALL"): OperationFilters => ({
  flux,
  source,
  status: "REAL", // Uniquement opérations pointées (cohérent avec titre "Réel")
  nature: "ALL", // Inclut Standard + Extra
  transfer: "ALL", // Inclut virements internes (flux complet)
  salary: "EXCLUDE", // Salaires dans tableau séparé "Trésorerie Globale"
  accountIds: [],
  beneficiaryIds: [],
  includedTagIds: [],
  excludedTagIds: [],
  tagPresence: "ALL",
});

/**
 * Type de colonne pour le tableau "Trésorerie Globale & Épargne".
 * Chaque colonne a ses propres règles de filtrage spécifiques.
 */
export type GlobalAnalysisColumn = "salaries" | "otherIncome" | "totalIncome" | "expenses";

/**
 * Retourne les filtres standards pour le tableau "Trésorerie Globale & Épargne".
 *
 * @description
 * Fonction helper qui garantit la cohérence entre :
 * - Les calculs dans globalMonthlyData (données affichées)
 * - Les filtres de navigation dans GlobalMonthlyAnalysis (ClickableAmount)
 *
 * **Règles par colonne :**
 * - **Salaries** : Revenus récurrents pointés avec isSalary=true
 * - **OtherIncome** : Revenus (récurrents + variables) HORS salaires
 * - **TotalIncome** : Tous les revenus (avec salaires)
 * - **Expenses** : Toutes les dépenses (récurrentes + variables)
 *
 * @param {GlobalAnalysisColumn} column - Colonne du tableau
 * @returns {OperationFilters} Filtres complets pour navigation
 *
 * @example
 * ```tsx
 * // Dans GlobalMonthlyAnalysis
 * const filters = getGlobalAnalysisFilters("salaries");
 * <ClickableAmount filters={filters} />
 * ```
 */
export const getGlobalAnalysisFilters = (column: GlobalAnalysisColumn): OperationFilters => {
  // Base commune pour toutes les colonnes
  const baseFilters: OperationFilters = {
    flux: "INCOME",
    source: "ALL",
    status: "REAL", // Uniquement opérations pointées (titre "Réel")
    nature: "ALL",
    transfer: "ALL", // Inclut virements internes
    salary: "ALL",
    accountIds: [],
    beneficiaryIds: [],
    includedTagIds: [],
    excludedTagIds: [],
    tagPresence: "ALL",
  };

  switch (column) {
    case "salaries":
      return {
        ...baseFilters,
        flux: "INCOME",
        source: "RECURRING", // Salaires sont toujours récurrents
        salary: "ONLY", // Uniquement les salaires
      };

    case "otherIncome":
      return {
        ...baseFilters,
        flux: "INCOME",
        source: "ALL", // Récurrents + Variables
        salary: "EXCLUDE", // SANS les salaires
      };

    case "totalIncome":
      return {
        ...baseFilters,
        flux: "INCOME",
        source: "ALL",
        salary: "ALL", // TOUS les revenus
      };

    case "expenses":
      return {
        ...baseFilters,
        flux: "EXPENSE",
        source: "ALL", // Récurrentes + Variables
        salary: "EXCLUDE", // Les salaires ne sont pas des dépenses
      };

    default:
      return baseFilters;
  }
};

/**
 * Interface des données mensuelles globales (macro).
 * Utilisée pour le graphique de cashflow avec salaires inclus.
 */
export interface GlobalMonthData {
  monthName: string;
  salaries: number;
  otherIncome: number;
  totalIncome: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

/**
 * Interface d'une période au sein d'un mois.
 * Structure hiérarchique : Année > Mois > Périodes
 */
interface PeriodData {
  period: {
    id: number;
    start: number;
    end: number;
    label: string;
  };
  income: {
    recurring: number;
    variable: number;
    total: number;
  };
  expenses: {
    recurring: number;
    variable: number;
    variableStandard: number; // Dépenses variables dans le budget
    variableExtra: number; // Dépenses variables hors budget
    total: number;
  };
  balance: number;
}

/**
 * Interface des données mensuelles détaillées (micro).
 * Utilisée pour l'analyse par période avec salaires exclus.
 */
export interface AnnualMonthData {
  monthName: string;
  monthIndex: number;
  dateObj: Date;
  periods: PeriodData[];
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
}

/**
 * Props du hook useDashboardData.
 */
interface UseDashboardDataProps {
  accounts: Account[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  categories: CategoryDef[];
  selectedYear: number;
}

/**
 * Hook de calcul des données du Dashboard.
 *
 * @description
 * Extrait toute la logique de calcul des statistiques du DashboardView pour une
 * architecture clean séparant logique métier et présentation.
 *
 * **Workflow :**
 * 1. Identification des comptes courants (type CHECKING)
 * 2. Calcul du tableau macro annuel (globalMonthlyData) :
 *    - Pour chaque mois de l'année
 *    - Agrégation salaires + autres revenus + dépenses
 *    - Calcul balance et taux d'épargne
 * 3. Calcul du tableau détaillé (annualData) :
 *    - Génération des périodes selon settings (FIXED_DAYS, CUSTOM_SPLIT, etc.)
 *    - Agrégation par période (revenus/dépenses récurrents et variables)
 *    - Exclusion des salaires
 *
 * **Remboursements :**
 * Les revenus dans des catégories de type EXPENSE ou nommées "Remboursement"/"Dépenses"
 * sont traités comme des réductions de dépenses (montant négatif).
 *
 * @param {UseDashboardDataProps} props - Paramètres de calcul
 * @returns {Object} Données calculées
 * @returns {string[]} checkingAccountIds - IDs des comptes courants
 * @returns {GlobalMonthData[]} globalMonthlyData - Tableau macro (12 mois, salaires inclus)
 * @returns {AnnualMonthData[]} annualData - Tableau détaillé (12 mois, périodes, salaires exclus)
 *
 * @example
 * ```tsx
 * const { globalMonthlyData, annualData } = useDashboardData({
 *   accounts,
 *   configs,
 *   incomeConfigs,
 *   paidItems,
 *   variableTransactions,
 *   settings,
 *   categories,
 *   selectedYear: 2025
 * });
 *
 * <GlobalMonthlyAnalysis data={globalMonthlyData} />
 * <AnnualIncomeAnalysis data={annualData} />
 * ```
 */
export const useDashboardData = ({
  accounts,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  settings,
  categories,
  selectedYear,
}: UseDashboardDataProps) => {
  // --- CALCULS PRÉLIMINAIRES ---

  /**
   * Identification des comptes courants.
   * Utilisés pour filtrer les transactions variables pertinentes.
   */
  const checkingAccountIds = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING).map((a) => a.id), [accounts]);

  /**
   * Détecte si une catégorie représente un remboursement.
   *
   * @description
   * Un revenu est considéré comme remboursement si :
   * - Nom de catégorie = "Remboursement" OU "Dépenses"
   * - Type de catégorie = EXPENSE (dans categories)
   *
   * **Traitement :**
   * Les remboursements réduisent les dépenses au lieu d'augmenter les revenus.
   *
   * @param {string} categoryName - Nom de la catégorie à vérifier
   * @returns {boolean} True si c'est un remboursement
   */
  const isRefundCategory = useCallback(
    (categoryName: string) => {
      if (categoryName === "Remboursement" || categoryName === "Dépenses") return true;
      const catDef = categories.find((c) => c.name === categoryName);
      return catDef?.type === "EXPENSE";
    },
    [categories]
  );

  // --- CALCUL 1 : TABLEAU MACRO (Salaires inclus) ---

  /**
   * Calcule les données mensuelles globales sur l'année.
   *
   * @description
   * **Données agrégées par mois :**
   * - Salaires récurrents pointés (isSalary = true)
   * - Autres revenus (récurrents non-salaires + variables)
   * - Dépenses totales (récurrentes + variables)
   * - Balance (revenus - dépenses)
   * - Taux d'épargne (balance / revenus * 100)
   *
   * **Exclusions :**
   * - Opérations en attente (isWaiting = true)
   * - Virements internes
   *
   * **Remboursements :**
   * Traités comme réduction de dépenses (expenseTotal -= amount)
   *
   * @returns {GlobalMonthData[]} Tableau de 12 mois (inversé, décembre en premier)
   */
  const globalMonthlyData = useMemo(() => {
    const data: GlobalMonthData[] = [];

    for (let month = 0; month < 12; month++) {
      const currentMonthDate = new Date(selectedYear, month, 1);
      const monthKey = `${selectedYear}-${String(month + 1).padStart(2, "0")}`;

      let salaryTotal = 0;
      let otherIncomeTotal = 0;
      let expenseTotal = 0;

      // 1. Salaires et Revenus Récurrents
      incomeConfigs.forEach((inc) => {
        // Vérifier plage de validité
        if (inc.startMonth && monthKey < inc.startMonth) return;
        if (inc.endMonth && monthKey > inc.endMonth) return;

        const instanceId = `${inc.id}-${monthKey}`;
        const paid = paidItems[instanceId];

        // Si payé, on prend le montant réel, sinon 0 (car on est sur du "Réel")
        if (paid && !paid.isWaiting) {
          // Vérification si c'est un remboursement récurrent (rare mais possible)
          if (isRefundCategory(inc.category)) {
            expenseTotal -= paid.amount;
          } else if (inc.isSalary) {
            salaryTotal += paid.amount;
          } else {
            otherIncomeTotal += paid.amount;
          }
        }
      });

      // 2. Dépenses Récurrentes (Réel)
      configs.forEach((conf) => {
        if (conf.startMonth && monthKey < conf.startMonth) return;
        if (conf.endMonth && monthKey > conf.endMonth) return;

        const instanceId = `${conf.id}-${monthKey}`;
        const paid = paidItems[instanceId];

        if (paid && !paid.isWaiting) {
          expenseTotal += paid.amount;
        }
      });

      // 3. Transactions Variables (Réel)
      variableTransactions.forEach((tx) => {
        if (!checkingAccountIds.includes(tx.accountId)) return;
        if (tx.isWaiting) return;
        if (tx.category === "Virement Interne") return;

        const [y, m] = tx.date.split("-").map(Number);
        if (y === selectedYear && m - 1 === month) {
          if (tx.type === "INCOME") {
            if (isRefundCategory(tx.category)) {
              // Remboursement : on diminue les dépenses au lieu d'augmenter les revenus
              expenseTotal -= tx.amount;
            } else {
              otherIncomeTotal += tx.amount;
            }
          } else {
            expenseTotal += tx.amount;
          }
        }
      });

      const totalIncome = salaryTotal + otherIncomeTotal;
      const balance = totalIncome - expenseTotal;
      const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

      data.push({
        monthName: new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(currentMonthDate),
        salaries: salaryTotal,
        otherIncome: otherIncomeTotal,
        totalIncome,
        expenses: expenseTotal,
        balance,
        savingsRate,
      });
    }

    return data.reverse();
  }, [selectedYear, configs, incomeConfigs, paidItems, variableTransactions, checkingAccountIds, isRefundCategory]);

  // --- CALCUL 2 : TABLEAU DÉTAILLÉ PAR PÉRIODE (Salaires EXCLUS) ---

  /**
   * Calcule les données mensuelles détaillées par période sur l'année.
   *
   * @description
   * **Workflow par mois :**
   * 1. Génération des périodes selon `settings.period_type` :
   *    - **FIXED_DAYS** : Périodes de N jours (ex: 7 jours)
   *    - **CUSTOM_SPLIT** : Division du mois en N parts égales
   *    - Autre : Semaines de 7 jours (fallback)
   *
   * 2. Agrégation des données par période :
   *    - Revenus récurrents (HORS SALAIRES, pointés uniquement)
   *    - Revenus variables (HORS SALAIRES)
   *    - Dépenses récurrentes (pointées)
   *    - Dépenses variables
   *
   * 3. Affectation à la période selon le jour du mois
   *
   * **Exclusions :**
   * - Salaires (isSalary = true)
   * - Opérations en attente (isWaiting = true)
   * - Virements internes
   *
   * **Remboursements :**
   * Traités comme montants négatifs dans les buckets de dépenses
   *
   * @returns {AnnualMonthData[]} Tableau de 12 mois avec détails par période (inversé)
   */
  const annualData = useMemo(() => {
    const monthsData: AnnualMonthData[] = [];

    for (let month = 0; month < 12; month++) {
      const currentMonthDate = new Date(selectedYear, month, 1);
      const monthKey = `${selectedYear}-${String(month + 1).padStart(2, "0")}`;
      const daysInMonth = getDaysInMonth(currentMonthDate);

      // --- ÉTAPE 1 : GÉNÉRATION DES PÉRIODES ---

      const periods: { id: number; start: number; end: number; label: string }[] = [];
      const type = settings.period_type || "FIXED_DAYS";
      const val = settings.period_value || 7;

      if (type === "FIXED_DAYS") {
        // Périodes de N jours fixes
        for (let start = 1; start <= daysInMonth; start += val) {
          const end = Math.min(start + val - 1, daysInMonth);
          periods.push({ id: periods.length + 1, start, end, label: `Période ${periods.length + 1}` });
        }
      } else if (type === "CUSTOM_SPLIT") {
        // Division en N parts égales
        const parts = Math.max(1, Math.min(daysInMonth, val));
        const daysPerPart = Math.floor(daysInMonth / parts);
        for (let i = 0; i < parts; i++) {
          const start = i * daysPerPart + 1;
          const end = i === parts - 1 ? daysInMonth : (i + 1) * daysPerPart;
          periods.push({ id: i + 1, start, end, label: `Période ${i + 1}` });
        }
      } else {
        // Fallback : semaines de 7 jours
        for (let start = 1; start <= daysInMonth; start += 7) {
          const end = Math.min(start + 6, daysInMonth);
          periods.push({ id: periods.length + 1, start, end, label: `Semaine ${periods.length + 1}` });
        }
      }

      // --- ÉTAPE 2 : INITIALISATION DES DONNÉES PAR PÉRIODE ---

      const periodData: PeriodData[] = periods.map((p) => ({
        period: p,
        income: { salaries: 0, recurring: 0, variable: 0, total: 0 },
        expenses: { recurring: 0, variable: 0, variableStandard: 0, variableExtra: 0, total: 0 },
        balance: 0,
      }));

      /**
       * Ajoute un montant à une période spécifique.
       *
       * @param {number} day - Jour du mois (1-31)
       * @param {number} amount - Montant à ajouter (peut être négatif pour remboursements)
       * @param {"income_recurring" | "income_variable" | "expense_recurring" | "expense_variable"} type - Type d'opération
       * @param {boolean} isExtra - Si true, montant hors budget (uniquement pour expense_variable)
       */
      const addToPeriod = (
        day: number,
        amount: number,
        type: "income_salary" | "income_recurring" | "income_variable" | "expense_recurring" | "expense_variable",
        isExtra = false
      ) => {
        const pIndex = periods.findIndex((p) => day >= p.start && day <= p.end);
        if (pIndex !== -1) {
          if (type === "income_salary") {
            periodData[pIndex].income.salaries += amount;
            periodData[pIndex].income.total += amount;
            periodData[pIndex].balance += amount;
          } else if (type === "income_recurring") {
            periodData[pIndex].income.recurring += amount;
            periodData[pIndex].income.total += amount;
            periodData[pIndex].balance += amount;
          } else if (type === "income_variable") {
            periodData[pIndex].income.variable += amount;
            periodData[pIndex].income.total += amount;
            periodData[pIndex].balance += amount;
          } else if (type === "expense_recurring") {
            periodData[pIndex].expenses.recurring += amount;
            periodData[pIndex].expenses.total += amount;
            periodData[pIndex].balance -= amount;
          } else if (type === "expense_variable") {
            // Ventilation Standard/Extra pour les dépenses variables
            periodData[pIndex].expenses.variable += amount;
            if (isExtra) {
              periodData[pIndex].expenses.variableExtra += amount;
            } else {
              periodData[pIndex].expenses.variableStandard += amount;
            }
            periodData[pIndex].expenses.total += amount;
            periodData[pIndex].balance -= amount;
          }
        }
      };

      // --- ÉTAPE 3A : AGRÉGATION SALAIRES (Réel uniquement) ---

      incomeConfigs.forEach((inc) => {
        if (!inc.isSalary) return; // UNIQUEMENT les salaires
        if (inc.startMonth && monthKey < inc.startMonth) return;
        if (inc.endMonth && monthKey > inc.endMonth) return;

        const instanceId = `${inc.id}-${monthKey}`;
        const paid = paidItems[instanceId];

        if (paid && !paid.isWaiting) {
          let day = inc.dayOfMonth;
          if (paid.paymentDate) {
            const parts = paid.paymentDate.split("-").map(Number);
            if (parts.length === 3) day = parts[2];
          }
          addToPeriod(day, paid.amount, "income_salary");
        }
      });

      // --- ÉTAPE 3B : AGRÉGATION REVENUS RÉCURRENTS (Réel uniquement, HORS SALAIRES) ---

      incomeConfigs.forEach((inc) => {
        if (inc.isSalary) return; // EXCLUSION des salaires
        if (inc.startMonth && monthKey < inc.startMonth) return;
        if (inc.endMonth && monthKey > inc.endMonth) return;

        const instanceId = `${inc.id}-${monthKey}`;
        const paid = paidItems[instanceId];

        if (paid && !paid.isWaiting) {
          let day = inc.dayOfMonth;
          if (paid.paymentDate) {
            const parts = paid.paymentDate.split("-").map(Number);
            if (parts.length === 3) day = parts[2];
          }

          if (isRefundCategory(inc.category)) {
            // Remboursement récurrent -> Réduit les dépenses récurrentes
            addToPeriod(day, -paid.amount, "expense_recurring");
          } else {
            addToPeriod(day, paid.amount, "income_recurring");
          }
        }
      });

      // --- ÉTAPE 4 : AGRÉGATION DÉPENSES RÉCURRENTES (Réel uniquement) ---

      configs.forEach((conf) => {
        if (conf.startMonth && monthKey < conf.startMonth) return;
        if (conf.endMonth && monthKey > conf.endMonth) return;

        const instanceId = `${conf.id}-${monthKey}`;
        const paid = paidItems[instanceId];

        if (paid && !paid.isWaiting) {
          let day = conf.dayOfMonth;
          if (paid.paymentDate) {
            const parts = paid.paymentDate.split("-").map(Number);
            if (parts.length === 3) day = parts[2];
          }
          addToPeriod(day, paid.amount, "expense_recurring");
        }
      });

      // --- ÉTAPE 5 : AGRÉGATION TRANSACTIONS VARIABLES (Réel uniquement) ---

      variableTransactions.forEach((tx) => {
        if (!checkingAccountIds.includes(tx.accountId)) return;

        const [y, m, d] = tx.date.split("-").map(Number);

        if (y === selectedYear && m - 1 === month) {
          if (tx.isWaiting) return; // Exclusion stricte du prévisionnel
          if (tx.category === "Virement Interne") return;

          if (tx.type === "INCOME") {
            if (isRefundCategory(tx.category)) {
              // Remboursement variable -> Réduit les dépenses variables
              // Note: Les remboursements ne sont pas concernés par Extra/Standard
              addToPeriod(d, -tx.amount, "expense_variable", false);
            } else {
              addToPeriod(d, tx.amount, "income_variable", false);
            }
          } else {
            // Dépense variable : Gestion des montants Extra/Standard avec tags
            // RÈGLE 1 : Si toggle global Extra activé → Tout est Extra
            if (tx.isExtra) {
              addToPeriod(d, tx.amount, "expense_variable", true);
            }
            // RÈGLE 2 : Pas de toggle global → Analyser les tags individuels
            else if (tx.tagAmounts && tx.tagAmounts.length > 0) {
              // Calculer la somme des montants Extra dans les tags
              const extraSum = tx.tagAmounts.filter((ta) => ta.isExtra === true).reduce((sum, ta) => sum + ta.amount, 0);

              // Calculer la somme des montants Standard (reste)
              const standardSum = tx.amount - extraSum;

              // Ajouter les deux parties séparément
              if (extraSum > 0.01) {
                addToPeriod(d, extraSum, "expense_variable", true);
              }
              if (standardSum > 0.01) {
                addToPeriod(d, standardSum, "expense_variable", false);
              }
            }
            // RÈGLE 3 : Pas de toggle, pas de tags → Tout est Standard
            else {
              addToPeriod(d, tx.amount, "expense_variable", false);
            }
          }
        }
      });

      // --- ÉTAPE 6 : CALCUL DES TOTAUX MENSUELS ---

      const monthTotals = periodData.reduce(
        (acc, p) => ({
          income: acc.income + p.income.total,
          expenses: acc.expenses + p.expenses.total,
          balance: acc.balance + p.balance,
        }),
        { income: 0, expenses: 0, balance: 0 }
      );

      monthsData.push({
        monthName: new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(currentMonthDate),
        monthIndex: month,
        dateObj: currentMonthDate,
        periods: periodData,
        totals: monthTotals,
      });
    }

    return monthsData.reverse();
  }, [selectedYear, configs, incomeConfigs, paidItems, variableTransactions, settings, checkingAccountIds, isRefundCategory]);

  return {
    checkingAccountIds,
    globalMonthlyData,
    annualData,
  };
};

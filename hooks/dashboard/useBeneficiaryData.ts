/**
 * @file Hook de calcul des données par bénéficiaire
 * @description Calcule les statistiques financières agrégées par bénéficiaire
 * pour l'affichage dans le tableau "Analyse Complète (Bénéficiaires)".
 *
 * @architecture
 * **Responsabilités :**
 * - Agrégation des revenus/dépenses par bénéficiaire
 * - Calcul des salaires par bénéficiaire
 * - Séparation Standard/Extra pour les variables
 * - Génération des données mensuelles avec détail par personne
 *
 * **Logique métier :**
 * - Filtre comptes courants uniquement
 * - Opérations pointées uniquement (status: REAL)
 * - Exclut virements internes des calculs
 * - Traite les remboursements comme réduction de dépenses
 *
 * @dependencies
 * - types.ts : Interfaces métier (Account, Person, configs, etc.)
 */
import { useMemo } from "react";
import { Account, ExpenseConfig, IncomeConfig, PaidItemDetails, VariableTransaction, CategoryDef, Person, AccountType, OperationFilters } from "../../types";
import { resolveBeneficiaryAmounts, getStandardAmount, getExtraAmount, isBudgetExcluded } from "../../services/financeUtils";

/**
 * Interface des données d'un bénéficiaire au sein d'un mois.
 */
export interface BeneficiaryData {
  beneficiaryId: string;
  beneficiaryName: string;
  income: {
    salaries: number; // Salaires récurrents
    recurring: number; // Revenus récurrents hors salaires
    variable: number; // Revenus variables
    total: number; // Total tous revenus
  };
  expenses: {
    recurring: number; // Dépenses récurrentes
    variable: number; // Total dépenses variables (Standard + Extra)
    variableStandard: number; // Dépenses variables dans budget
    variableExtra: number; // Dépenses variables hors budget
    total: number; // Total toutes dépenses
  };
  balance: number; // Revenus - Dépenses
}

/**
 * Interface des données mensuelles par bénéficiaire.
 */
export interface BeneficiaryMonthData {
  monthName: string;
  monthIndex: number;
  dateObj: Date;
  beneficiaries: BeneficiaryData[];
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
}

interface UseBeneficiaryDataProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  categories: CategoryDef[];
  selectedYear: number;
}

/**
 * Retourne les filtres pour navigation vers Operations depuis cellules cliquables.
 *
 * @param {string} beneficiaryId - ID du bénéficiaire
 * @param {("EXPENSE" | "INCOME")} flux - Type de flux
 * @param {("RECURRING" | "VARIABLE" | "ALL")} source - Source des opérations
 * @param {("ALL" | "ONLY" | "EXCLUDE")} nature - Filtre Extra/Standard
 * @returns {OperationFilters} Filtres complets
 */
export const getBeneficiaryAnalysisFilters = (
  beneficiaryId: string,
  flux: "EXPENSE" | "INCOME",
  source: "RECURRING" | "VARIABLE" | "ALL",
  nature: "ALL" | "ONLY" | "EXCLUDE" = "ALL"
): OperationFilters => ({
  flux,
  source,
  status: "REAL", // Uniquement opérations pointées
  nature,
  salary: flux === "INCOME" && source === "RECURRING" ? "ALL" : "EXCLUDE",
  accountIds: [],
  isAccountFilterActive: false,
  beneficiaryIds: [beneficiaryId],
  isBeneficiaryFilterActive: true,
  includedTagIds: [],
  excludedTagIds: [],
  tagPresence: "ALL",
  includedCategoryIds: [],
  isCategoryFilterActive: false,
  includedSubCategoryIds: [],
  isSubCategoryFilterActive: false,
});

/**
 * Hook de calcul des données par bénéficiaire.
 *
 * @description
 * Génère les statistiques mensuelles agrégées par bénéficiaire pour toute l'année.
 * Filtre uniquement les comptes courants et les opérations pointées.
 *
 * @param {UseBeneficiaryDataProps} props - Configuration du calcul
 * @returns {BeneficiaryMonthData[]} Données mensuelles avec détail par bénéficiaire
 */
export const useBeneficiaryData = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  categories,
  selectedYear,
}: UseBeneficiaryDataProps): BeneficiaryMonthData[] => {
  // Filtrer uniquement les comptes courants
  const checkingAccountIds = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING).map((a) => a.id), [accounts]);

  return useMemo(() => {
    // Helper : Détection des remboursements (revenus dans catégories de type EXPENSE)
    const isRefund = (category: string): boolean => {
      if (category === "Dépenses" || category === "Remboursement") return true;
      const catDef = categories.find((c) => c.name === category);
      return catDef?.type === "EXPENSE";
    };

    const result: BeneficiaryMonthData[] = [];

    // Boucle sur les 12 mois de l'année
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDate = new Date(selectedYear, monthIndex, 1);
      const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
      const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(monthDate);

      // Initialiser les données par bénéficiaire
      const beneficiariesMap: Record<string, BeneficiaryData> = {};

      // Initialiser tous les bénéficiaires (même sans opérations)
      people.forEach((person) => {
        beneficiariesMap[person.id] = {
          beneficiaryId: person.id,
          beneficiaryName: person.name,
          income: { salaries: 0, recurring: 0, variable: 0, total: 0 },
          expenses: { recurring: 0, variable: 0, variableStandard: 0, variableExtra: 0, total: 0 },
          balance: 0,
        };
      });

      // ÉTAPE 1 : REVENUS RÉCURRENTS (AVEC SALAIRES)
      incomeConfigs
        .filter((inc) => checkingAccountIds.includes(inc.accountId))
        .forEach((inc) => {
          const instanceId = `${inc.id}-${monthKey}`;
          const paid = paidItems[instanceId];
          if (!paid || paid.isWaiting) return;
          if (isBudgetExcluded(paid)) return;

          const isSalary = inc.isSalary || false;
          resolveBeneficiaryAmounts(paid).forEach((ba) => {
            if (!beneficiariesMap[ba.beneficiaryId]) return;
            const b = beneficiariesMap[ba.beneficiaryId];
            if (isSalary) b.income.salaries += ba.amount;
            else b.income.recurring += ba.amount;
            b.income.total += ba.amount;
          });
        });

      // ÉTAPE 2 : REVENUS VARIABLES
      variableTransactions
        .filter((vt) => {
          if (vt.type !== "INCOME") return false;
          if (!checkingAccountIds.includes(vt.accountId)) return false;
          const d = new Date(vt.date);
          return d.getFullYear() === selectedYear && d.getMonth() === monthIndex;
        })
        .forEach((vt) => {
          if (vt.isWaiting) return;
          if (isBudgetExcluded(vt)) return;

          const standardAmount = getStandardAmount(vt);
          const extraAmount = getExtraAmount(vt);

          // Remboursements : Réduire les dépenses au lieu d'augmenter revenus
          if (isRefund(vt.category)) {
            resolveBeneficiaryAmounts(vt).forEach((ba) => {
              if (!beneficiariesMap[ba.beneficiaryId]) return;
              const b = beneficiariesMap[ba.beneficiaryId];
              const ratio = vt.amount > 0 ? ba.amount / vt.amount : 0;
              b.expenses.variableStandard -= standardAmount * ratio;
              b.expenses.variableExtra -= extraAmount * ratio;
              b.expenses.variable -= ba.amount;
              b.expenses.total -= ba.amount;
            });
          } else {
            resolveBeneficiaryAmounts(vt).forEach((ba) => {
              if (!beneficiariesMap[ba.beneficiaryId]) return;
              const b = beneficiariesMap[ba.beneficiaryId];
              b.income.variable += ba.amount;
              b.income.total += ba.amount;
            });
          }
        });

      // ÉTAPE 3 : DÉPENSES RÉCURRENTES
      configs
        .filter((conf) => checkingAccountIds.includes(conf.accountId))
        .forEach((conf) => {
          const instanceId = `${conf.id}-${monthKey}`;
          const paid = paidItems[instanceId];
          if (!paid || paid.isWaiting) return;
          if (isBudgetExcluded(paid)) return;

          resolveBeneficiaryAmounts(paid).forEach((ba) => {
            if (!beneficiariesMap[ba.beneficiaryId]) return;
            beneficiariesMap[ba.beneficiaryId].expenses.recurring += ba.amount;
            beneficiariesMap[ba.beneficiaryId].expenses.total += ba.amount;
          });
        });

      // ÉTAPE 4 : DÉPENSES VARIABLES
      variableTransactions
        .filter((vt) => {
          if (vt.type !== "EXPENSE") return false;
          if (!checkingAccountIds.includes(vt.accountId)) return false;
          const d = new Date(vt.date);
          return d.getFullYear() === selectedYear && d.getMonth() === monthIndex;
        })
        .forEach((vt) => {
          if (vt.isWaiting) return;
          if (isBudgetExcluded(vt)) return;

          const standardTotal = getStandardAmount(vt);
          const extraTotal = getExtraAmount(vt);

          resolveBeneficiaryAmounts(vt).forEach((ba) => {
            if (!beneficiariesMap[ba.beneficiaryId]) return;
            const b = beneficiariesMap[ba.beneficiaryId];
            const ratio = vt.amount > 0 ? ba.amount / vt.amount : 0;
            b.expenses.variableStandard += standardTotal * ratio;
            b.expenses.variableExtra += extraTotal * ratio;
            b.expenses.variable += ba.amount;
            b.expenses.total += ba.amount;
          });
        });

      // ÉTAPE 5 : CALCUL DES BALANCES
      Object.values(beneficiariesMap).forEach((b) => {
        b.balance = b.income.total - b.expenses.total;
      });

      // Convertir en tableau et trier par displayOrder (puis nom si égalité)
      const beneficiariesArray = Object.values(beneficiariesMap).sort((a, b) => {
        const personA = people.find((p) => p.id === a.beneficiaryId);
        const personB = people.find((p) => p.id === b.beneficiaryId);

        // Utiliser displayOrder si défini, sinon 999 (à la fin)
        const orderA = personA?.displayOrder ?? 999;
        const orderB = personB?.displayOrder ?? 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // Si même displayOrder (ou undefined), trier alphabétiquement
        return a.beneficiaryName.localeCompare(b.beneficiaryName);
      });

      // Calculer les totaux mensuels
      const totals = {
        income: beneficiariesArray.reduce((sum, b) => sum + b.income.total, 0),
        expenses: beneficiariesArray.reduce((sum, b) => sum + b.expenses.total, 0),
        balance: beneficiariesArray.reduce((sum, b) => sum + b.balance, 0),
      };

      result.push({
        monthName,
        monthIndex,
        dateObj: monthDate,
        beneficiaries: beneficiariesArray,
        totals,
      });
    }

    return result;
  }, [people, configs, incomeConfigs, paidItems, variableTransactions, categories, selectedYear, checkingAccountIds]);
};

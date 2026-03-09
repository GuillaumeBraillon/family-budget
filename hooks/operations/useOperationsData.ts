/**
 * @file Hook de calcul des données d'opérations (checking accounts + stats)
 * @description Centralise tous les calculs de données pour la vue Opérations :
 * filtrage des comptes courants, génération du planner, calcul des statistiques rapides
 * avec gestion des remboursements et montants effectifs basés sur les tags.
 *
 * @architecture
 * **Responsabilités :**
 * - Filtrage des comptes courants (type CHECKING)
 * - Extraction des opérations associées (configs, revenus, transactions)
 * - Appel au hook usePlanner pour génération des instances mensuelles
 * - Sélection de la portée (mois complet vs période spécifique)
 * - Calcul des statistiques rapides (quickStats) avec logique métier complexe
 *
 * **Logique métier :**
 * - **Remboursements** : Revenus de catégorie "EXPENSE" → Réduction des dépenses
 * - **Montants effectifs** : Si filtres de tags actifs → Utiliser les montants taggés
 * - **Extra** : Comptabilisation séparée des opérations hors budget
 *
 * **Optimisation :**
 * Tous les calculs sont memoizés (useMemo) pour éviter les recalculs inutiles
 * lors des rerenders non liés aux dépendances.
 *
 * @dependencies
 * - hooks/usePlanner : Génération des instances mensuelles
 * - types.ts : Toutes les interfaces métier
 */
import { useMemo } from "react";
import { usePlanner } from "../usePlanner";
import {
  Account,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  VariableTransaction,
  AppSettings,
  CategoryDef,
  OperationFilters,
  PlannedItem,
  AccountType,
} from "../../types";
import { resolveBeneficiaryAmounts } from "../../services/financeUtils";

/**
 * Interface des statistiques rapides d'une période.
 *
 * @description
 * Structure de données pour afficher le résumé financier d'une période
 * (semaine, mois) avec séparation dépenses/revenus et ventilation par statut.
 *
 * **Structure :**
 * ```
 * {
 *   expenses: {
 *     real: 450€,      // Dépenses pointées
 *     planned: 600€,   // Total prévu (configs)
 *     pending: 150€,   // En attente période courante
 *     extra: 50€,      // Hors budget
 *     delays: 100€     // En attente périodes précédentes (retards)
 *   },
 *   income: {
 *     real: 2500€,     // Revenus pointés
 *     planned: 2500€,  // Total prévu
 *     pending: 0€,     // En attente période courante
 *     extra: 0€,       // Hors budget (rare pour revenus)
 *     delays: 0€       // En attente périodes précédentes
 *   }
 * }
 * ```
 *
 * **Cas d'usage :**
 * - Composant QuickPeriodSummary (affichage du résumé en haut de page)
 * - Calcul du reste disponible (income.real - expenses.real)
 * - Détection des dépassements (real > planned)
 * - Suivi des retards (delays) pour transparence budgétaire
 */
interface QuickStats {
  expenses: {
    real: number;
    planned: number;
    pending: number;
    extra: number;
    delays: number; // En attente des périodes précédentes
  };
  income: {
    real: number;
    planned: number;
    pending: number;
    extra: number;
    delays: number; // En attente des périodes précédentes
  };
}

/**
 * Hook de calcul des données d'opérations avec statistiques.
 *
 * @description
 * **Workflow complet :**
 *
 * 1. **Filtrage des comptes courants** :
 *    - Extraction des comptes de type CHECKING (exclu SAVINGS et TRANSFER)
 *    - Récupération des IDs pour filtrage des opérations
 *
 * 2. **Filtrage des opérations associées** :
 *    - `checkingTransactions` : Variables liées aux comptes courants
 *    - `checkingConfigs` : Dépenses récurrentes sur comptes courants
 *    - `checkingIncomes` : Revenus récurrents sur comptes courants
 *
 * 3. **Génération du planner** :
 *    - Appel à `usePlanner` avec les données filtrées + filtres utilisateur
 *    - Retour : `filteredPeriodBudgets` (périodes avec items générés)
 *
 * 4. **Sélection de la portée** :
 *    - Si `scope="MONTH"` → Aplatir toutes les périodes
 *    - Si `scope="PERIOD"` → Sélectionner la période active uniquement
 *
 * 5. **Calcul des statistiques** :
 *    - Pour chaque item : Détection type, remboursement, extra
 *    - Calcul des montants effectifs (basés sur tags si filtrés)
 *    - Accumulation dans `quickStats` (expenses + income)
 *
 * **Gestion des remboursements :**
 * Un revenu est considéré comme remboursement si :
 * - `type === "INCOME"` ET
 * - `category === "Dépenses"` OU `category === "Remboursement"` OU
 * - La catégorie est définie comme EXPENSE dans `categories`
 *
 * Dans ce cas, le montant est SOUSTRAIT des dépenses au lieu d'être ajouté aux revenus.
 *
 * **Montants effectifs avec tags :**
 * Si des filtres `includedTagIds` sont actifs :
 * - Pour chaque item, utiliser uniquement les montants des tags filtrés
 * - Exemple : Opération 100€ avec tag "Alimentation" (60€) et "Loisirs" (40€)
 *   → Si filtre sur "Alimentation" → Montant effectif = 60€
 *
 * **Opérations Extra :**
 * Comptabilisées séparément dans `quickStats.*.extra` pour visibilité du hors budget.
 *
 * @param {Object} params - Paramètres de calcul
 * @param {Account[]} params.accounts - Tous les comptes (pour filtrage CHECKING)
 * @param {ExpenseConfig[]} params.configs - Modèles de dépenses récurrentes
 * @param {IncomeConfig[]} params.incomeConfigs - Modèles de revenus récurrents
 * @param {Record<string, PaidItemDetails>} params.paidItems - Pointages mensuels
 * @param {VariableTransaction[]} params.variableTransactions - Transactions variables
 * @param {Date} params.currentDate - Mois affiché
 * @param {string} params.searchQuery - Requête de recherche textuelle
 * @param {AppSettings} params.settings - Paramètres globaux (enveloppe, périodes)
 * @param {CategoryDef[]} params.categories - Définitions des catégories (pour remboursements)
 * @param {OperationFilters} params.filters - Filtres actifs
 * @param {"MONTH" | "PERIOD"} params.scope - Portée d'affichage
 * @param {number} params.activeWeek - Numéro de la période active (si scope=PERIOD)
 *
 * @returns {Object} Résultats de calcul
 * @returns {PlannedItem[]} unsortedItems - Items bruts (avant tri) pour la portée sélectionnée
 * @returns {QuickStats} quickStats - Statistiques financières de la période
 * @returns {string} monthShort - Mois court formaté (ex: "jan.", "fév.")
 *
 * @example
 * ```tsx
 * const { unsortedItems, quickStats, monthShort } = useOperationsData({
 *   accounts,
 *   configs,
 *   incomeConfigs,
 *   paidItems,
 *   variableTransactions,
 *   currentDate: new Date(2025, 0, 1),
 *   searchQuery: "",
 *   settings,
 *   categories,
 *   filters,
 *   scope: "PERIOD",
 *   activeWeek: 1,
 * });
 *
 * // Afficher les stats
 * <QuickPeriodSummary expenses={quickStats.expenses} income={quickStats.income} />
 *
 * // Utiliser les items (après tri dans composant parent)
 * const sortedItems = sortItems(unsortedItems);
 * <OperationsList items={sortedItems} />
 * ```
 *
 * @optimization
 * Tous les calculs utilisent `useMemo` avec dépendances explicites pour éviter
 * les recalculs lors de rerenders non liés (ex: changement de modal ouverte).
 */
export const useOperationsData = ({
  accounts,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  currentDate,
  searchQuery,
  settings,
  categories,
  filters,
  scope,
  activeWeek,
}: {
  accounts: Account[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  currentDate: Date;
  searchQuery: string;
  settings: AppSettings;
  categories: CategoryDef[];
  filters: OperationFilters;
  scope: "MONTH" | "PERIOD";
  activeWeek: number;
}) => {
  // 1. Filtrage des comptes courants (CHECKING uniquement)
  const checkingAccountIds = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING).map((a) => a.id), [accounts]);

  // 2. Filtrage des opérations sur comptes courants
  const checkingTransactions = useMemo(
    () => variableTransactions.filter((t) => checkingAccountIds.includes(t.accountId)),
    [variableTransactions, checkingAccountIds]
  );

  const checkingConfigs = useMemo(() => configs.filter((c) => checkingAccountIds.includes(c.accountId)), [configs, checkingAccountIds]);

  const checkingIncomes = useMemo(() => incomeConfigs.filter((i) => checkingAccountIds.includes(i.accountId)), [incomeConfigs, checkingAccountIds]);

  // 3. Génération du planner (périodes + items filtrés)
  const { filteredPeriodBudgets } = usePlanner(
    checkingConfigs,
    checkingIncomes,
    paidItems,
    checkingTransactions,
    currentDate,
    searchQuery,
    settings,
    categories,
    filters
  );

  // 4. Sélection de la portée (mois complet ou période spécifique)
  const currentWeekData = filteredPeriodBudgets.find((w) => w.weekNumber === activeWeek);
  const unsortedItems = useMemo(
    () => (scope === "MONTH" ? filteredPeriodBudgets.flatMap((w) => w.items) : currentWeekData?.items || []),
    [scope, filteredPeriodBudgets, currentWeekData]
  );

  // 5. Calcul des statistiques rapides
  const quickStats = useMemo((): QuickStats => {
    /**
     * Calcule le montant effectif d'un item en fonction des filtres actifs.
     *
     * @description
     * Calcul contextuel basé sur plusieurs filtres :
     *
     * **1. Filtre Extra/Standard (`filters.nature`)** :
     * - Si "ONLY" (Extra uniquement) : Calcule uniquement les montants Extra
     *   * Opération avec toggle Extra global : Montant total
     *   * Opération avec tags : Somme des tags marqués `isExtra: true`
     *   * Opération sans tag et sans toggle : 0€
     *
     * - Si "EXCLUDE" (Standard uniquement) : Calcule uniquement les montants Standard
     *   * Opération avec toggle Extra global + tags : Montant total - somme tags Extra
     *   * Opération sans toggle : Montant total - somme tags Extra
     *   * Opération sans tag : Montant total
     *
     * **2. Filtre Tags (`filters.includedTagIds`)** :
     * - Si actif : Filtre également par tags sélectionnés
     * - Combine avec le filtre Extra/Standard pour double filtrage
     *
     * **Exemples :**
     * - Item 115.22€ avec tag 70€ Extra + 45.22€ non taggé
     *   * Filtre Extra → 70€
     *   * Filtre Standard → 45.22€
     *   * Aucun filtre → 115.22€
     *
     * @param {PlannedItem} item - Opération à évaluer
     * @returns {number} Montant effectif en €
     */
    const getEffectiveAmount = (item: PlannedItem): number => {
      const hasTagFilter = filters.includedTagIds && filters.includedTagIds.length > 0;
      const hasExtraFilter = filters.nature === "ONLY" || filters.nature === "EXCLUDE";

      // Cas 1 : Filtre Extra/Standard actif
      if (hasExtraFilter) {
        // Utiliser le toggle global stocké dans isExtraGlobal (source de vérité)
        const hasGlobalExtra = item.isExtraGlobal;

        if (filters.nature === "ONLY") {
          // Extra uniquement : calculer les montants Extra
          if (hasGlobalExtra) {
            // Toggle global : tout est Extra
            if (hasTagFilter && item.tagAmounts) {
              // Double filtre : Extra ET tags spécifiques
              return item.tagAmounts.filter((ta) => filters.includedTagIds.includes(ta.tagId)).reduce((sum, ta) => sum + ta.amount, 0);
            }
            return item.amount; // Tout le montant est Extra
          } else if (item.tagAmounts && item.tagAmounts.length > 0) {
            // Pas de toggle global : calculer somme des tags Extra
            const extraSum = item.tagAmounts
              .filter((ta) => ta.isExtra === true)
              .filter((ta) => !hasTagFilter || filters.includedTagIds.includes(ta.tagId))
              .reduce((sum, ta) => sum + ta.amount, 0);
            return extraSum;
          }
          return 0; // Aucun montant Extra
        } else {
          // Standard uniquement (EXCLUDE Extra) : calculer les montants Standard
          if (hasGlobalExtra) {
            // Toggle global : vérifier s'il reste du Standard via tags
            if (item.tagAmounts && item.tagAmounts.length > 0) {
              const standardSum = item.tagAmounts
                .filter((ta) => !ta.isExtra)
                .filter((ta) => !hasTagFilter || filters.includedTagIds.includes(ta.tagId))
                .reduce((sum, ta) => sum + ta.amount, 0);
              return standardSum;
            }
            return 0; // Toggle global sans tags : 100% Extra, 0 Standard
          } else {
            // Pas de toggle global : montant total - montants Extra
            if (item.tagAmounts && item.tagAmounts.length > 0) {
              const extraSum = item.tagAmounts.filter((ta) => ta.isExtra === true).reduce((sum, ta) => sum + ta.amount, 0);

              if (hasTagFilter) {
                // Double filtre : Standard ET tags spécifiques
                const filteredSum = item.tagAmounts
                  .filter((ta) => filters.includedTagIds.includes(ta.tagId))
                  .filter((ta) => !ta.isExtra)
                  .reduce((sum, ta) => sum + ta.amount, 0);
                return filteredSum;
              }

              return item.amount - extraSum; // Montant Standard (total - Extra)
            }
            // Pas de tags : tout est Standard
            return hasTagFilter ? 0 : item.amount;
          }
        }
      }

      // Cas 2 : Filtre Tags uniquement (pas de filtre Extra)
      if (hasTagFilter) {
        if (!item.tagAmounts || item.tagAmounts.length === 0) {
          return 0; // Item sans ventilation → pas de montant
        }
        // Somme des montants des tags filtrés
        return item.tagAmounts.filter((ta) => filters.includedTagIds.includes(ta.tagId)).reduce((sum, ta) => sum + ta.amount, 0);
      }

      // Cas 3 : Aucun filtre → Montant total
      return item.amount;
    };

    const applyBeneficiaryFilterShare = (item: PlannedItem, effectiveAmount: number): number => {
      if (!filters.beneficiaryIds || filters.beneficiaryIds.length === 0) return effectiveAmount;

      const absoluteTotal = Math.abs(item.amount);
      if (absoluteTotal <= 0) return 0;

      const selectedBeneficiaries = new Set(filters.beneficiaryIds);
      const selectedShare = resolveBeneficiaryAmounts(item)
        .filter((beneficiaryAmount) => selectedBeneficiaries.has(beneficiaryAmount.beneficiaryId))
        .reduce((sum, beneficiaryAmount) => sum + Math.abs(beneficiaryAmount.amount), 0);

      if (selectedShare <= 0) return 0;

      const ratio = Math.min(1, selectedShare / absoluteTotal);
      return effectiveAmount * ratio;
    };

    // Initialisation des accumulateurs
    const stats: QuickStats = {
      expenses: { real: 0, planned: 0, pending: 0, extra: 0, delays: 0 },
      income: { real: 0, planned: 0, pending: 0, extra: 0, delays: 0 },
    };

    // Parcours des items et accumulation
    unsortedItems.forEach((item) => {
      // Exclure les virements internes (mouvements entre comptes)
      if (item.category === "Virement Interne") return;

      /**
       * Détection des remboursements.
       *
       * @description
       * Un revenu est considéré comme remboursement si :
       * - Type = INCOME ET
       * - Catégorie = "Dépenses" OU "Remboursement" OU
       * - Catégorie définie comme EXPENSE dans categories
       *
       * **Traitement :**
       * Les remboursements sont soustraits des dépenses au lieu d'être
       * ajoutés aux revenus (logique métier de réduction de dépenses).
       */
      const isRefund =
        item.type === "INCOME" &&
        (item.category === "Dépenses" || item.category === "Remboursement" || categories.find((c) => c.name === item.category)?.type === "EXPENSE");

      let target;
      let amount = applyBeneficiaryFilterShare(item, getEffectiveAmount(item)); // Montant effectif basé sur filtres + ventilation bénéficiaire

      // Sélection de la cible (dépenses ou revenus)
      if (item.type === "EXPENSE") {
        target = stats.expenses;
      } else if (isRefund) {
        target = stats.expenses;
        amount = -amount; // Inverser le signe pour réduction de dépenses
      } else {
        target = stats.income;
      }

      // Accumulation selon source et statut
      if (item.source === "VARIABLE") {
        // Transactions variables : Real ou Pending uniquement
        if (item.isPaid) target.real += amount;
        else target.pending += amount;
      } else {
        // Opérations récurrentes : Planned + Real/Pending
        const plannedAmount =
          filters.includedTagIds && filters.includedTagIds.length > 0
            ? amount // Utiliser montant effectif filtré pour le prévu
            : item.type === "INCOME" && isRefund
              ? -item.originalAmount
              : item.originalAmount;

        target.planned += plannedAmount;
        if (item.isPaid) target.real += amount;
        else target.pending += amount;
      }

      // Comptabilisation Extra séparée
      if (item.isExtra) {
        target.extra += amount;
      }
    });

    // Calcul des delays (retards) : opérations en attente des périodes précédentes
    // Uniquement en mode PERIOD pour éviter duplication en mode MONTH
    if (scope === "PERIOD" && activeWeek > 1) {
      // Récupérer les opérations des périodes précédentes (1 à activeWeek-1)
      const previousPeriodsItems = filteredPeriodBudgets
        .filter((w) => w.weekNumber < activeWeek)
        .flatMap((w) => w.items)
        .filter((i) => !i.isPaid && i.category !== "Virement Interne"); // Seulement les opérations en attente

      previousPeriodsItems.forEach((item) => {
        const isRefund =
          item.type === "INCOME" &&
          (item.category === "Dépenses" || item.category === "Remboursement" || categories.find((c) => c.name === item.category)?.type === "EXPENSE");

        let target;
        let amount = applyBeneficiaryFilterShare(item, getEffectiveAmount(item));

        // Sélection de la cible (dépenses ou revenus)
        if (item.type === "EXPENSE") {
          target = stats.expenses;
        } else if (isRefund) {
          target = stats.expenses;
          amount = -amount;
        } else {
          target = stats.income;
        }

        // Accumulation dans delays
        target.delays += amount;
      });
    }

    return stats;
  }, [unsortedItems, categories, filters.includedTagIds, filters.nature, filters.beneficiaryIds, scope, activeWeek, filteredPeriodBudgets]);

  // 6. Formatage du mois court (ex: "jan.", "déc.")
  const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(currentDate);

  return {
    unsortedItems,
    quickStats,
    monthShort,
  };
};

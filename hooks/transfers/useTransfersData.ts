/**
 * @file Hook de calculs et transformations de données pour la vue Transferts
 * @description Centralise toute la logique métier : calcul de positions, filtrage,
 * tri, statistiques, et historique des soldes. Applique le principe de séparation
 * des responsabilités en isolant la logique pure des composants UI.
 *
 * @architecture
 * **Principes appliqués :**
 * - **Pure functions** : Tous les calculs sont déterministes
 * - **Memoization** : useMemo pour optimiser les recalculs
 * - **Business logic isolation** : Logique métier séparée de l'UI
 * - **Type safety** : TypeScript strict avec type guards
 *
 * **Responsabilités :**
 * - Calcul des positions de tri manuel (hash-based scoring)
 * - Calcul des soldes effectifs des comptes épargne
 * - Filtrage multi-critères (type, compte, motif, recherche)
 * - Tri dynamique (manuel, date, montant, libellé)
 * - Calculs statistiques (vers épargne, depuis épargne, virements internes)
 * - Historique des soldes évolutifs (compte spécifique)
 *
 * @dependencies
 * - React : useMemo pour optimisation
 * - types : Transfer, VariableTransaction, Account, AccountType
 */
import { useMemo } from "react";
import { Transfer, VariableTransaction, Account, AccountType } from "../../types";

/**
 * Type guard pour différencier Transfer et VariableTransaction.
 *
 * @param {Transfer | VariableTransaction} item - Item à vérifier
 * @returns {boolean} True si l'item est un Transfer
 */
export const isTransfer = (item: Transfer | VariableTransaction): item is Transfer => "sourceAccountId" in item;

/**
 * Type union pour les items combinés (virements + opérations directes).
 * Utilisé pour l'affichage unifié dans la liste.
 */
export type CombinedOperation = {
  id: string;
  date: string;
  label: string;
  amount: number;
  createdAt?: string;
  position?: number;
} & (
  | {
      source: "TRANSFER";
      sourceAccountId: string;
      destinationAccountId: string;
      transferData: Transfer;
    }
  | {
      source: "DIRECT";
      accountId: string;
      type: "EXPENSE" | "INCOME";
      directOpData: VariableTransaction;
    }
);

export type TransfersHistoryEntry = CombinedOperation & { balanceAfter: number };

/**
 * Interface des statistiques calculées.
 */
export interface TransfersStats {
  toSavings: number; // Montant total versé vers l'épargne
  fromSavings: number; // Montant total prélevé depuis l'épargne
  internalChecking: number; // Montant total des virements internes entre comptes courants
}

/**
 * Hook de calculs et transformations de données pour transferts.
 *
 * @description
 * Fournit toutes les données calculées nécessaires à l'affichage de la vue Transferts.
 * Applique les filtres, effectue les tris, calcule les statistiques et gère l'historique.
 *
 * **Workflow de traitement :**
 * 1. Filtrage temporel (mois courant)
 * 2. Filtrage par type de compte (Courant/Épargne)
 * 3. Filtrage par compte spécifique
 * 4. Filtrage par recherche textuelle
 * 5. Filtrage par motif sélectionné
 * 6. Unification des flux (Transfers + VariableTransactions)
 * 7. Tri selon la clé choisie
 * 8. Calcul des statistiques
 * 9. Génération de l'historique des soldes
 *
 * **Optimisation :**
 * Utilise useMemo avec dépendances précises pour éviter les recalculs inutiles.
 *
 * @param {Object} params - Paramètres du hook
 * @param {Transfer[]} params.transfers - Liste des virements
 * @param {VariableTransaction[]} params.variableTransactions - Liste des transactions variables
 * @param {Account[]} params.accounts - Liste des comptes
 * @param {Date} params.currentDate - Mois actuellement affiché
 * @param {string} params.searchQuery - Requête de recherche
 * @param {string | null} params.selectedMotif - Motif sélectionné pour filtrage
 * @param {string} params.accountTypeFilter - Filtre type compte ("ALL" | "CHECKING" | "SAVINGS")
 * @param {string | null} params.specificAccountId - ID du compte spécifique filtré
 * @param {string} params.interestFilter - Filtre des opérations directes ("ALL" | "EXCLUDE" | "ONLY")
 *
 * @returns {Object} Données calculées
 * @returns {Account[]} accountsWithBalances - Comptes avec soldes calculés
 * @returns {CombinedOperation[]} unsortedItems - Items filtrés non triés
 * @returns {string[]} motifs - Liste des libellés uniques (pour filtrage)
 * @returns {any[]} historyWithBalances - Historique avec soldes évolutifs (si compte spécifique)
 * @returns {TransfersStats} stats - Statistiques des mouvements
 * @returns {Function} getEffectivePosition - Fonction de calcul de position manuelle
 *
 * @example
 * ```tsx
 * const {
 *   accountsWithBalances,
 *   currentItems,
 *   motifs,
 *   stats,
 *   getEffectivePosition
 * } = useTransfersData({
 *   transfers,
 *   variableTransactions,
 *   accounts,
 *   currentDate: new Date(),
 *   searchQuery: "",
 *   selectedMotif: null,
 *   accountTypeFilter: "ALL",
 *   specificAccountId: null,
 *   interestFilter: "EXCLUDE"
 * });
 * ```
 */
export const useTransfersData = ({
  transfers,
  variableTransactions,
  accounts,
  currentDate,
  searchQuery,
  selectedMotif,
  accountTypeFilter,
  specificAccountId,
  interestFilter,
}: {
  transfers: Transfer[];
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  currentDate: Date;
  searchQuery: string;
  selectedMotif: string | null;
  accountTypeFilter: "ALL" | "CHECKING" | "SAVINGS";
  specificAccountId: string | null;
  interestFilter: "ALL" | "EXCLUDE" | "ONLY";
}) => {
  /**
   * Calcule la position effective d'un virement pour le tri manuel.
   *
   * @description
   * **Algorithme de scoring :**
   * - Si position manuelle définie : utilise cette valeur
   * - Sinon : BASE_SCORE (100 Milliards) + jour*100M + hash(id)
   *
   * **Pourquoi des grands nombres ?**
   * - Espace large pour insertion drag & drop (50M entre chaque)
   * - Évite les collisions de hash
   * - Permet des insertions avant/après précises
   *
   * @param {Transfer} transfer - Virement à scorer
   * @returns {number} Score de position (entier large)
   */
  // Fonctions de position supprimées (Option A : tri par date/montant uniquement)

  /**
   * Calcul des soldes effectifs des comptes d'épargne.
   *
   * @description
   * Pour chaque compte épargne, calcule le solde réel en sommant tous les virements :
   * - Entrées (destinationAccountId) : +montant
   * - Sorties (sourceAccountId) : -montant
   *
   * Les comptes courants conservent leur solde de base.
   */
  const accountsWithBalances = useMemo(() => {
    return accounts.map((acc) => {
      if (acc.type === AccountType.SAVINGS) {
        const balance = transfers.reduce((sum, t) => {
          if (t.destinationAccountId === acc.id) return sum + t.amount;
          if (t.sourceAccountId === acc.id) return sum - t.amount;
          return sum;
        }, 0);
        return { ...acc, currentBalance: balance };
      }
      return acc;
    });
  }, [accounts, transfers]);

  /**
   * Filtrage, tri et enrichissement des données.
   *
   * @description
   * **Pipeline de traitement :**
   * 1. Filtrage temporel (mois courant)
   * 2. Inclusion opérations directes (si activée)
   * 3. Filtre type de compte (Courant/Épargne)
   * 4. Filtre compte spécifique
   * 5. Filtre recherche textuelle
   * 6. Filtre motif sélectionné
   * 7. Unification des flux en CombinedOperation[]
   * 8. Préparation des items (tri appliqué dans un hook dédié)
   * 9. Extraction des motifs uniques
   * 10. Calcul de l'historique des soldes (si compte spécifique)
   *
   * @returns {Object} Données calculées
   * - unsortedItems : Items filtrés
   * - motifs : Libellés uniques pour filtrage
   * - historyWithBalances : Historique avec soldes évolutifs
   */
  const { unsortedItems, motifs, historyWithBalances } = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const foundMotifs = new Set<string>();

    // 1. Filtrage temporel des virements
    let filteredTransfers = transfers.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 2. Filtrage temporel des opérations directes selon interestFilter
    let filteredDirectOps: VariableTransaction[] = [];
    if (interestFilter !== "EXCLUDE") {
      filteredDirectOps = variableTransactions.filter((tx) => {
        const d = new Date(tx.date);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;

        // IMPORTANT : Ne garder QUE les opérations sur comptes d'épargne
        const txAccount = accounts.find((a) => a.id === tx.accountId);
        return txAccount?.type === AccountType.SAVINGS;
      });
    }

    // 3. Filtre par type de compte
    if (accountTypeFilter !== "ALL") {
      const filterType = accountTypeFilter === "CHECKING" ? AccountType.CHECKING : AccountType.SAVINGS;

      filteredTransfers = filteredTransfers.filter((t) => {
        const source = accounts.find((a) => a.id === t.sourceAccountId);
        const dest = accounts.find((a) => a.id === t.destinationAccountId);
        return source?.type === filterType || dest?.type === filterType;
      });

      filteredDirectOps = filteredDirectOps.filter((tx) => {
        const acc = accounts.find((a) => a.id === tx.accountId);
        return acc?.type === filterType;
      });
    }

    // 4. Filtre par compte spécifique
    if (specificAccountId) {
      filteredTransfers = filteredTransfers.filter((t) => t.sourceAccountId === specificAccountId || t.destinationAccountId === specificAccountId);
      filteredDirectOps = filteredDirectOps.filter((tx) => tx.accountId === specificAccountId);
    }

    // 5. Filtre par recherche textuelle
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredTransfers = filteredTransfers.filter((t) => t.label.toLowerCase().includes(q) || t.amount.toString().includes(q));
      filteredDirectOps = filteredDirectOps.filter((tx) => tx.label.toLowerCase().includes(q) || tx.amount.toString().includes(q));
    }

    // 6. Filtre par motif sélectionné
    if (selectedMotif) {
      filteredTransfers = filteredTransfers.filter((t) => t.label === selectedMotif);
      filteredDirectOps = filteredDirectOps.filter((tx) => tx.label === selectedMotif);
    }

    // 7. Unification des flux en CombinedOperation[]
    const combinedOps: CombinedOperation[] = [
      ...filteredTransfers.map(
        (t): CombinedOperation => ({
          id: t.id,
          date: t.date,
          label: t.label,
          amount: t.amount,
          source: "TRANSFER" as const,
          sourceAccountId: t.sourceAccountId,
          destinationAccountId: t.destinationAccountId,
          createdAt: t.createdAt,
          transferData: t,
        })
      ),
      ...filteredDirectOps.map(
        (tx): CombinedOperation => ({
          id: tx.id,
          date: tx.date,
          label: tx.label,
          amount: tx.type === "INCOME" ? tx.amount : -tx.amount,
          source: "DIRECT" as const,
          accountId: tx.accountId,
          type: tx.type,
          createdAt: tx.id,
          directOpData: tx,
        })
      ),
    ];

    // 7b. Si interestFilter === "ONLY", ne garder que les opérations directes
    const finalOps = interestFilter === "ONLY" ? combinedOps.filter((op) => op.source === "DIRECT") : combinedOps;

    // 9. Extraction des motifs uniques
    [...filteredTransfers, ...filteredDirectOps].forEach((item) => {
      foundMotifs.add(item.label);
    });

    // 10. Calcul du solde évolutif (si compte spécifique sélectionné)
    let history: TransfersHistoryEntry[] = [];
    if (specificAccountId) {
      const chronological = [...combinedOps].sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });

      let runningBalance = 0;
      history = chronological.map((item): TransfersHistoryEntry => {
        let deltaForAccount = 0;

        if ("transferData" in item) {
          const isCredit = item.destinationAccountId === specificAccountId;
          deltaForAccount = isCredit ? item.amount : -item.amount;
        } else {
          // Direct op: amount déjà signé
          deltaForAccount = item.amount;
        }

        runningBalance += deltaForAccount;
        return { ...item, balanceAfter: runningBalance };
      });
    }

    return {
      unsortedItems: finalOps,
      motifs: Array.from(foundMotifs).sort(),
      historyWithBalances: history,
    };
  }, [transfers, variableTransactions, currentDate, searchQuery, selectedMotif, accountTypeFilter, specificAccountId, interestFilter, accounts]);

  /**
   * Calcul des statistiques de mouvements.
   *
   * @description
   * Analyse les virements pour calculer :
   * - **toSavings** : Montant versé depuis Courant vers Épargne
   * - **fromSavings** : Montant prélevé depuis Épargne vers Courant
   * - **internalChecking** : Montant entre comptes Courants
   *
   * **Logique de détection :**
   * - Si dest = Épargne ET source ≠ Épargne → toSavings
   * - Si source = Épargne ET dest ≠ Épargne → fromSavings
   * - Si source ≠ Épargne ET dest ≠ Épargne → internalChecking
   */
  const stats = useMemo((): TransfersStats => {
    let toSavings = 0;
    let fromSavings = 0;
    let internalChecking = 0;

    unsortedItems
      .filter((item): item is Extract<CombinedOperation, { source: "TRANSFER" }> => item.source === "TRANSFER")
      .forEach((item) => {
        const source = accounts.find((a) => a.id === item.sourceAccountId);
        const dest = accounts.find((a) => a.id === item.destinationAccountId);

        const isSourceSavings = source?.type === AccountType.SAVINGS;
        const isDestSavings = dest?.type === AccountType.SAVINGS;

        if (isDestSavings && !isSourceSavings) {
          toSavings += item.amount;
        } else if (isSourceSavings && !isDestSavings) {
          fromSavings += item.amount;
        } else if (!isSourceSavings && !isDestSavings) {
          internalChecking += item.amount;
        }
      });

    return { toSavings, fromSavings, internalChecking };
  }, [unsortedItems, accounts]);

  return {
    accountsWithBalances,
    unsortedItems,
    motifs,
    historyWithBalances,
    stats,
  };
};

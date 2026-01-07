/**
 * @file Hook de gestion du tri des opérations avec persistance
 * @description Centralise la logique de tri des opérations (manuel, date, libellé, montant)
 * avec persistance des préférences dans localStorage. Gère le calcul de positions effectives
 * pour le tri manuel (drag & drop) avec un système de scores robuste.
 *
 * @architecture
 * **Responsabilités :**
 * - Gestion des états de tri (clé + ordre)
 * - Persistance automatique dans localStorage
 * - Calcul de positions effectives pour tri manuel (compatible usePlanner)
 * - Application de la logique de tri selon la clé sélectionnée
 *
 * **Système de tri manuel :**
 * Utilise un système de scores BigInt (100 Milliards de base) pour permettre des insertions
 * avant/après sans limite ni collisions. Le calcul est STRICTEMENT IDENTIQUE à usePlanner
 * pour garantir la cohérence.
 *
 * **Persistance :**
 * Les préférences de tri (clé + ordre) sont sauvegardées dans localStorage pour restaurer
 * l'expérience utilisateur lors du retour sur la vue.
 *
 * @dependencies
 * - types.ts : PlannedItem
 */
import { useState, useEffect, useMemo } from "react";
import { PlannedItem } from "../../types";

/**
 * Ordre de tri possible.
 */
export type SortOrder = "asc" | "desc";

/**
 * Clés de tri disponibles pour les opérations.
 */
export type SortKey = "manual" | "date" | "amount" | "label";

/**
 * Options affichées dans le sélecteur de tri.
 */
export interface SortOption {
  key: SortKey;
  label: string;
}

/**
 * Calcule une position effective pour le tri Manuel.
 *
 * @description
 * **ATTENTION : Cette fonction DOIT être strictement identique à getItemSortScore dans usePlanner.**
 *
 * **Algorithme :**
 * 1. Si `item.position` est défini et non nul → Utiliser la position manuelle enregistrée
 * 2. Sinon, calculer un score par défaut basé sur :
 *    - BASE_SCORE : 100 Milliards (évite les collisions)
 *    - DAY_STEP : 100 Millions par jour (espace pour insertions)
 *    - Hash stable de l'instanceId (ordre intra-jour déterministe)
 *
 * **Formule :**
 * ```
 * score = 100_000_000_000 + (jour * 100_000_000) + hash(instanceId)
 * ```
 *
 * **Pourquoi des grands nombres ?**
 * - Espace de 100M entre chaque jour → 50M insertions possibles avant/après chaque item
 * - Hash < 100M → Jamais de débordement dans un jour
 * - BASE_SCORE de 100 Milliards → Pas de scores négatifs
 *
 * **Synchronisation avec usePlanner :**
 * Les scores calculés ici doivent correspondre exactement à ceux de usePlanner pour que
 * le tri manuel soit cohérent entre la génération initiale et l'affichage dans OperationsView.
 *
 * @param {PlannedItem} item - Opération à scorer
 * @returns {number} Score de position (entier large, compatible BigInt conceptuel)
 *
 * @example
 * ```tsx
 * const item1 = { day: 5, position: undefined, instanceId: "exp_123-2025-01" };
 * const score1 = getEffectivePosition(item1);
 * // score1 ≈ 100_500_000_000 + hash("exp_123-2025-01")
 *
 * const item2 = { day: 5, position: 100_550_000_000, instanceId: "exp_456-2025-01" };
 * const score2 = getEffectivePosition(item2);
 * // score2 = 100_550_000_000 (position manuelle prioritaire)
 * ```
 */
const getEffectivePosition = (item: PlannedItem): number => {
  // Priorité à la position manuelle si définie
  if (typeof item.position === "number" && item.position !== 0) {
    return item.position;
  }

  // Score par défaut basé sur le jour + hash stable
  const BASE_SCORE = 100_000_000_000; // 100 Milliards
  const DAY_STEP = 100_000_000; // 100 Millions par jour

  // Génération d'un hash entier déterministe entre 0 et 99,999,999
  let hash = 0;
  for (let i = 0; i < item.instanceId.length; i++) {
    hash = (hash << 5) - hash + item.instanceId.charCodeAt(i);
    hash |= 0; // Conversion en entier 32 bits
  }
  const safeHash = Math.abs(hash) % DAY_STEP;

  return BASE_SCORE + item.day * DAY_STEP + safeHash;
};

/**
 * Hook de gestion du tri des opérations avec persistance localStorage.
 *
 * @description
 * Gère l'état du tri (clé + ordre) avec sauvegarde automatique des préférences
 * et application de la logique de tri selon la clé sélectionnée.
 *
 * **Clés de tri disponibles :**
 * - **"manual"** : Ordre manuel (drag & drop) basé sur `item.position` ou score calculé
 * - **"date"** : Tri par jour du mois (1-31)
 * - **"amount"** : Tri par montant (€)
 * - **"label"** : Tri alphabétique par libellé
 *
 * **Ordres disponibles :**
 * - **"asc"** : Croissant (défaut pour tous les tris)
 * - **"desc"** : Décroissant
 *
 * **Persistance automatique :**
 * Les préférences sont sauvegardées dans localStorage :
 * - `operationsView_sortKey` : Clé de tri active
 * - `operationsView_sortOrder` : Ordre de tri actif
 *
 * **Restauration :**
 * Au chargement du composant, les préférences sont automatiquement restaurées
 * depuis localStorage. Par défaut : `sortKey="manual"`, `sortOrder="asc"`.
 *
 * **Fonction de tri :**
 * `sortItems(items)` applique la logique de tri selon la clé active et retourne
 * un nouveau tableau trié. Utilise `useMemo` pour optimiser les performances.
 *
 * **Comportement spécial du tri manuel :**
 * - Utilise `getEffectivePosition()` pour calculer les scores
 * - Fallback sur `instanceId` en cas d'égalité (stabilité du tri)
 * - Ordre toujours "asc" en mode manuel (le score encode déjà l'ordre visuel)
 *
 * @returns {Object} Interface de gestion du tri
 * @returns {SortKey} sortKey - Clé de tri active (reactive)
 * @returns {SortOrder} sortOrder - Ordre de tri actif (reactive)
 * @returns {function(SortKey, SortOrder): void} setSorting - Modifier le tri (+ sauvegarde auto)
 * @returns {function(PlannedItem[]): PlannedItem[]} sortItems - Fonction de tri (memoized)
 * @returns {boolean} isManualSort - True si tri manuel actif (pour activer drag & drop)
 * @returns {SortOption[]} sortOptions - Options pour le sélecteur de tri
 *
 * @example
 * ```tsx
 * const { sortKey, sortOrder, setSorting, sortItems, isManualSort, sortOptions } = useOperationsSorting();
 *
 * // Afficher le sélecteur de tri
 * <ListSorter
 *   options={sortOptions}
 *   currentSort={sortKey}
 *   currentOrder={sortOrder}
 *   onSortChange={setSorting}
 * />
 *
 * // Appliquer le tri aux items
 * const sortedItems = sortItems(unsortedItems);
 *
 * // Activer le drag & drop conditionnellement
 * <OperationsList
 *   items={sortedItems}
 *   onReorder={isManualSort ? handleReorder : undefined}
 * />
 * ```
 *
 * @workflow
 * 1. **Initialisation** : Restauration depuis localStorage ou défauts
 * 2. **Changement de tri** : setSorting(key, order) → État React + localStorage
 * 3. **Tri des items** : sortItems(items) → Nouveau tableau trié (useMemo)
 * 4. **Drag & drop** : isManualSort ? activer : désactiver
 */
export const useOperationsSorting = () => {
  // État du tri avec restauration depuis localStorage
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    return (localStorage.getItem("operationsView_sortKey") as SortKey) || "manual";
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (localStorage.getItem("operationsView_sortOrder") as SortOrder) || "desc";
  });

  // Persistance automatique
  useEffect(() => {
    localStorage.setItem("operationsView_sortKey", sortKey);
  }, [sortKey]);

  useEffect(() => {
    localStorage.setItem("operationsView_sortOrder", sortOrder);
  }, [sortOrder]);

  /**
   * Modifie les paramètres de tri (clé + ordre).
   *
   * @description
   * Mise à jour synchrone des deux états de tri.
   *
   * @param {SortKey} key - Nouvelle clé de tri
   * @param {SortOrder} order - Nouvel ordre de tri
   *
   * @example
   * ```tsx
   * // Tri par date croissant
   * setSorting("date", "asc");
   *
   * // Tri par montant décroissant
   * setSorting("amount", "desc");
   *
   * // Tri manuel inversé
   * setSorting("manual", "desc");
   * ```
   */
  const setSorting = (key: SortKey, order: SortOrder) => {
    setSortKey(key);
    setSortOrder(order);
  };

  /**
   * Fonction de tri memoized appliquant la logique selon la clé active.
   *
   * @description
   * Trie un tableau de PlannedItem selon la clé et l'ordre actuels.
   * Utilise `useMemo` pour éviter les recalculs inutiles (dépendances : sortKey, sortOrder).
   *
   * **Algorithmes de tri :**
   * - **manual** : Compare getEffectivePosition() → Fallback sur instanceId
   * - **date** : Compare item.day (jour du mois)
   * - **amount** : Compare item.amount (montant en €)
   * - **label** : Compare item.label (alphabétique, insensible à la casse)
   *
   * **Stabilité du tri :**
   * - En mode manuel : Fallback sur instanceId garantit un ordre déterministe
   * - Autres modes : Tri JavaScript natif (stable depuis ES2019)
   *
   * @callback
   * @param {PlannedItem[]} items - Tableau d'opérations à trier
   * @returns {PlannedItem[]} Nouveau tableau trié (shallow copy)
   */
  const sortItems = useMemo(() => {
    return (items: PlannedItem[]): PlannedItem[] => {
      return [...items].sort((a, b) => {
        let res = 0;

        if (sortKey === "manual") {
          const posA = getEffectivePosition(a);
          const posB = getEffectivePosition(b);

          if (posA !== posB) {
            res = posA - posB;
          } else {
            // Fallback ultime stable sur l'ID
            res = a.instanceId.localeCompare(b.instanceId);
          }
        } else if (sortKey === "date") {
          res = a.day - b.day;
        } else if (sortKey === "amount") {
          res = a.amount - b.amount;
        } else if (sortKey === "label") {
          res = a.label.localeCompare(b.label);
        }

        // Application de l'ordre (asc/desc)
        return sortOrder === "asc" ? res : -res;
      });
    };
  }, [sortKey, sortOrder]);

  /**
   * Indicateur de tri manuel actif (pour activer le drag & drop).
   */
  const isManualSort = sortKey === "manual";

  /**
   * Options du sélecteur de tri (pour ListSorter).
   */
  const sortOptions: SortOption[] = [
    { key: "manual", label: "Manuel" },
    { key: "date", label: "Date" },
    { key: "label", label: "Libellé" },
    { key: "amount", label: "Montant" },
  ];

  return {
    sortKey,
    sortOrder,
    setSorting,
    sortItems,
    isManualSort,
    sortOptions,
    // Export de getEffectivePosition pour handleReorder (drag & drop)
    getEffectivePosition,
  };
};

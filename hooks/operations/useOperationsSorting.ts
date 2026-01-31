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
 * Extrait la position manuelle d'un item.
 *
 * @description
 * **SYSTÈME SIMPLIFIÉ ET ROBUSTE :**
 * - Retourne la position manuelle si elle existe ET est > 0
 * - Retourne null sinon (pas de position ou position = 0)
 *
 * **Pourquoi 0 = null ?**
 * - Position 0 dans la DB signifie "pas encore de position manuelle"
 * - Évite les collisions avec les vrais items positionnés
 *
 * **Important :**
 * Les items sans position sont triés par date + instanceId dans sortItems(),
 * pas ici. Cette fonction ne fait QUE extraire la position manuelle.
 *
 * @param {PlannedItem} item - Opération à analyser
 * @returns {number | null} Position manuelle ou null
 *
 * @example
 * ```tsx
 * const item1 = { position: 5000 };
 * getEffectivePosition(item1); // 5000
 *
 * const item2 = { position: 0 };
 * getEffectivePosition(item2); // null
 *
 * const item3 = { position: undefined };
 * getEffectivePosition(item3); // null
 * ```
 */
const getEffectivePosition = (item: PlannedItem): number | null => {
  // Position manuelle valide : > 0
  if (typeof item.position === "number" && item.position > 0) {
    return item.position;
  }

  // Pas de position manuelle
  return null;
};

/**
 * Hook de gestion du tri des opérations avec persistance localStorage.
 *
 * @description
 * Gère l'état du tri (clé + ordre) avec sauvegarde automatique des préférences
 * et application de la logique de tri selon la clé sélectionnée.
 *
 * **Clés de tri disponibles :**
 * - **"manual"** : Ordre manuel (drag & drop) basé sur `item.position` ou score calculé.
 *   TOUJOURS en ordre décroissant (du plus récent au plus vieux par défaut).
 * - **"date"** : Tri par jour du mois (1-31)
 * - **"amount"** : Tri par montant (€)
 * - **"label"** : Tri alphabétique par libellé
 *
 * **Ordres disponibles :**
 * - **"asc"** : Croissant (défaut pour date, montant, libellé)
 * - **"desc"** : Décroissant (forcé pour tri manuel)
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
 * - Ordre TOUJOURS "desc" (décroissant) pour afficher du plus récent au plus vieux
 * - Le changement d'ordre est désactivé en mode manuel (canToggleOrder = false)
 *
 * @returns {Object} Interface de gestion du tri
 * @returns {SortKey} sortKey - Clé de tri active (reactive)
 * @returns {SortOrder} sortOrder - Ordre de tri actif (reactive)
 * @returns {function(SortKey, SortOrder): void} setSorting - Modifier le tri (+ sauvegarde auto)
 * @returns {function(PlannedItem[]): PlannedItem[]} sortItems - Fonction de tri (memoized)
 * @returns {boolean} isManualSort - True si tri manuel actif (pour activer drag & drop)
 * @returns {boolean} canToggleOrder - True si on peut changer l'ordre (false en mode manuel)
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
   * **IMPORTANT :** Si key === "manual", l'ordre est FORCÉ à "desc" (décroissant)
   * pour garantir un affichage du plus récent au plus vieux par défaut.
   *
   * @param {SortKey} key - Nouvelle clé de tri
   * @param {SortOrder} order - Nouvel ordre de tri (ignoré si key === "manual")
   *
   * @example
   * ```tsx
   * // Tri par date croissant
   * setSorting("date", "asc");
   *
   * // Tri par montant décroissant
   * setSorting("amount", "desc");
   *
   * // Tri manuel (ordre forcé à "desc")
   * setSorting("manual", "asc"); // → Sera converti en "desc"
   * ```
   */
  const setSorting = (key: SortKey, order: SortOrder) => {
    setSortKey(key);
    // Forcer l'ordre à "desc" en mode manuel
    setSortOrder(key === "manual" ? "desc" : order);
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

          // RÈGLE 1 : Items avec position manuelle d'abord, dans l'ordre de leur position
          if (posA !== null && posB !== null) {
            // Les deux ont une position : comparer les positions
            res = posA - posB;
          } else if (posA !== null && posB === null) {
            // A a une position, B non : A avant B
            res = -1;
          } else if (posA === null && posB !== null) {
            // B a une position, A non : B avant A
            res = 1;
          } else {
            // RÈGLE 2 : Aucun des deux n'a de position → Tri par date puis instanceId
            // Extraire la date de payment_date si disponible (items variables)
            const dateA =
              a.paidDetails?.paymentDate ||
              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(a.day).padStart(2, "0")}`;
            const dateB =
              b.paidDetails?.paymentDate ||
              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;

            // Comparer les dates (format YYYY-MM-DD)
            if (dateA !== dateB) {
              res = dateA.localeCompare(dateB);
            } else {
              // Même date : fallback sur instanceId pour stabilité
              res = a.instanceId.localeCompare(b.instanceId);
            }
          }

          // Tri manuel TOUJOURS en ordre décroissant (plus récent en haut)
          return -res;
        } else if (sortKey === "date") {
          res = a.day - b.day;
        } else if (sortKey === "amount") {
          res = a.amount - b.amount;
        } else if (sortKey === "label") {
          res = a.label.localeCompare(b.label);
        }

        // Application de l'ordre (asc/desc) pour les autres tris
        return sortOrder === "asc" ? res : -res;
      });
    };
  }, [sortKey, sortOrder]);

  /**
   * Indicateur de tri manuel actif (pour activer le drag & drop).
   */
  const isManualSort = sortKey === "manual";

  /**
   * Indicateur si on peut basculer l'ordre de tri.
   * False en mode manuel car l'ordre est fixe (toujours décroissant).
   */
  const canToggleOrder = sortKey !== "manual";

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
    canToggleOrder,
    sortOptions,
    // Export de getEffectivePosition pour handleReorder (drag & drop)
    getEffectivePosition,
  };
};

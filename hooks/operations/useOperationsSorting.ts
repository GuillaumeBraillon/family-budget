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
import { useState, useEffect, useMemo, useCallback } from "react";
import { PlannedItem } from "../../types";
import { logger } from "../../services/logger";

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
const getEffectivePosition = (item: PlannedItem): number => {
  // Position manuelle valide : > 0
  if (typeof item.position === "number" && item.position > 0) {
    return item.position;
  }

  // Pas de position manuelle
  return null;
};

/**
 * Corrige les collisions de positions manuelles pour éviter les réorganisations aléatoires.
 *
 * @description
 * **PROBLÈME RÉSOLU :**
 * Plusieurs opérations peuvent avoir la même position (ex: 98019, 97023), ce qui
 * fait que le tri tombe sur le fallback (jour + instanceId) et cause des déplacements
 * imprévisibles lors du drag & drop.
 *
 * **SOLUTION ROBUSTE :**
 * Détecter les vraies collisions et réassigner des positions séquentielles uniques.
 *
 * **ALGORITHME :**
 * 1. Vérifier s'il y a des collisions (plusieurs items avec même position)
 * 2. Si oui, collecter tous les items avec positions manuelles
 * 3. Les trier par position actuelle (pour préserver l'ordre relatif)
 * 4. Réassigner des positions séquentielles : 1000, 2000, 3000, etc.
 * 5. Si pas de collision, laisser inchangé
 *
 * **GARANTIES :**
 * - Toutes les positions deviennent uniques (pas de collision)
 * - L'ordre relatif est préservé (tri par position actuelle)
 * - Espace laissé pour insertions futures (drag & drop)
 * - Performance : O(n log n) pour le tri, seulement si collisions détectées
 *
 * @param {PlannedItem[]} items - Tableau d'opérations à corriger
 * @returns {Object} Objet avec correctedItems et flag hasCorrections
 *
 * @example
 * ```tsx
 * const items = [
 *   { instanceId: '1', position: 1000 },
 *   { instanceId: '2', position: 1000 }, // Collision !
 *   { instanceId: '3', position: 1000 }, // Collision !
 *   { instanceId: '4', position: 2000 },
 *   { instanceId: '5', position: 2000 }, // Collision !
 * ];
 *
 * const { correctedItems, hasCorrections } = fixPositionCollisions(items);
 * // Résultat garanti :
 * // correctedItems = [{ instanceId: '1', position: 1000 },
 * //                   { instanceId: '2', position: 2000 },
 * //                   { instanceId: '3', position: 3000 },
 * //                   { instanceId: '4', position: 4000 },
 * //                   { instanceId: '5', position: 5000 }]
 * // hasCorrections = true
 * ```
 */
const fixPositionCollisions = (items: PlannedItem[]): { correctedItems: PlannedItem[]; hasCorrections: boolean } => {
  const POSITION_STEP = 1000;

  // Étape 1 : Détecter s'il y a des collisions
  const positionCounts: Record<number, number> = {};
  items.forEach((item) => {
    const pos = getEffectivePosition(item);
    if (pos !== null && pos > 0) {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    }
  });

  const hasCollisions = Object.values(positionCounts).some((count) => count > 1);

  // Si pas de collisions, retourner tel quel
  if (!hasCollisions) {
    return { correctedItems: items, hasCorrections: false };
  }

  // Étape 2 : Collecter tous les items avec positions manuelles
  const itemsWithPositions = items.filter((item) => {
    const pos = getEffectivePosition(item);
    return pos !== null && pos > 0;
  });

  // Étape 3 : Trier par position actuelle pour préserver l'ordre relatif
  itemsWithPositions.sort((a, b) => {
    const posA = getEffectivePosition(a);
    const posB = getEffectivePosition(b);
    if (posA === null || posB === null) return 0;
    return posA - posB;
  });

  // Étape 4 : Réassigner des positions séquentielles uniques
  const fixedItems = items.map((item) => {
    const pos = getEffectivePosition(item);
    if (pos === null || pos <= 0) {
      // Pas de position manuelle : laisser inchangé
      return item;
    }

    // Trouver l'index dans le tableau trié
    const sortedIndex = itemsWithPositions.findIndex((i) => i.instanceId === item.instanceId);
    if (sortedIndex === -1) {
      // Ne devrait pas arriver, mais sécurité
      return item;
    }

    // Nouvelle position séquentielle
    const newPosition = (sortedIndex + 1) * POSITION_STEP;

    return {
      ...item,
      position: newPosition,
    };
  });

  return { correctedItems: fixedItems, hasCorrections: true };
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
 * **Correction des collisions de positions :**
 * En mode manuel, les positions identiques sont automatiquement corrigées.
 * Si un callback `onPositionCorrection` est fourni, il sera appelé avec les items corrigés
 * pour permettre la persistance des corrections en base de données.
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
 * @param {Object} [options] - Options du hook
 * @param {function(PlannedItem[]): void} [options.onPositionCorrection] - Callback appelé quand des corrections de positions sont appliquées
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
 * const { sortKey, sortOrder, setSorting, sortItems, isManualSort, sortOptions } = useOperationsSorting({
 *   onPositionCorrection: (correctedItems) => {
 *     // Persister les corrections en base de données
 *     correctedItems.forEach(item => {
 *       if (item.position !== originalPosition) {
 *         updatePositionInDB(item.instanceId, item.position);
 *       }
 *     });
 *   }
 * });
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
 * 4. **Correction des collisions** : Si callback fourni, persister les corrections
 * 5. **Drag & drop** : isManualSort ? activer : désactiver
 */
export const useOperationsSorting = (options?: { onPositionCorrection?: (correctedItems: PlannedItem[], originalItems: PlannedItem[]) => void }) => {
  const { onPositionCorrection } = options || {};
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
  }, [sortOrder, sortKey]);

  /**
   * Modifie les paramètres de tri (clé + ordre).
   *
   * @description
   * Mise à jour synchrone des deux états de tri.
   * **IMPORTANT :** Si key === "manual", l'ordre est IGNORÉ et forcé à "desc" (décroissant)
   * pour garantir un affichage du plus récent au plus vieux par défaut.
   *
   * @param {SortKey} key - Nouvelle clé de tri
   * @param {SortOrder} [order] - Nouvel ordre de tri (ignoré si key === "manual")
   *
   * @example
   * ```tsx
   * // Tri par date croissant
   * setSorting("date", "asc");
   *
   * // Tri par montant décroissant
   * setSorting("amount", "desc");
   *
   * // Tri manuel (ordre ignoré, forcé à "desc")
   * setSorting("manual", "asc"); // → L'ordre "asc" est ignoré, sera "desc"
   * ```
   */
  const setSorting = (key: SortKey, order?: SortOrder) => {
    setSortKey(key);

    // En mode manuel : IGNORER l'ordre passé, forcer "desc"
    // En autres modes : utiliser l'ordre fourni ou garder l'ordre actuel
    if (key === "manual") {
      setSortOrder("desc");
    } else if (order) {
      setSortOrder(order);
    }
  };

  /**
   * Fonction de tri memoized appliquant la logique selon la clé active.
   *
   * @description
   * Trie un tableau de PlannedItem selon la clé et l'ordre actuels.
   * Utilise `useMemo` pour éviter les recalculs inutiles (dépendances : sortKey, sortOrder).
   *
   * **Algorithmes de tri :**
   * - **manual** : Corrige les collisions de positions PUIS compare getEffectivePosition() → Fallback sur instanceId
   * - **date** : Compare item.day (jour du mois)
   * - **amount** : Compare item.amount (montant en €)
   * - **label** : Compare item.label (alphabétique, insensible à la casse)
   *
   * **Correction des collisions (tri manuel uniquement) :**
   * Avant le tri, `fixPositionCollisions()` détecte et corrige automatiquement
   * les positions identiques pour éviter les réorganisations imprévisibles.
   *
   * **Stabilité du tri :**
   * - En mode manuel : Fallback sur instanceId garantit un ordre déterministe
   * - Autres modes : Tri JavaScript natif (stable depuis ES2019)
   *
   * @callback
   * @param {PlannedItem[]} items - Tableau d'opérations à trier
   * @returns {PlannedItem[]} Nouveau tableau trié (shallow copy)
   */
  const sortItems = useCallback(
    (items: PlannedItem[]): PlannedItem[] => {
      if (!items) return []; // Gérer le cas où les items sont temporairement undefined
      let sorted = [...items];

      if (sortKey === "manual") {
        const collisionResult = fixPositionCollisions(items);

        // Protection renforcée pour éviter le crash pendant les re-rendus rapides
        if (!collisionResult || !collisionResult.correctedItems) {
          logger.error("useOperationsSorting", "fixPositionCollisions did not return correctedItems", { items });
          return []; // Retourner un tableau vide pour empêcher le crash
        }

        const { correctedItems, hasCorrections } = collisionResult;

        if (hasCorrections && onPositionCorrection) {
          logger.debug("useOperationsSorting", "Collisions de position détectées, correction...", {
            count: correctedItems.filter((c, i) => items[i] && c.position !== items[i].position).length,
          });
          onPositionCorrection(correctedItems, items);
        }

        soreturn []; // Retourner un tableau vide pour empêcher le crash
        }

        const { correctedItems, hasCorrections } = collisionResult;

        if (hasCorrections && onPositionCorrection) {tch (sortKey) {
            case "label":
              valA = a.label;
              valB = b.label;
              break;
            case "amount":
              valA = a.amount;
              valB = b.amount;
              break;
            case "category":
              valA = a.category;
              valB = b.category;
              break;
            default:
              return 0;
          }

          if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          if (typeof valA === "number" && typeof valB === "number") {
            return sortOrder === "asc" ? valA - valB : valB - valA;
          }
          return 0;
        });
      }
      return sorted;
    },
    [sortKey, sortOrder, onPositionCorrection]
  );

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

  // Log final du hook pour déboguer les changements
  useEffect(() => {
    logger.debug("useOperationsSorting - ÉTAT FINAL", {
      sortKey,
     Retour du hook avec toutes les valeurs et actionstKey,
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

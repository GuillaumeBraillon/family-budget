/**
 * @file Hook de gestion du tri des opérations avec persistance
 * @description Centralise la logique de tri des opérations (manuel, date, libellé, montant)
 * avec persistance des préférences dans localStorage.
 *
 * @architecture
 * **Responsabilités :**
 * - Gestion des états de tri (clé + ordre)
 * - Persistance automatique dans localStorage
 * - Application de la logique de tri selon la clé sélectionnée
 * - Support du tri manuel via un array d'ordre défini (operations_sorting)
 *
 * **Système de tri manuel :**
 * Utilise un array d'IDs (operations_sorting) provenant des settings pour déterminer l'ordre.
 * C'est un système déterministe et stable qui remplace l'ancien système de positions numériques.
 *
 * @dependencies
 * - types.ts : PlannedItem
 */
import { useState, useEffect, useCallback, useMemo } from "react";
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
 * Hook de gestion du tri des opérations avec persistance localStorage.
 *
 * @param {string[]} operationsSorting - Array d'IDs définissant l'ordre manuel (provenant de app_settings)
 */
export const useOperationsSorting = (operationsSorting: string[] = []) => {
  // État du tri avec restauration depuis localStorage
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    return (localStorage.getItem("operationsView_sortKey") as SortKey) || "manual";
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (localStorage.getItem("operationsView_sortOrder") as SortOrder) || "desc";
  });

  // Persistance automatique des préférences UI
  useEffect(() => {
    localStorage.setItem("operationsView_sortKey", sortKey);
  }, [sortKey]);

  useEffect(() => {
    localStorage.setItem("operationsView_sortOrder", sortOrder);
  }, [sortOrder, sortKey]);

  /**
   * Modifie les paramètres de tri (clé + ordre).
   */
  const setSorting = (key: SortKey, order?: SortOrder) => {
    setSortKey(key);
    if (key === "manual") {
      setSortOrder("desc");
    } else if (order) {
      setSortOrder(order);
    }
  };

  /**
   * Map pour accès O(1) aux index de tri manuel
   */
  const sortingMap = useMemo(() => {
    const map = new Map<string, number>();
    operationsSorting.forEach((id, index) => {
      map.set(id, index);
    });
    return map;
  }, [operationsSorting]);

  /**
   * Fonction de tri memoized appliquant la logique selon la clé active.
   */
  const sortItems = useCallback(
    (items: PlannedItem[]): PlannedItem[] => {
      if (!items) return [];
      const sorted = [...items];

      if (sortKey === "manual") {
        sorted.sort((a, b) => {
          const indexA = sortingMap.has(a.instanceId) ? sortingMap.get(a.instanceId)! : Infinity;
          const indexB = sortingMap.has(b.instanceId) ? sortingMap.get(b.instanceId)! : Infinity;

          if (indexA === Infinity && indexB === Infinity) {
            if (a.day !== b.day) return b.day - a.day;
            return a.instanceId.localeCompare(b.instanceId);
          }

          return indexA - indexB;
        });
      } else {
        sorted.sort((a, b) => {
          let valA: any;
          let valB: any;

          switch (sortKey) {
            case "label":
              valA = a.label;
              valB = b.label;
              break;
            case "amount":
              valA = a.amount;
              valB = b.amount;
              break;
            default: // date
              valA = a.day;
              valB = b.day;
              break;
          }

          if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === "asc" ? valA - valB : valB - valA;
        });
      }
      return sorted;
    },
    [sortKey, sortOrder, sortingMap]
  );

  return {
    sortKey,
    sortOrder,
    setSorting,
    sortItems,
    isManualSort: sortKey === "manual",
    canToggleOrder: sortKey !== "manual",
    sortOptions: [
      { key: "manual", label: "Manuel" },
      { key: "date", label: "Date" },
      { key: "label", label: "Libellé" },
      { key: "amount", label: "Montant" },
    ],
  };
};

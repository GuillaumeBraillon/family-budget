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
import { PlannedItem } from "../../types";
import { useManualSorting, SortOrder } from "../sorting/useManualSorting";

export type { SortOrder };

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
  const { sortKey, sortOrder, setSorting, sortItems, isManualSort, canToggleOrder } = useManualSorting<PlannedItem, SortKey>({
    storageSortKey: "operationsView_sortKey",
    storageSortOrder: "operationsView_sortOrder",
    defaultSortKey: "manual",
    defaultSortOrder: "desc",
    manualSortOrder: "desc",
    manualOrderIds: operationsSorting,
    getItemId: (item) => item.instanceId,
    fallbackManualCompare: (a, b) => {
      if (a.day !== b.day) return b.day - a.day;
      return a.instanceId.localeCompare(b.instanceId);
    },
    autoCompare: (a, b, key) => {
      switch (key) {
        case "label":
          return a.label.localeCompare(b.label);
        case "amount":
          return a.amount - b.amount;
        default:
          return a.day - b.day;
      }
    },
  });

  return {
    sortKey,
    sortOrder,
    setSorting,
    sortItems,
    isManualSort,
    canToggleOrder,
    sortOptions: [
      { key: "manual", label: "Manuel" },
      { key: "date", label: "Date" },
      { key: "label", label: "Libellé" },
      { key: "amount", label: "Montant" },
    ],
  };
};

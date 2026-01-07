/**
 * @file Barrel export pour les hooks d'opérations
 * @description Point d'entrée centralisé pour les hooks de gestion de la vue Opérations.
 */

// Filtres d'opérations
export { useOperationsFilters } from "./useOperationsFilters";

// Tri des opérations
export { useOperationsSorting } from "./useOperationsSorting";
export type { SortOrder, SortKey, SortOption } from "./useOperationsSorting";

// Calculs de données
export { useOperationsData } from "./useOperationsData";

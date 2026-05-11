/**
 * @file Source de vérité unique pour les calculs financiers
 *
 * @description
 * Toutes les vues (Balances, Dashboard, Operations) utilisent ces fonctions.
 * Aucun calcul financier ne doit être dupliqué ailleurs.
 *
 * **Règles standard :**
 * - Un item peut avoir une ventilation multi-bénéficiaires (beneficiaryAmounts).
 *   Si absente, le champ beneficiaryId porte le montant total.
 * - Extra : toggle global (`isExtraGlobal` / `isExtra`) = toute l'opération hors budget.
 * - Virements internes (`category === "Virement Interne"`) et intérêts d'épargne
 *   (`subCategory === "Intérêts"`) sont exclus des calculs budgétaires.
 */

import { BeneficiaryAmount, OperationFilters, Person } from "../types";

// ---------------------------------------------------------------------------
// Types internes (sous-ensembles de PlannedItem et PaidItemDetails)
// ---------------------------------------------------------------------------

/** Toute structure portant une ventilation de bénéficiaires */
export interface HasBeneficiaryAmounts {
  beneficiaryId?: string; // Optionnel : fallback pour PlannedItem (depuis config), absent de PaidItemDetails
  beneficiaryAmounts?: BeneficiaryAmount[];
  amount: number;
}

/** Toute structure portant une ventilation Extra/Standard */
export interface HasExtraInfo {
  /** Toggle global : toute l'opération est Extra */
  isExtraGlobal?: boolean;
  /** Valeur DB directe pour PaidItemDetails (équivaut à isExtraGlobal) */
  isExtra?: boolean;
  amount: number;
}

// ---------------------------------------------------------------------------
// Bénéficiaires
// ---------------------------------------------------------------------------

/**
 * Retourne le tableau de ventilation bénéficiaires.
 * Fallback sur [{ beneficiaryId, amount: total }] si pas de ventilation.
 */
export const resolveBeneficiaryAmounts = (item: HasBeneficiaryAmounts): BeneficiaryAmount[] => {
  if (item.beneficiaryAmounts && item.beneficiaryAmounts.length > 0) {
    return item.beneficiaryAmounts;
  }
  if (!item.beneficiaryId || item.amount === 0) return [];
  return [{ beneficiaryId: item.beneficiaryId, amount: item.amount }];
};

/**
 * Retourne le montant attribué à un bénéficiaire spécifique sur un item.
 * 0 si le bénéficiaire n'est pas impliqué.
 */
export const getBeneficiaryShare = (item: HasBeneficiaryAmounts, beneficiaryId: string): number => {
  const amounts = resolveBeneficiaryAmounts(item);
  return amounts.filter((ba) => ba.beneficiaryId === beneficiaryId).reduce((sum, ba) => sum + ba.amount, 0);
};

/**
 * Retourne les bénéficiaires du groupe "Famille".
 *
 * Règle métier:
 * - Inclure la personne nommée "Famille" (si présente)
 * - Inclure tous les enfants (`isChild === true`)
 * - Fallback: premier adulte par displayOrder, sinon première personne
 */
export const getFamilyBeneficiaryIds = (people: Person[]): string[] => {
  const namedFamily = people.filter((person) => person.name.trim().toLowerCase() === "famille").map((person) => person.id);
  const children = people.filter((person) => person.isChild).map((person) => person.id);

  const explicitFamilyGroup = Array.from(new Set([...namedFamily, ...children]));
  if (explicitFamilyGroup.length > 0) return explicitFamilyGroup;

  const sortedByOrder = [...people].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
  const firstNonChild = sortedByOrder.find((person) => !person.isChild);
  if (firstNonChild) return [firstNonChild.id];
  return sortedByOrder[0] ? [sortedByOrder[0].id] : [];
};

// ---------------------------------------------------------------------------
// Extra / Standard
// ---------------------------------------------------------------------------

/**
 * Retourne le montant Extra d'un item.
 *
 * Règle :
 * - Toggle global activé (isExtraGlobal || isExtra) → tout le montant est Extra
 * - Sinon → 0 (tout est Standard)
 */
export const getExtraAmount = (item: HasExtraInfo): number => {
  const totalAmount = Number(item.amount) || 0;

  const isGlobal = !!(item.isExtraGlobal ?? item.isExtra);
  if (isGlobal) return totalAmount;

  return 0;
};

/**
 * Retourne le montant Standard d'un item (total - Extra).
 */
export const getStandardAmount = (item: HasExtraInfo): number => {
  return item.amount - getExtraAmount(item);
};

// ---------------------------------------------------------------------------
// Combinaisons bénéficiaire × Standard/Extra
// ---------------------------------------------------------------------------

/**
 * Retourne le montant Standard attribué à un bénéficiaire sur un item.
 *
 * Calcul : share_ratio × standardTotal
 * où share_ratio = part du bénéficiaire / montant total de l'item.
 */
export const getBeneficiaryStandardShare = (item: HasBeneficiaryAmounts & HasExtraInfo, beneficiaryId: string): number => {
  const absoluteTotal = Math.abs(item.amount);
  if (absoluteTotal <= 0) return 0;

  const share = getBeneficiaryShare(item, beneficiaryId);
  const absoluteShare = Math.abs(share);
  if (absoluteShare <= 0) return 0;

  const standardTotal = getStandardAmount(item);
  return standardTotal * (absoluteShare / absoluteTotal);
};

/**
 * Retourne le montant Extra attribué à un bénéficiaire sur un item.
 */
export const getBeneficiaryExtraShare = (item: HasBeneficiaryAmounts & HasExtraInfo, beneficiaryId: string): number => {
  const absoluteTotal = Math.abs(item.amount);
  if (absoluteTotal <= 0) return 0;

  const share = getBeneficiaryShare(item, beneficiaryId);
  const absoluteShare = Math.abs(share);
  if (absoluteShare <= 0) return 0;

  const extraTotal = getExtraAmount(item);
  return extraTotal * (absoluteShare / absoluteTotal);
};

// ---------------------------------------------------------------------------
// Filtres budgétaires
// ---------------------------------------------------------------------------

/**
 * Retourne true si l'item doit être exclu des calculs budgétaires.
 * (virement interne ou intérêts d'épargne)
 */
export const isBudgetExcluded = (item: { category: string; subCategory?: string }): boolean => {
  return item.category === "Virement Interne" || item.subCategory === "Intérêts";
};

// ---------------------------------------------------------------------------
// Navigation vers les opérations
// ---------------------------------------------------------------------------

/**
 * Construit un objet OperationFilters complet avec des valeurs par défaut
 * sûres, surchargées par les overrides fournis.
 * Utilisé partout où l'on veut naviguer vers la vue Opérations avec des filtres pré-remplis.
 */
export const buildOperationsFilters = (overrides: Partial<OperationFilters>): Partial<OperationFilters> => ({
  flux: "ALL",
  source: "ALL",
  status: "ALL",
  nature: "ALL",
  salary: "EXCLUDE",
  accountIds: [],
  isAccountFilterActive: false,
  beneficiaryIds: [],
  isBeneficiaryFilterActive: false,
  includedCategoryIds: [],
  isCategoryFilterActive: false,
  includedSubCategoryIds: [],
  isSubCategoryFilterActive: false,
  ...overrides,
});

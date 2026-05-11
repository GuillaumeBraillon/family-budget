/**
 * @file Tests unitaires pour financeUtils.ts
 * @description Couverture complète de la source de vérité des calculs financiers.
 * Ces fonctions sont utilisées par toutes les vues (Balances, Dashboard, Operations).
 */
import { describe, it, expect } from "vitest";
import type { Person } from "../types";
import {
  resolveBeneficiaryAmounts,
  getBeneficiaryShare,
  getExtraAmount,
  getStandardAmount,
  getBeneficiaryStandardShare,
  getBeneficiaryExtraShare,
  isBudgetExcluded,
  getFamilyBeneficiaryIds,
  buildOperationsFilters,
  type HasBeneficiaryAmounts,
  type HasExtraInfo,
} from "../services/financeUtils";

// ---------------------------------------------------------------------------
// Helpers de factory
// ---------------------------------------------------------------------------

// Ne pas inclure isExtraGlobal/isExtra dans le base : getExtraAmount utilise
// `isExtraGlobal ?? isExtra`, et `??` ne court-circuite pas sur `false`.
// Laisser les deux à undefined garantit que les overrides fonctionnent correctement.
const makeItem = (amount: number, overrides: Partial<HasBeneficiaryAmounts & HasExtraInfo> = {}): HasBeneficiaryAmounts & HasExtraInfo => ({
  amount,
  ...overrides,
});

const makePerson = (id: string, name: string, isChild = false, displayOrder = 0): Person => ({
  id,
  name,
  isChild,
  displayOrder,
});

// ---------------------------------------------------------------------------
// resolveBeneficiaryAmounts
// ---------------------------------------------------------------------------

describe("resolveBeneficiaryAmounts", () => {
  it("retourne beneficiaryAmounts explicites s'ils existent", () => {
    const item = makeItem(100, {
      beneficiaryAmounts: [
        { beneficiaryId: "b1", amount: 60 },
        { beneficiaryId: "b2", amount: 40 },
      ],
    });
    const result = resolveBeneficiaryAmounts(item);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ beneficiaryId: "b1", amount: 60 });
  });

  it("fallback sur beneficiaryId + amount total quand pas de beneficiaryAmounts", () => {
    const item = makeItem(150, { beneficiaryId: "b1" });
    const result = resolveBeneficiaryAmounts(item);
    expect(result).toEqual([{ beneficiaryId: "b1", amount: 150 }]);
  });

  it("retourne [] si beneficiaryId absent et pas de beneficiaryAmounts", () => {
    const item = makeItem(100);
    const result = resolveBeneficiaryAmounts(item);
    expect(result).toEqual([]);
  });

  it("retourne [] si amount === 0 sans beneficiaryAmounts", () => {
    const item = makeItem(0, { beneficiaryId: "b1" });
    const result = resolveBeneficiaryAmounts(item);
    expect(result).toEqual([]);
  });

  it("ignore un tableau beneficiaryAmounts vide et fait le fallback", () => {
    const item = makeItem(100, { beneficiaryId: "b1", beneficiaryAmounts: [] });
    const result = resolveBeneficiaryAmounts(item);
    expect(result).toEqual([{ beneficiaryId: "b1", amount: 100 }]);
  });
});

// ---------------------------------------------------------------------------
// getBeneficiaryShare
// ---------------------------------------------------------------------------

describe("getBeneficiaryShare", () => {
  it("retourne la part d'un bénéficiaire dans une ventilation multi", () => {
    const item = makeItem(200, {
      beneficiaryAmounts: [
        { beneficiaryId: "b1", amount: 120 },
        { beneficiaryId: "b2", amount: 80 },
      ],
    });
    expect(getBeneficiaryShare(item, "b1")).toBe(120);
    expect(getBeneficiaryShare(item, "b2")).toBe(80);
  });

  it("retourne 0 si le bénéficiaire n'est pas dans l'item", () => {
    const item = makeItem(100, { beneficiaryId: "b1" });
    expect(getBeneficiaryShare(item, "b-inconnu")).toBe(0);
  });

  it("somme plusieurs entrées pour le même bénéficiaire", () => {
    const item = makeItem(150, {
      beneficiaryAmounts: [
        { beneficiaryId: "b1", amount: 50 },
        { beneficiaryId: "b1", amount: 30 },
      ],
    });
    expect(getBeneficiaryShare(item, "b1")).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// getExtraAmount
// ---------------------------------------------------------------------------

describe("getExtraAmount", () => {
  it("retourne le montant total si toggle global isExtraGlobal", () => {
    const item = makeItem(200, { isExtraGlobal: true });
    expect(getExtraAmount(item)).toBe(200);
  });

  it("retourne le montant total si isExtra (flag DB)", () => {
    // isExtra est le flag DB équivalent à isExtraGlobal — ne pas passer isExtraGlobal pour ne pas court-circuiter
    const item: HasBeneficiaryAmounts & HasExtraInfo = { amount: 150, isExtra: true };
    expect(getExtraAmount(item)).toBe(150);
  });

  it("retourne la somme des tags Extra si toggle désactivé", () => {
    const item = makeItem(200, {
      tagAmounts: [
        { tagId: "t1", amount: 80, isExtra: true },
        { tagId: "t2", amount: 120, isExtra: false },
      ],
    });
    expect(getExtraAmount(item)).toBe(80);
  });

  it("retourne 0 si aucun tag Extra et toggle désactivé", () => {
    const item = makeItem(100, {
      tagAmounts: [{ tagId: "t1", amount: 100, isExtra: false }],
    });
    expect(getExtraAmount(item)).toBe(0);
  });

  it("retourne 0 si aucun tag et toggle désactivé", () => {
    const item = makeItem(100);
    expect(getExtraAmount(item)).toBe(0);
  });

  it("toggle global a priorité sur les tags", () => {
    const item = makeItem(100, {
      isExtraGlobal: true,
      tagAmounts: [{ tagId: "t1", amount: 30, isExtra: true }],
    });
    // Toggle global → tout le montant, pas seulement les tags
    expect(getExtraAmount(item)).toBe(100);
  });

  it("gère les montants négatifs (item INCOME)", () => {
    const item = makeItem(-200, { isExtraGlobal: true });
    expect(getExtraAmount(item)).toBe(-200);
  });

  it("gère les montants négatifs avec tags Extra", () => {
    const item = makeItem(-200, {
      tagAmounts: [{ tagId: "t1", amount: 80, isExtra: true }],
    });
    // Signe négatif × 80 = -80
    expect(getExtraAmount(item)).toBe(-80);
  });
});

// ---------------------------------------------------------------------------
// getStandardAmount
// ---------------------------------------------------------------------------

describe("getStandardAmount", () => {
  it("retourne 0 si tout est Extra (toggle global)", () => {
    const item = makeItem(200, { isExtraGlobal: true });
    expect(getStandardAmount(item)).toBe(0);
  });

  it("retourne le montant total si rien n'est Extra", () => {
    const item = makeItem(100);
    expect(getStandardAmount(item)).toBe(100);
  });

  it("retourne total - extraTags si ventilation partielle", () => {
    const item = makeItem(200, {
      tagAmounts: [
        { tagId: "t1", amount: 60, isExtra: true },
        { tagId: "t2", amount: 140, isExtra: false },
      ],
    });
    expect(getStandardAmount(item)).toBe(140);
  });
});

// ---------------------------------------------------------------------------
// getBeneficiaryStandardShare
// ---------------------------------------------------------------------------

describe("getBeneficiaryStandardShare", () => {
  it("calcule la part standard au prorata du bénéficiaire", () => {
    // b1 = 60/200 du total; 80€ standard → 24€
    const item = makeItem(200, {
      beneficiaryAmounts: [
        { beneficiaryId: "b1", amount: 60 },
        { beneficiaryId: "b2", amount: 140 },
      ],
      tagAmounts: [
        { tagId: "t1", amount: 80, isExtra: true },
        { tagId: "t2", amount: 120, isExtra: false },
      ],
    });
    // standardTotal = 200 - 80 = 120
    // ratio b1 = 60/200 = 0.3 → 120 * 0.3 = 36
    expect(getBeneficiaryStandardShare(item, "b1")).toBeCloseTo(36, 5);
  });

  it("retourne 0 si le bénéficiaire n'est pas dans l'item", () => {
    const item = makeItem(100, { beneficiaryId: "b1" });
    expect(getBeneficiaryStandardShare(item, "b-inconnu")).toBe(0);
  });

  it("retourne 0 si tout est Extra", () => {
    const item = makeItem(100, {
      beneficiaryId: "b1",
      isExtraGlobal: true,
    });
    expect(getBeneficiaryStandardShare(item, "b1")).toBe(0);
  });

  it("retourne le montant complet si tout est Standard et bénéficiaire unique", () => {
    const item = makeItem(100, { beneficiaryId: "b1" });
    expect(getBeneficiaryStandardShare(item, "b1")).toBe(100);
  });

  it("retourne 0 si montant total = 0", () => {
    const item = makeItem(0, { beneficiaryId: "b1" });
    expect(getBeneficiaryStandardShare(item, "b1")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getBeneficiaryExtraShare
// ---------------------------------------------------------------------------

describe("getBeneficiaryExtraShare", () => {
  it("calcule la part Extra au prorata", () => {
    const item = makeItem(200, {
      beneficiaryAmounts: [
        { beneficiaryId: "b1", amount: 100 },
        { beneficiaryId: "b2", amount: 100 },
      ],
      tagAmounts: [{ tagId: "t1", amount: 80, isExtra: true }],
    });
    // extraTotal = 80, ratio b1 = 0.5 → 40
    expect(getBeneficiaryExtraShare(item, "b1")).toBeCloseTo(40, 5);
  });

  it("retourne 0 si rien n'est Extra", () => {
    const item = makeItem(100, { beneficiaryId: "b1" });
    expect(getBeneficiaryExtraShare(item, "b1")).toBe(0);
  });

  it("retourne tout si toggle global + bénéficiaire unique", () => {
    const item = makeItem(100, {
      beneficiaryId: "b1",
      isExtraGlobal: true,
    });
    expect(getBeneficiaryExtraShare(item, "b1")).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// isBudgetExcluded
// ---------------------------------------------------------------------------

describe("isBudgetExcluded", () => {
  it('exclut les virements internes (category === "Virement Interne")', () => {
    expect(isBudgetExcluded({ category: "Virement Interne" })).toBe(true);
  });

  it('exclut les intérêts d\'épargne (subCategory === "Intérêts")', () => {
    expect(isBudgetExcluded({ category: "Épargne", subCategory: "Intérêts" })).toBe(true);
  });

  it("n'exclut pas une opération standard", () => {
    expect(isBudgetExcluded({ category: "Alimentation" })).toBe(false);
  });

  it("n'exclut pas si subCategory est undefined", () => {
    expect(isBudgetExcluded({ category: "Loisirs", subCategory: undefined })).toBe(false);
  });

  it("est sensible à la casse (Virement Interne avec majuscules)", () => {
    expect(isBudgetExcluded({ category: "virement interne" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getFamilyBeneficiaryIds
// ---------------------------------------------------------------------------

describe("getFamilyBeneficiaryIds", () => {
  it('retourne l\'ID de la personne nommée "Famille"', () => {
    const people = [makePerson("p1", "Guillaume", false, 1), makePerson("p-fam", "Famille", false, 2)];
    expect(getFamilyBeneficiaryIds(people)).toEqual(["p-fam"]);
  });

  it("inclut les enfants dans le groupe Famille", () => {
    const people = [makePerson("p1", "Guillaume", false, 1), makePerson("c1", "Alice", true, 3), makePerson("c2", "Bob", true, 4)];
    const result = getFamilyBeneficiaryIds(people);
    expect(result).toContain("c1");
    expect(result).toContain("c2");
    expect(result).not.toContain("p1");
  });

  it('combine "Famille" nommée + enfants sans doublon', () => {
    const people = [makePerson("p-fam", "Famille", false, 1), makePerson("c1", "Alice", true, 2)];
    const result = getFamilyBeneficiaryIds(people);
    expect(result).toContain("p-fam");
    expect(result).toContain("c1");
    expect(new Set(result).size).toBe(result.length); // Pas de doublon
  });

  it("fallback sur le premier adulte par displayOrder si aucun groupe Famille", () => {
    const people = [makePerson("p2", "Camille", false, 2), makePerson("p1", "Guillaume", false, 1)];
    const result = getFamilyBeneficiaryIds(people);
    expect(result).toEqual(["p1"]); // displayOrder 1 en premier
  });

  it("fallback sur la première personne si tableau vide de non-enfants", () => {
    const people = [makePerson("p1", "Solo", false, 5)];
    expect(getFamilyBeneficiaryIds(people)).toEqual(["p1"]);
  });

  it("retourne [] pour un tableau vide", () => {
    expect(getFamilyBeneficiaryIds([])).toEqual([]);
  });

  it('ne compte pas un enfant nommé "Famille" en doublon', () => {
    const people = [
      makePerson("c-fam", "Famille", true, 1), // Enfant + nommé Famille
    ];
    const result = getFamilyBeneficiaryIds(people);
    expect(result).toEqual(["c-fam"]); // Apparaît une seule fois
  });
});

// ---------------------------------------------------------------------------
// buildOperationsFilters
// ---------------------------------------------------------------------------

describe("buildOperationsFilters", () => {
  it("retourne les valeurs par défaut quand aucun override", () => {
    const result = buildOperationsFilters({});
    expect(result).toEqual({
      flux: "ALL",
      source: "ALL",
      status: "ALL",
      nature: "ALL",
      salary: "EXCLUDE",
      accountIds: [],
      isAccountFilterActive: false,
      beneficiaryIds: [],
      isBeneficiaryFilterActive: false,
      includedTagIds: [],
      excludedTagIds: [],
      tagPresence: "ALL",
      includedCategoryIds: [],
      isCategoryFilterActive: false,
      includedSubCategoryIds: [],
      isSubCategoryFilterActive: false,
    });
  });

  it("surcharge correctement les valeurs par défaut", () => {
    const result = buildOperationsFilters({
      status: "REAL",
      nature: "EXCLUDE",
      accountIds: ["acc-1"],
      beneficiaryIds: ["b1"],
    });
    expect(result.status).toBe("REAL");
    expect(result.nature).toBe("EXCLUDE");
    expect(result.accountIds).toEqual(["acc-1"]);
    expect(result.beneficiaryIds).toEqual(["b1"]);
    // Valeurs non overridées restent à leur défaut
    expect(result.flux).toBe("ALL");
    expect(result.salary).toBe("EXCLUDE");
  });

  it("ne mute pas les tableaux par défaut", () => {
    const r1 = buildOperationsFilters({ accountIds: ["acc-1"] });
    const r2 = buildOperationsFilters({ accountIds: ["acc-2"] });
    expect(r1.accountIds).toEqual(["acc-1"]);
    expect(r2.accountIds).toEqual(["acc-2"]);
  });
});

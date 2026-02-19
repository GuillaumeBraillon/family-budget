/**
 * @file Tests unitaires pour la validation des TagAmounts
 * @description Tests de la logique de validation de la ventilation des tags
 * Règles métier : La somme des montants des tags ne doit jamais dépasser le montant total
 */
import { describe, it, expect } from "vitest";
import type { TagAmount } from "../types";

/**
 * Helper de validation extrait de la logique métier
 * @param tagAmounts - Liste des ventilations par tag
 * @param totalAmount - Montant total de l'opération
 * @returns { valid: boolean, error?: string }
 */
function validateTagAmounts(tagAmounts: TagAmount[], totalAmount: number): { valid: boolean; error?: string } {
  if (tagAmounts.length === 0) {
    return { valid: true };
  }

  const sumTagAmounts = tagAmounts.reduce((sum, ta) => sum + ta.amount, 0);

  // Tolérance de 0.01€ pour erreurs d'arrondi
  if (sumTagAmounts > totalAmount + 0.01) {
    return {
      valid: false,
      error: `La somme des montants affectés aux tags (${sumTagAmounts.toFixed(2)}€) dépasse le montant total (${totalAmount.toFixed(2)}€)`,
    };
  }

  return { valid: true };
}

/**
 * Helper pour calculer le montant total des tags Extra
 * @param tagAmounts - Liste des ventilations par tag
 * @returns Somme des montants Extra
 */
function calculateExtraSum(tagAmounts: TagAmount[]): number {
  return tagAmounts.filter((ta) => ta.isExtra === true).reduce((sum, ta) => sum + ta.amount, 0);
}

/**
 * Helper pour calculer le montant total des tags Standard
 * @param tagAmounts - Liste des ventilations par tag
 * @returns Somme des montants Standard
 */
function calculateStandardSum(tagAmounts: TagAmount[]): number {
  return tagAmounts.filter((ta) => !ta.isExtra).reduce((sum, ta) => sum + ta.amount, 0);
}

describe("Validation des TagAmounts", () => {
  describe("validateTagAmounts", () => {
    it("accepte une liste vide de tags", () => {
      const result = validateTagAmounts([], 100);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepte une ventilation partielle valide", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 30, isExtra: false },
        { tagId: "tag-2", amount: 20, isExtra: false },
      ];

      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(true);
      // Reste 50€ non ventilé → OK (ventilation partielle autorisée)
    });

    it("accepte une ventilation complète valide", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 60, isExtra: false },
        { tagId: "tag-2", amount: 40, isExtra: false },
      ];

      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(true);
      // Somme = 100€ → Ventilation complète OK
    });

    it("rejette une ventilation qui dépasse le total", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 60, isExtra: false },
        { tagId: "tag-2", amount: 50, isExtra: false },
      ];

      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("110.00");
      expect(result.error).toContain("100.00");
      expect(result.error).toContain("dépasse");
    });

    it("tolère les erreurs d'arrondi (≤ 0.01€)", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 33.34, isExtra: false },
        { tagId: "tag-2", amount: 33.33, isExtra: false },
        { tagId: "tag-3", amount: 33.34, isExtra: false },
      ];

      // Somme = 100.01€, total = 100€ → Tolérance OK
      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(true);
    });

    it("rejette un dépassement > 0.01€", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 50.5, isExtra: false },
        { tagId: "tag-2", amount: 50.5, isExtra: false },
      ];

      // Somme = 101€, total = 100€ → Rejeté (> 0.01€)
      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(false);
    });

    it("valide correctement avec des tags Extra", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 30, isExtra: false },
        { tagId: "tag-2", amount: 20, isExtra: true }, // Extra
      ];

      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(true);
      // isExtra n'affecte pas la validation du total
    });

    it("gère les montants décimaux complexes", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 45.67, isExtra: false },
        { tagId: "tag-2", amount: 23.89, isExtra: false },
        { tagId: "tag-3", amount: 10.5, isExtra: true },
      ];

      // Somme = 80.06€, total = 120€ → OK (ventilation partielle)
      const result = validateTagAmounts(tagAmounts, 120);
      expect(result.valid).toBe(true);
    });

    it("rejette si la somme dépasse avec décimaux", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 45.67, isExtra: false },
        { tagId: "tag-2", amount: 55.89, isExtra: false },
      ];

      // Somme = 101.56€, total = 100€ → Rejeté
      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("101.56");
    });
  });

  describe("calculateExtraSum", () => {
    it("retourne 0 pour une liste vide", () => {
      expect(calculateExtraSum([])).toBe(0);
    });

    it("retourne 0 si aucun tag Extra", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 50, isExtra: false },
        { tagId: "tag-2", amount: 30, isExtra: false },
      ];

      expect(calculateExtraSum(tagAmounts)).toBe(0);
    });

    it("calcule la somme des tags Extra uniquement", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 50, isExtra: false },
        { tagId: "tag-2", amount: 30, isExtra: true },
        { tagId: "tag-3", amount: 20, isExtra: true },
      ];

      expect(calculateExtraSum(tagAmounts)).toBe(50); // 30 + 20
    });

    it("gère les montants décimaux", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 25.5, isExtra: true },
        { tagId: "tag-2", amount: 15.75, isExtra: true },
        { tagId: "tag-3", amount: 10, isExtra: false },
      ];

      expect(calculateExtraSum(tagAmounts)).toBe(41.25); // 25.5 + 15.75
    });

    it("retourne tout le montant si tous les tags sont Extra", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 40, isExtra: true },
        { tagId: "tag-2", amount: 60, isExtra: true },
      ];

      expect(calculateExtraSum(tagAmounts)).toBe(100);
    });
  });

  describe("calculateStandardSum", () => {
    it("retourne 0 pour une liste vide", () => {
      expect(calculateStandardSum([])).toBe(0);
    });

    it("retourne 0 si tous les tags sont Extra", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 50, isExtra: true },
        { tagId: "tag-2", amount: 30, isExtra: true },
      ];

      expect(calculateStandardSum(tagAmounts)).toBe(0);
    });

    it("calcule la somme des tags Standard uniquement", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 50, isExtra: false },
        { tagId: "tag-2", amount: 30, isExtra: true },
        { tagId: "tag-3", amount: 20, isExtra: false },
      ];

      expect(calculateStandardSum(tagAmounts)).toBe(70); // 50 + 20
    });

    it("gère isExtra undefined comme false (Standard)", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 40 } as TagAmount, // isExtra undefined
        { tagId: "tag-2", amount: 30, isExtra: false },
      ];

      expect(calculateStandardSum(tagAmounts)).toBe(70); // 40 + 30
    });

    it("retourne tout le montant si tous les tags sont Standard", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 40, isExtra: false },
        { tagId: "tag-2", amount: 60, isExtra: false },
      ];

      expect(calculateStandardSum(tagAmounts)).toBe(100);
    });
  });

  describe("Scénarios métier complexes", () => {
    it("valide un scénario réel : Courses avec ventilation mixte", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-alimentation", amount: 45.5, isExtra: false },
        { tagId: "tag-hygiene", amount: 12.3, isExtra: false },
        { tagId: "tag-extras", amount: 8.2, isExtra: true },
      ];

      const totalAmount = 70; // Reste 4€ non ventilé

      const result = validateTagAmounts(tagAmounts, totalAmount);
      expect(result.valid).toBe(true);

      const extraSum = calculateExtraSum(tagAmounts);
      const standardSum = calculateStandardSum(tagAmounts);

      expect(extraSum).toBe(8.2);
      expect(standardSum).toBe(57.8); // 45.5 + 12.3
      expect(extraSum + standardSum).toBe(66);
    });

    it("valide un remboursement complet", () => {
      const tagAmounts: TagAmount[] = [{ tagId: "tag-remboursement", amount: 50, isExtra: false }];

      const result = validateTagAmounts(tagAmounts, 50);
      expect(result.valid).toBe(true);
    });

    it("rejette une ventilation incohérente", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 100, isExtra: false },
        { tagId: "tag-2", amount: 50, isExtra: true },
      ];

      // Erreur : 150€ ventilés pour 100€ total
      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(false);
    });

    it("gère le cas limite : ventilation complète Extra", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-cadeau", amount: 50, isExtra: true },
        { tagId: "tag-restaurant", amount: 80, isExtra: true },
      ];

      const result = validateTagAmounts(tagAmounts, 130);
      expect(result.valid).toBe(true);

      expect(calculateExtraSum(tagAmounts)).toBe(130);
      expect(calculateStandardSum(tagAmounts)).toBe(0);
    });

    it("détecte un dépassement subtil avec plusieurs tags", () => {
      const tagAmounts: TagAmount[] = [
        { tagId: "tag-1", amount: 25.01, isExtra: false },
        { tagId: "tag-2", amount: 25.01, isExtra: false },
        { tagId: "tag-3", amount: 25.01, isExtra: false },
        { tagId: "tag-4", amount: 25.01, isExtra: false },
      ];

      // Somme = 100.04€, total = 100€ → Rejeté (> 0.01€)
      const result = validateTagAmounts(tagAmounts, 100);
      expect(result.valid).toBe(false);
    });
  });
});

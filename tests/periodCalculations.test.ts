/**
 * @file Tests unitaires pour les calculs de périodes budgétaires
 * @description Tests de la logique de découpage du mois et de distribution du budget
 */
import { describe, it, expect } from "vitest";

/**
 * Calcule le budget distribué pour une période donnée
 * @param monthlyBudget - Budget mensuel total
 * @param daysInMonth - Nombre de jours dans le mois
 * @param periodDays - Nombre de jours dans la période
 * @returns Budget distribué pour la période
 */
function calculateDistributedBudget(monthlyBudget: number, daysInMonth: number, periodDays: number): number {
  return (monthlyBudget / daysInMonth) * periodDays;
}

/**
 * Génère les périodes pour le mode FIXED_DAYS
 * @param daysInMonth - Nombre de jours dans le mois
 * @param periodValue - Nombre de jours par période
 * @returns Liste des périodes avec start/end/days
 */
function generateFixedDaysPeriods(daysInMonth: number, periodValue: number): Array<{ start: number; end: number; days: number }> {
  const periods: Array<{ start: number; end: number; days: number }> = [];

  for (let start = 1; start <= daysInMonth; start += periodValue) {
    const isLast = start + periodValue - 1 >= daysInMonth;
    const end = isLast ? daysInMonth : start + periodValue - 1;
    const days = end - start + 1;
    periods.push({ start, end, days });
    if (isLast) break;
  }

  return periods;
}

/**
 * Génère les périodes pour le mode CUSTOM_SPLIT
 * @param daysInMonth - Nombre de jours dans le mois
 * @param parts - Nombre de parts égales
 * @returns Liste des périodes avec start/end/days
 */
function generateCustomSplitPeriods(daysInMonth: number, parts: number): Array<{ start: number; end: number; days: number }> {
  const periods: Array<{ start: number; end: number; days: number }> = [];
  const validParts = Math.max(1, Math.min(daysInMonth, parts));
  const daysPerPart = Math.floor(daysInMonth / validParts);

  for (let i = 0; i < validParts; i++) {
    const start = i * daysPerPart + 1;
    const end = i === validParts - 1 ? daysInMonth : (i + 1) * daysPerPart;
    const days = end - start + 1;
    periods.push({ start, end, days });
  }

  return periods;
}

/**
 * Calcule le budget égal par part pour CUSTOM_SPLIT
 * @param monthlyBudget - Budget mensuel total
 * @param parts - Nombre de parts
 * @returns Budget par part
 */
function calculateEqualBudgetPerPart(monthlyBudget: number, parts: number): number {
  return monthlyBudget / parts;
}

describe("Calculs de périodes budgétaires", () => {
  describe("calculateDistributedBudget", () => {
    it("distribue proportionnellement pour une période complète", () => {
      // Budget 2000€ pour 30 jours, période de 7 jours
      const result = calculateDistributedBudget(2000, 30, 7);
      expect(result).toBeCloseTo(466.67, 2);
      // 2000 / 30 * 7 = 466.67€
    });

    it("distribue pour un mois de 31 jours", () => {
      // Budget 2100€ pour 31 jours, période de 7 jours
      const result = calculateDistributedBudget(2100, 31, 7);
      expect(result).toBeCloseTo(474.19, 2);
      // 2100 / 31 * 7 = 474.19€
    });

    it("gère une période partielle (dernière semaine d'un mois)", () => {
      // Budget 2000€ pour 30 jours, dernière période de 2 jours
      const result = calculateDistributedBudget(2000, 30, 2);
      expect(result).toBeCloseTo(133.33, 2);
      // 2000 / 30 * 2 = 133.33€
    });

    it("gère un mois de février (28 jours)", () => {
      const result = calculateDistributedBudget(2000, 28, 7);
      expect(result).toBe(500);
      // 2000 / 28 * 7 = 500€
    });

    it("gère un mois de février bissextile (29 jours)", () => {
      const result = calculateDistributedBudget(2000, 29, 7);
      expect(result).toBeCloseTo(482.76, 2);
    });

    it("retourne 0 pour une période de 0 jours", () => {
      const result = calculateDistributedBudget(2000, 30, 0);
      expect(result).toBe(0);
    });

    it("distribue tout le budget pour une période égale au mois", () => {
      const result = calculateDistributedBudget(2000, 30, 30);
      expect(result).toBeCloseTo(2000, 2);
    });
  });

  describe("generateFixedDaysPeriods - Mode FIXED_DAYS", () => {
    it("génère 4 périodes de 7 jours pour un mois de 28 jours", () => {
      const periods = generateFixedDaysPeriods(28, 7);

      expect(periods).toHaveLength(4);
      expect(periods[0]).toEqual({ start: 1, end: 7, days: 7 });
      expect(periods[1]).toEqual({ start: 8, end: 14, days: 7 });
      expect(periods[2]).toEqual({ start: 15, end: 21, days: 7 });
      expect(periods[3]).toEqual({ start: 22, end: 28, days: 7 });
    });

    it("génère 4 périodes complètes + 1 partielle pour un mois de 30 jours", () => {
      const periods = generateFixedDaysPeriods(30, 7);

      expect(periods).toHaveLength(5);
      expect(periods[0]).toEqual({ start: 1, end: 7, days: 7 });
      expect(periods[1]).toEqual({ start: 8, end: 14, days: 7 });
      expect(periods[2]).toEqual({ start: 15, end: 21, days: 7 });
      expect(periods[3]).toEqual({ start: 22, end: 28, days: 7 });
      expect(periods[4]).toEqual({ start: 29, end: 30, days: 2 }); // Période partielle
    });

    it("génère 4 périodes complètes + 1 partielle pour un mois de 31 jours", () => {
      const periods = generateFixedDaysPeriods(31, 7);

      expect(periods).toHaveLength(5);
      expect(periods[4]).toEqual({ start: 29, end: 31, days: 3 });
    });

    it("génère les bonnes périodes pour périodeValue = 10 jours", () => {
      const periods = generateFixedDaysPeriods(30, 10);

      expect(periods).toHaveLength(3);
      expect(periods[0]).toEqual({ start: 1, end: 10, days: 10 });
      expect(periods[1]).toEqual({ start: 11, end: 20, days: 10 });
      expect(periods[2]).toEqual({ start: 21, end: 30, days: 10 });
    });

    it("génère une seule période pour périodeValue > daysInMonth", () => {
      const periods = generateFixedDaysPeriods(30, 31);

      expect(periods).toHaveLength(1);
      expect(periods[0]).toEqual({ start: 1, end: 30, days: 30 });
    });

    it("génère 30 périodes pour périodeValue = 1 jour", () => {
      const periods = generateFixedDaysPeriods(30, 1);
      expect(periods).toHaveLength(30);
      expect(periods[0]).toEqual({ start: 1, end: 1, days: 1 });
      expect(periods[29]).toEqual({ start: 30, end: 30, days: 1 });
    });
  });

  describe("generateCustomSplitPeriods - Mode CUSTOM_SPLIT", () => {
    it("divise un mois de 30 jours en 4 parts égales", () => {
      const periods = generateCustomSplitPeriods(30, 4);

      expect(periods).toHaveLength(4);
      expect(periods[0]).toEqual({ start: 1, end: 7, days: 7 });
      expect(periods[1]).toEqual({ start: 8, end: 14, days: 7 });
      expect(periods[2]).toEqual({ start: 15, end: 21, days: 7 });
      expect(periods[3]).toEqual({ start: 22, end: 30, days: 9 }); // Dernière part absorbe le reste
    });

    it("divise un mois de 28 jours en 4 parts égales", () => {
      const periods = generateCustomSplitPeriods(28, 4);

      expect(periods).toHaveLength(4);
      periods.forEach((period) => {
        expect(period.days).toBe(7); // Parfaitement divisible
      });
    });

    it("divise un mois de 31 jours en 3 parts", () => {
      const periods = generateCustomSplitPeriods(31, 3);

      expect(periods).toHaveLength(3);
      expect(periods[0]).toEqual({ start: 1, end: 10, days: 10 });
      expect(periods[1]).toEqual({ start: 11, end: 20, days: 10 });
      expect(periods[2]).toEqual({ start: 21, end: 31, days: 11 }); // Dernière part + 1 jour
    });

    it("limite à 1 part minimum", () => {
      const periods = generateCustomSplitPeriods(30, 0);
      expect(periods).toHaveLength(1);
      expect(periods[0]).toEqual({ start: 1, end: 30, days: 30 });
    });

    it("limite à daysInMonth parts maximum", () => {
      const periods = generateCustomSplitPeriods(30, 50);
      expect(periods).toHaveLength(30); // Max = nombre de jours
    });

    it("génère 2 parts pour un mois", () => {
      const periods = generateCustomSplitPeriods(30, 2);

      expect(periods).toHaveLength(2);
      expect(periods[0]).toEqual({ start: 1, end: 15, days: 15 });
      expect(periods[1]).toEqual({ start: 16, end: 30, days: 15 });
    });
  });

  describe("calculateEqualBudgetPerPart - Budget égal par part", () => {
    it("divise le budget également en 4 parts", () => {
      const result = calculateEqualBudgetPerPart(2000, 4);
      expect(result).toBe(500);
    });

    it("divise le budget en 3 parts", () => {
      const result = calculateEqualBudgetPerPart(2100, 3);
      expect(result).toBe(700);
    });

    it("gère des montants non divisibles exactement", () => {
      const result = calculateEqualBudgetPerPart(2000, 3);
      expect(result).toBeCloseTo(666.67, 2);
    });

    it("retourne tout le budget pour 1 part", () => {
      const result = calculateEqualBudgetPerPart(2000, 1);
      expect(result).toBe(2000);
    });
  });

  describe("Scénarios réels complets", () => {
    it("Janvier 2026 : Budget 2000€, périodes de 7 jours", () => {
      const monthlyBudget = 2000;
      const daysInMonth = 31;
      const periods = generateFixedDaysPeriods(daysInMonth, 7);

      expect(periods).toHaveLength(5);

      // Vérifier que la somme des budgets distribués ≈ budget mensuel
      const totalDistributed = periods.reduce((sum, period) => {
        return sum + calculateDistributedBudget(monthlyBudget, daysInMonth, period.days);
      }, 0);

      expect(totalDistributed).toBeCloseTo(monthlyBudget, 2); // Doit être égal au budget mensuel
    });

    it("Février 2026 : Budget 1800€, 4 parts égales", () => {
      const monthlyBudget = 1800;
      const daysInMonth = 28;
      const parts = 4;

      const periods = generateCustomSplitPeriods(daysInMonth, parts);
      const budgetPerPart = calculateEqualBudgetPerPart(monthlyBudget, parts);

      expect(periods).toHaveLength(4);
      expect(budgetPerPart).toBe(450); // 1800 / 4 = 450€

      // Vérifier que toutes les parts sont égales en jours
      periods.forEach((period) => {
        expect(period.days).toBe(7);
      });
    });

    it("Mars 2026 : Budget 2500€, périodes de 10 jours", () => {
      const monthlyBudget = 2500;
      const daysInMonth = 31;
      const periods = generateFixedDaysPeriods(daysInMonth, 10);

      expect(periods).toHaveLength(4);

      const totalDistributed = periods.reduce((sum, period) => {
        return sum + calculateDistributedBudget(monthlyBudget, daysInMonth, period.days);
      }, 0);

      expect(totalDistributed).toBeCloseTo(monthlyBudget, 2);
    });

    it("Avril 2026 : Budget 2200€, 3 parts égales", () => {
      const monthlyBudget = 2200;
      const daysInMonth = 30;
      const parts = 3;

      const periods = generateCustomSplitPeriods(daysInMonth, parts);
      const budgetPerPart = calculateEqualBudgetPerPart(monthlyBudget, parts);

      expect(periods).toHaveLength(3);
      expect(budgetPerPart).toBeCloseTo(733.33, 2);

      // Vérifier la somme totale des budgets
      expect(budgetPerPart * parts).toBe(monthlyBudget);
    });
  });

  describe("Cas limites et validations", () => {
    it("gère un budget de 0€", () => {
      const result = calculateDistributedBudget(0, 30, 7);
      expect(result).toBe(0);
    });

    it("gère un mois de 1 jour (cas théorique)", () => {
      const periods = generateFixedDaysPeriods(1, 7);
      expect(periods).toHaveLength(1);
      expect(periods[0]).toEqual({ start: 1, end: 1, days: 1 });
    });

    it("Custom Split : parts = daysInMonth génère une période par jour", () => {
      const periods = generateCustomSplitPeriods(5, 5);
      expect(periods).toHaveLength(5);
      periods.forEach((period, idx) => {
        expect(period).toEqual({ start: idx + 1, end: idx + 1, days: 1 });
      });
    });

    it("Fixed Days : dernière période peut être plus longue que periodValue", () => {
      const periods = generateFixedDaysPeriods(30, 7);
      const lastPeriod = periods[periods.length - 1];

      // Dernière période : 29-30 (2 jours) < 7 jours
      expect(lastPeriod.days).toBeLessThanOrEqual(7);
    });

    it("Custom Split : dernière part absorbe les jours restants", () => {
      const periods = generateCustomSplitPeriods(31, 3);
      const lastPeriod = periods[periods.length - 1];

      // 31 / 3 = 10 jours par part, reste 1 jour
      expect(lastPeriod.days).toBe(11); // 10 + 1
    });
  });
});

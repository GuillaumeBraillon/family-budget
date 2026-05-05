/**
 * @file Tests unitaires pour useAllowanceContext
 * @description Couverture du calcul de report (carryover) mensuel par bénéficiaire.
 * Cas testés : premier mois de l'année, report positif/négatif, récurrents non pointés,
 * plusieurs bénéficiaires, virements exclus.
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAllowanceContext } from "../hooks/balances/useAllowanceContext";
import type { AppSettings, PaidItemDetails, ExpenseConfig } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSettings = (personalBudgetAmount: number): AppSettings =>
  ({
    personal_budget_amount: personalBudgetAmount,
  }) as AppSettings;

const makePaidItem = (
  instanceId: string,
  paymentDate: string,
  amount: number,
  beneficiaryId: string,
  type: "EXPENSE" | "INCOME" = "EXPENSE"
): PaidItemDetails => ({
  instanceId,
  amount,
  paymentDate,
  accountId: "acc-1",
  label: "Test",
  category: "Alimentation",
  type,
  isVariable: true,
  isWaiting: false,
  isExtra: false,
  isSalary: false,
  beneficiaryAmounts: [{ beneficiaryId, amount }],
});

const makeConfig = (id: string, amount: number, beneficiaryId: string): ExpenseConfig => ({
  id,
  label: "Récurrent",
  amount,
  category: "Logement",
  beneficiaryId,
  accountId: "acc-1",
  dayOfMonth: 5,
  isExtra: false,
});

// Date fixe : mai 2026 (pour que janvier-avril soient les mois passés)
const currentDate = new Date("2026-05-01");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAllowanceContext - aucun bénéficiaire", () => {
  it("retourne allowance zéro si personalBeneficiaryIds vide", () => {
    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate,
        paidItems: {},
        personalBeneficiaryIds: [],
        settings: makeSettings(350),
        configs: [],
        incomeConfigs: [],
      })
    );

    expect(result.current.availableMonthlyAllowance).toBe(0);
    expect(result.current.previousCarryoverTotal).toBe(0);
    expect(result.current.allowancePerBeneficiary).toBe(350);
  });
});

describe("useAllowanceContext - premier mois de l'année (janvier)", () => {
  it("pas de report si currentDate = janvier et aucune dépense passée", () => {
    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-01-15"),
        paidItems: {},
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(400),
        configs: [],
        incomeConfigs: [],
      })
    );

    // Janvier = premier mois, allPastMonths = [], aucun carryover
    expect(result.current.previousCarryoverTotal).toBe(0);
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(0);
    expect(result.current.availableMonthlyAllowance).toBe(400);
  });
});

describe("useAllowanceContext - report positif (sous-consommation)", () => {
  it("cumule le solde non dépensé des mois précédents", () => {
    // Budget 300€/mois, b1 a dépensé 200€ en janvier → report de 100€
    const paidItems: Record<string, PaidItemDetails> = {
      "var-jan": makePaidItem("var-jan", "2026-01-15", 200, "b1"),
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    // Janvier : disponible=300, consommé=200, carryover=100
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(100);
    expect(result.current.previousCarryoverTotal).toBe(100);
    // Disponible en février : 300 (budget) + 100 (report) = 400
    expect(result.current.availableMonthlyAllowance).toBe(400);
  });

  it("accumule les reports sur plusieurs mois", () => {
    // Budget 300€, dépensé 100€ en jan, 150€ en fév → carryover cumulatif
    const paidItems: Record<string, PaidItemDetails> = {
      "var-jan": makePaidItem("var-jan", "2026-01-10", 100, "b1"),
      "var-fev": makePaidItem("var-fev", "2026-02-10", 150, "b1"),
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-03-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    // Jan : 300 - 100 = +200 carryover
    // Fev : (300+200) - 150 = +350 carryover
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(350);
    expect(result.current.availableMonthlyAllowance).toBe(650); // 300 + 350
  });
});

describe("useAllowanceContext - report négatif (sur-consommation)", () => {
  it("déduit la sur-consommation du budget du mois suivant", () => {
    // Budget 200€, dépensé 350€ en janvier → déficit de -150€
    const paidItems: Record<string, PaidItemDetails> = {
      "var-jan": makePaidItem("var-jan", "2026-01-20", 350, "b1"),
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(200),
        configs: [],
        incomeConfigs: [],
      })
    );

    expect(result.current.carryoverByBeneficiary["b1"]).toBe(-150);
    expect(result.current.previousCarryoverTotal).toBe(-150);
    expect(result.current.availableMonthlyAllowance).toBe(50); // 200 - 150
  });
});

describe("useAllowanceContext - multi-bénéficiaires", () => {
  it("calcule un carryover indépendant par bénéficiaire", () => {
    // b1 : dépensé 100/300 → carryover +200
    // b2 : dépensé 350/300 → carryover -50
    const paidItems: Record<string, PaidItemDetails> = {
      "var-b1": makePaidItem("var-b1", "2026-01-10", 100, "b1"),
      "var-b2": makePaidItem("var-b2", "2026-01-10", 350, "b2"),
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1", "b2"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    expect(result.current.carryoverByBeneficiary["b1"]).toBe(200);
    expect(result.current.carryoverByBeneficiary["b2"]).toBe(-50);
    expect(result.current.previousCarryoverTotal).toBe(150);
    // Disponible total : 2×300 + 150 = 750
    expect(result.current.availableMonthlyAllowance).toBe(750);
  });
});

describe("useAllowanceContext - exclusions", () => {
  it('ignore les paidItems de catégorie "Virement Interne"', () => {
    const paidItems: Record<string, PaidItemDetails> = {
      virement: {
        ...makePaidItem("virement", "2026-01-10", 500, "b1"),
        category: "Virement Interne",
      },
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    // Le virement doit être ignoré → carryover = 300 entier
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(300);
  });

  it('ignore les paidItems de sous-catégorie "Intérêts"', () => {
    const paidItems: Record<string, PaidItemDetails> = {
      interets: {
        ...makePaidItem("interets", "2026-01-10", 100, "b1"),
        category: "Épargne",
        subCategory: "Intérêts",
      },
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    expect(result.current.carryoverByBeneficiary["b1"]).toBe(300);
  });

  it("ignore les paidItems du mois courant", () => {
    const paidItems: Record<string, PaidItemDetails> = {
      "var-current": makePaidItem("var-current", "2026-02-05", 200, "b1"),
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    // Seul janvier est compté, et janvier est vide → carryover = 300
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(300);
  });

  it("ignore les paidItems isSalary", () => {
    const paidItems: Record<string, PaidItemDetails> = {
      salaire: {
        ...makePaidItem("salaire", "2026-01-28", 2500, "b1", "INCOME"),
        isSalary: true,
      },
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs: [],
        incomeConfigs: [],
      })
    );

    expect(result.current.carryoverByBeneficiary["b1"]).toBe(300);
  });
});

describe("useAllowanceContext - récurrents non pointés", () => {
  it("intègre les récurrents passés non pointés dans le carryover", () => {
    // Récurrent loyer 500€ pour b1 en janvier, non pointé
    const configs: ExpenseConfig[] = [makeConfig("cfg-loyer", 500, "b1")];

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems: {}, // Rien de pointé
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs,
        incomeConfigs: [],
      })
    );

    // Jan : disponible 300, consommé (récurrent non pointé) 500 → carryover = -200
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(-200);
  });

  it("ne compte pas un récurrent si déjà pointé via paidItems", () => {
    const configs: ExpenseConfig[] = [makeConfig("cfg-loyer", 500, "b1")];
    const paidItems: Record<string, PaidItemDetails> = {
      "cfg-loyer-2026-01": makePaidItem("cfg-loyer-2026-01", "2026-01-05", 500, "b1"),
    };

    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-02-01"),
        paidItems,
        personalBeneficiaryIds: ["b1"],
        settings: makeSettings(300),
        configs,
        incomeConfigs: [],
      })
    );

    // Le pointage remplace le planifié → consommé = 500, carryover = -200
    expect(result.current.carryoverByBeneficiary["b1"]).toBe(-200);
  });
});

describe("useAllowanceContext - valeurs de settings", () => {
  it("utilise 350 comme valeur par défaut si personal_budget_amount absent", () => {
    const { result } = renderHook(() =>
      useAllowanceContext({
        currentDate: new Date("2026-01-01"),
        paidItems: {},
        personalBeneficiaryIds: ["b1"],
        settings: {} as AppSettings,
        configs: [],
        incomeConfigs: [],
      })
    );

    expect(result.current.allowancePerBeneficiary).toBe(350);
  });
});

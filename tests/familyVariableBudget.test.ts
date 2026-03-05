import { describe, expect, it } from "vitest";
import { Person, PlannedItem } from "../types";
import {
  calculateFamilyVariableNet,
  calculateFamilyVariableNetBreakdown,
  calculateFamilyVariableBudgetTotal,
  calculateFamilyVariableMonthlyCarryover,
  calculateFamilyVariablePeriodCarryover,
} from "../hooks/balances/useBalancesData";
import { getFamilyBeneficiaryIds } from "../services/financeUtils";

const createPlannedItem = (overrides: Partial<PlannedItem>): PlannedItem => ({
  type: "EXPENSE",
  source: "VARIABLE",
  configId: "cfg-1",
  instanceId: "cfg-1-2026-03",
  day: 5,
  label: "Opération",
  amount: 100,
  originalAmount: 100,
  isPaid: true,
  isWaiting: false,
  category: "Courses",
  beneficiaryId: "b-default",
  isExtra: false,
  isExtraGlobal: false,
  accountId: "acc-1",
  ...overrides,
});

describe("calculateFamilyVariableNet", () => {
  it("calcule le solde net Famille (standard + extra)", () => {
    const items: PlannedItem[] = [
      createPlannedItem({
        amount: 200,
        beneficiaryAmounts: [
          { beneficiaryId: "b-family", amount: 150 },
          { beneficiaryId: "b-parent", amount: 50 },
        ],
        tagAmounts: [
          { tagId: "t-standard", amount: 120, isExtra: false },
          { tagId: "t-extra", amount: 80, isExtra: true },
        ],
      }),
    ];

    const net = calculateFamilyVariableNet(items, ["b-family"]);

    expect(net).toBe(150);
  });

  it("inclut les revenus variables et exclut récurrentes / hors budget", () => {
    const items: PlannedItem[] = [
      createPlannedItem({ source: "RECURRING", amount: 100, beneficiaryAmounts: [{ beneficiaryId: "b-family", amount: 100 }] }),
      createPlannedItem({ type: "INCOME", amount: 100, beneficiaryAmounts: [{ beneficiaryId: "b-family", amount: 100 }] }),
      createPlannedItem({ category: "Virement Interne", amount: 100, beneficiaryAmounts: [{ beneficiaryId: "b-family", amount: 100 }] }),
      createPlannedItem({ subCategory: "Intérêts", amount: 100, beneficiaryAmounts: [{ beneficiaryId: "b-family", amount: 100 }] }),
    ];

    const net = calculateFamilyVariableNet(items, ["b-family"]);

    expect(net).toBe(-100);
  });

  it("additionne plusieurs IDs Famille sans doublon", () => {
    const items: PlannedItem[] = [
      createPlannedItem({
        amount: 120,
        beneficiaryAmounts: [
          { beneficiaryId: "b-family-main", amount: 60 },
          { beneficiaryId: "b-family-alt", amount: 60 },
        ],
      }),
    ];

    const net = calculateFamilyVariableNet(items, ["b-family-main", "b-family-alt", "b-family-main"]);

    expect(net).toBe(120);
  });
});

describe("calculateFamilyVariableNetBreakdown", () => {
  it("retourne le détail Standard/Extra/Tout et Réel/En attente", () => {
    const items: PlannedItem[] = [
      createPlannedItem({
        amount: 200,
        isPaid: true,
        isWaiting: false,
        beneficiaryAmounts: [
          { beneficiaryId: "b-family", amount: 150 },
          { beneficiaryId: "b-parent", amount: 50 },
        ],
        tagAmounts: [
          { tagId: "t-standard", amount: 120, isExtra: false },
          { tagId: "t-extra", amount: 80, isExtra: true },
        ],
      }),
      createPlannedItem({
        amount: 100,
        isPaid: false,
        isWaiting: true,
        beneficiaryAmounts: [{ beneficiaryId: "b-family", amount: 100 }],
      }),
    ];

    const breakdown = calculateFamilyVariableNetBreakdown(items, ["b-family"]);

    expect(breakdown.nature.standard).toBe(190);
    expect(breakdown.nature.extra).toBe(60);
    expect(breakdown.nature.total).toBe(250);
    expect(breakdown.status.real).toBe(150);
    expect(breakdown.status.waiting).toBe(100);
  });
});

describe("calculateFamilyVariableBudgetTotal", () => {
  it("répartit le montant mensuel sur toutes les périodes du mois", () => {
    const total = calculateFamilyVariableBudgetTotal(400, 4, 4);

    expect(total).toBe(400);
  });

  it("retourne la part d'une période active", () => {
    const total = calculateFamilyVariableBudgetTotal(400, 4, 1);

    expect(total).toBe(100);
  });

  it("gère les cas limites", () => {
    expect(calculateFamilyVariableBudgetTotal(0, 4, 1)).toBe(0);
    expect(calculateFamilyVariableBudgetTotal(300, 0, 1)).toBe(0);
    expect(calculateFamilyVariableBudgetTotal(300, 4, 0)).toBe(0);
  });
});

describe("calculateFamilyVariableMonthlyCarryover", () => {
  it("cumule bonus/malus d'un mois sur l'autre", () => {
    const carryover = calculateFamilyVariableMonthlyCarryover(400, [300, 450, 200]);

    expect(carryover).toBe(250);
  });

  it("retourne 0 sans historique", () => {
    expect(calculateFamilyVariableMonthlyCarryover(400, [])).toBe(0);
  });
});

describe("calculateFamilyVariablePeriodCarryover", () => {
  it("applique le report période à période dans le mois", () => {
    const result = calculateFamilyVariablePeriodCarryover(400, 0, [80, 150, 50, 120]);

    expect(result.periodBudgets).toEqual([100, 120, 70, 120]);
    expect(result.periodRemaining).toEqual([20, -30, 20, 0]);
    expect(result.monthBudget).toBe(400);
    expect(result.monthSpent).toBe(400);
    expect(result.monthRemaining).toBe(0);
  });

  it("inclut le report venant des mois précédents", () => {
    const result = calculateFamilyVariablePeriodCarryover(400, 60, [100, 100, 100, 100]);

    expect(result.periodBudgets[0]).toBe(160);
    expect(result.monthBudget).toBe(460);
    expect(result.monthRemaining).toBe(60);
  });
});

describe("getFamilyBeneficiaryIds", () => {
  it("inclut Famille + enfants", () => {
    const people: Person[] = [
      { id: "p_guillaume", name: "Guillaume", isChild: false, displayOrder: 3 },
      { id: "p_joint", name: "Famille", isChild: false, displayOrder: 1 },
      { id: "p_nelly", name: "Nelly", isChild: false, displayOrder: 2 },
      { id: "p_oscar", name: "Oscar", isChild: true, displayOrder: 4 },
      { id: "p_eliott", name: "Eliott", isChild: true, displayOrder: 5 },
    ];

    expect(getFamilyBeneficiaryIds(people)).toEqual(["p_joint", "p_oscar", "p_eliott"]);
  });

  it("fallback sur premier adulte si pas de Famille ni enfants", () => {
    const people: Person[] = [
      { id: "p_guillaume", name: "Guillaume", isChild: false, displayOrder: 3 },
      { id: "p_nelly", name: "Nelly", isChild: false, displayOrder: 2 },
    ];

    expect(getFamilyBeneficiaryIds(people)).toEqual(["p_nelly"]);
  });
});

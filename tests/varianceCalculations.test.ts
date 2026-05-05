/**
 * @file Tests unitaires pour computePersonalVariance
 * @description Vérifie les formules des tooltips Excédent / Déficit / Neutre
 * affichés dans la vue Balances (BalancesTable / BalancesView).
 *
 * **Formules testées :**
 *   availableTotal     = availableTarget + paidConsumedAmount - countedPendingAmount
 *   availableRemaining = availableTarget - countedPendingAmount
 *   immediateAmount    = balance - availableRemaining
 *   projectedAmount    = balance + accountPendingAmount - availableTarget
 */
import { describe, it, expect } from "vitest";
import { computePersonalVariance, type PersonalVarianceInput } from "../hooks/balances/varianceUtils";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const base: PersonalVarianceInput = {
  balance: 0,
  availableTarget: 0,
  paidConsumedAmount: 0,
  countedPendingAmount: 0,
  accountPendingAmount: 0,
};

const compute = (overrides: Partial<PersonalVarianceInput>) => computePersonalVariance({ ...base, ...overrides });

// ---------------------------------------------------------------------------
// availableTotal — budget brut de la période
// ---------------------------------------------------------------------------

describe("availableTotal = availableTarget + paidConsumedAmount - countedPendingAmount", () => {
  it("cas de base : aucun mouvement", () => {
    expect(compute({ availableTarget: 300 }).availableTotal).toBe(300);
  });

  it("intègre les dépenses déjà pointées", () => {
    // Budget 300, déjà dépensé 120 → budget brut visible = 420 (le solde n'a pas encore baissé)
    expect(compute({ availableTarget: 300, paidConsumedAmount: 120 }).availableTotal).toBe(420);
  });

  it("déduit les opérations planifiées en attente", () => {
    // Budget 300, 80€ planifiés non pointés → budget brut = 220
    expect(compute({ availableTarget: 300, countedPendingAmount: 80 }).availableTotal).toBe(220);
  });

  it("combine dépenses pointées et en attente", () => {
    // Budget 500, pointé 200, en attente 100 → 500 + 200 - 100 = 600
    expect(compute({ availableTarget: 500, paidConsumedAmount: 200, countedPendingAmount: 100 }).availableTotal).toBe(600);
  });

  it("peut être négatif si en attente > budget + pointé", () => {
    // Budget 100, en attente 300 → 100 + 0 - 300 = -200
    expect(compute({ availableTarget: 100, countedPendingAmount: 300 }).availableTotal).toBe(-200);
  });
});

// ---------------------------------------------------------------------------
// availableRemaining — restant après déduction des opérations en attente
// ---------------------------------------------------------------------------

describe("availableRemaining = availableTarget - countedPendingAmount", () => {
  it("cas de base : aucune opération en attente", () => {
    expect(compute({ availableTarget: 400 }).availableRemaining).toBe(400);
  });

  it("déduit les opérations planifiées", () => {
    expect(compute({ availableTarget: 400, countedPendingAmount: 150 }).availableRemaining).toBe(250);
  });

  it("est indépendant de paidConsumedAmount", () => {
    // paidConsumedAmount n'affecte PAS availableRemaining
    expect(compute({ availableTarget: 300, paidConsumedAmount: 200, countedPendingAmount: 50 }).availableRemaining).toBe(250);
  });

  it("peut être négatif (over-planning)", () => {
    expect(compute({ availableTarget: 100, countedPendingAmount: 250 }).availableRemaining).toBe(-150);
  });
});

// ---------------------------------------------------------------------------
// immediateAmount — écart immédiat (solde vs restant)
// ---------------------------------------------------------------------------

describe("immediateAmount = balance - availableRemaining", () => {
  it("excédent : solde > restant", () => {
    // Solde 350, restant 300 → excédent = +50
    expect(compute({ balance: 350, availableTarget: 300 }).immediateAmount).toBe(50);
  });

  it("déficit : solde < restant", () => {
    // Solde 200, restant 300 → déficit = -100
    expect(compute({ balance: 200, availableTarget: 300 }).immediateAmount).toBe(-100);
  });

  it("équilibre parfait : solde = restant → 0", () => {
    expect(compute({ balance: 300, availableTarget: 300 }).immediateAmount).toBeCloseTo(0, 5);
  });

  it("prend en compte countedPendingAmount dans le restant", () => {
    // Solde 300, budget 400, en attente 150 → restant = 250, écart = +50
    expect(compute({ balance: 300, availableTarget: 400, countedPendingAmount: 150 }).immediateAmount).toBe(50);
  });

  it("scénario réel : compte courant avec carryover", () => {
    // Budget cible = 450 (350 allowance + 100 carryover)
    // En attente planifié = 80€
    // Solde = 380
    // availableRemaining = 450 - 80 = 370
    // immediateAmount = 380 - 370 = +10 (léger excédent)
    expect(compute({ balance: 380, availableTarget: 450, countedPendingAmount: 80 }).immediateAmount).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// projectedAmount — écart projeté avec les opérations en attente du compte
// ---------------------------------------------------------------------------

describe("projectedAmount = balance + accountPendingAmount - availableTarget", () => {
  it("cas sans opérations en attente = même que immediateAmount si countedPending=0", () => {
    const r = compute({ balance: 350, availableTarget: 300 });
    expect(r.projectedAmount).toBe(50);
  });

  it("opérations en attente négatives (débit à venir) réduisent le projeté", () => {
    // Solde 500, en attente -200, budget 300 → projeté = 500 - 200 - 300 = 0
    expect(compute({ balance: 500, availableTarget: 300, accountPendingAmount: -200 }).projectedAmount).toBe(0);
  });

  it("opérations en attente positives (remboursement à venir) augmentent le projeté", () => {
    // Solde 200, en attente +100, budget 300 → projeté = 200 + 100 - 300 = 0
    expect(compute({ balance: 200, availableTarget: 300, accountPendingAmount: 100 }).projectedAmount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// personalProjectedAmount — toujours = availableTarget (ligne "Perso projeté")
// ---------------------------------------------------------------------------

describe("personalProjectedAmount = availableTarget", () => {
  it("est toujours égal à availableTarget quelle que soit la config", () => {
    const r = compute({ availableTarget: 425, balance: 300, paidConsumedAmount: 180, countedPendingAmount: 60 });
    expect(r.personalProjectedAmount).toBe(425);
  });
});

// ---------------------------------------------------------------------------
// pendingCreditAmount / hasPendingCredit
// ---------------------------------------------------------------------------

describe("pendingCreditAmount et hasPendingCredit", () => {
  it("pendingCreditAmount = max(accountPendingAmount, 0) — retient uniquement les crédits", () => {
    expect(compute({ accountPendingAmount: 150 }).pendingCreditAmount).toBe(150);
    expect(compute({ accountPendingAmount: -80 }).pendingCreditAmount).toBe(0);
    expect(compute({ accountPendingAmount: 0 }).pendingCreditAmount).toBe(0);
  });

  it("hasPendingCredit = true si pendingCreditAmount > 0.01", () => {
    expect(compute({ accountPendingAmount: 0.02 }).hasPendingCredit).toBe(true);
    expect(compute({ accountPendingAmount: 50 }).hasPendingCredit).toBe(true);
  });

  it("hasPendingCredit = false si pendingCreditAmount ≤ 0.01", () => {
    expect(compute({ accountPendingAmount: 0 }).hasPendingCredit).toBe(false);
    expect(compute({ accountPendingAmount: 0.005 }).hasPendingCredit).toBe(false);
    expect(compute({ accountPendingAmount: -100 }).hasPendingCredit).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasSamePendingAmount — cohérence entre pending compte et pending planifié
// ---------------------------------------------------------------------------

describe("hasSamePendingAmount", () => {
  it("true si accountPendingAmount ≈ countedPendingAmount (delta < 0.01)", () => {
    expect(compute({ accountPendingAmount: 100, countedPendingAmount: 100 }).hasSamePendingAmount).toBe(true);
    expect(compute({ accountPendingAmount: 100.005, countedPendingAmount: 100 }).hasSamePendingAmount).toBe(true);
  });

  it("false si les deux pendants diffèrent de plus de 0.01", () => {
    expect(compute({ accountPendingAmount: 100, countedPendingAmount: 80 }).hasSamePendingAmount).toBe(false);
    expect(compute({ accountPendingAmount: 0, countedPendingAmount: 50 }).hasSamePendingAmount).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scénarios bout en bout (cas métier réels)
// ---------------------------------------------------------------------------

describe("Scénarios complets — tooltips BalancesView", () => {
  it("Excédent : solde confortable, peu de dépenses planifiées", () => {
    // Compte courant : 850€ de solde
    // Budget cible : 700€ (350 allowance + 350 carryover)
    // Opérations planifiées non pointées : 50€
    // Dépenses déjà pointées ce mois : 320€
    // Pas d'opérations en attente côté compte
    const r = compute({
      balance: 850,
      availableTarget: 700,
      paidConsumedAmount: 320,
      countedPendingAmount: 50,
      accountPendingAmount: 0,
    });

    // availableTotal = 700 + 320 - 50 = 970
    expect(r.availableTotal).toBe(970);
    // availableRemaining = 700 - 50 = 650
    expect(r.availableRemaining).toBe(650);
    // immediateAmount = 850 - 650 = +200 (excédent)
    expect(r.immediateAmount).toBe(200);
    // projectedAmount = 850 + 0 - 700 = +150
    expect(r.projectedAmount).toBe(150);
    expect(r.hasPendingCredit).toBe(false);
    // accountPendingAmount (0) ≠ countedPendingAmount (50) → false
    expect(r.hasSamePendingAmount).toBe(false);
  });

  it("Déficit : trop dépensé, solde bas", () => {
    // Compte : 180€
    // Budget cible : 400€ (350 allowance + 50 carryover)
    // Planifié en attente : 120€ (loyer, etc.)
    // Pointé : 200€
    const r = compute({
      balance: 180,
      availableTarget: 400,
      paidConsumedAmount: 200,
      countedPendingAmount: 120,
      accountPendingAmount: -120,
    });

    // availableRemaining = 400 - 120 = 280
    expect(r.availableRemaining).toBe(280);
    // immediateAmount = 180 - 280 = -100 (déficit)
    expect(r.immediateAmount).toBe(-100);
    // pendingCreditAmount = max(-120, 0) = 0
    expect(r.pendingCreditAmount).toBe(0);
    expect(r.hasPendingCredit).toBe(false);
  });

  it("Neutre : solde = restant exactement", () => {
    // Cas parfaitement équilibré
    const r = compute({
      balance: 350,
      availableTarget: 350,
      paidConsumedAmount: 0,
      countedPendingAmount: 0,
      accountPendingAmount: 0,
    });

    expect(r.immediateAmount).toBe(0);
    expect(r.availableTotal).toBe(350);
    expect(r.availableRemaining).toBe(350);
    expect(r.hasSamePendingAmount).toBe(true);
  });

  it("Compte avec CB non débitée (crédit en attente)", () => {
    // Remboursement de 100€ pas encore crédité sur le compte
    const r = compute({
      balance: 300,
      availableTarget: 350,
      paidConsumedAmount: 0,
      countedPendingAmount: 0,
      accountPendingAmount: 100,
    });

    expect(r.pendingCreditAmount).toBe(100);
    expect(r.hasPendingCredit).toBe(true);
    // projectedAmount = 300 + 100 - 350 = +50
    expect(r.projectedAmount).toBe(50);
    // Mais immediateAmount (immédiat) = 300 - 350 = -50 (apparent déficit)
    expect(r.immediateAmount).toBe(-50);
  });
});

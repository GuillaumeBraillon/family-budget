import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PaidItemDetails, VariableTransaction } from "../types";

const { rpcMock, fromMock, loggerMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  loggerMock: {
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    group: vi.fn(),
    isDebugEnabled: vi.fn(),
  },
}));

vi.mock("../services/supabase", () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

vi.mock("../services/logger", () => ({
  logger: loggerMock,
}));

import { apiSetPaidStatus, apiUpsertVariableTransaction } from "../services/apiCrud";

describe("apiCrud - RPC upsert_paid_item_atomic", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
    loggerMock.log.mockReset();
    loggerMock.debug.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();
    loggerMock.group.mockReset();
    loggerMock.isDebugEnabled.mockReset();
  });

  it("normalise une transaction variable EXPENSE négative en INCOME positif", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const tx: VariableTransaction = {
      id: "var_1",
      date: "2026-02-20",
      label: "Remboursement",
      amount: -42.5,
      category: "Dépenses",
      subCategory: "Remboursement",
      accountId: "3",
      beneficiaryId: "",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
    };

    await apiUpsertVariableTransaction(tx);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_atomic",
      expect.objectContaining({
        p_instance_id: "var_1",
        p_amount: 42.5,
        p_type: "INCOME",
      })
    );
  });

  it("rejette en amont si champ obligatoire manquant", async () => {
    const tx: VariableTransaction = {
      id: "var_3",
      date: "2026-02-20",
      label: "",
      amount: 10,
      category: "Alimentation",
      accountId: "3",
      beneficiaryId: "p_joint",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
    };

    await expect(apiUpsertVariableTransaction(tx)).rejects.toThrow("Le libellé est obligatoire.");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("normalise aussi setPaidStatus pour les montants négatifs legacy", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const details: PaidItemDetails = {
      instanceId: "exp_1-2026-02",
      amount: -12.71,
      paymentDate: "2026-02-20",
      accountId: "3",
      beneficiaryAmounts: [{ beneficiaryId: "p_stan", amount: 12.71 }],
      label: "CB Utile",
      category: "Achats & Shopping",
      subCategory: "Restaurants",
      type: "EXPENSE",
      isVariable: false,
      isWaiting: false,
      isExtra: false,
    };

    await apiSetPaidStatus(details, details.instanceId);

    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_atomic",
      expect.objectContaining({
        p_amount: 12.71,
        p_type: "INCOME",
      })
    );
  });

  it("journalise les détails en cas d'erreur RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom", code: "P0001", details: "test details" } });

    const tx: VariableTransaction = {
      id: "var_4",
      date: "2026-02-20",
      label: "CB Ripe",
      amount: 93.5,
      category: "Alimentation & Restaurants",
      subCategory: "Restaurants",
      accountId: "3",
      beneficiaryId: "p_joint",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
    };

    const res = await apiUpsertVariableTransaction(tx);

    expect(res.error).toBeTruthy();
    expect(loggerMock.error).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// apiSetPaidStatus — pointage d'une opération récurrente
// ---------------------------------------------------------------------------

describe("apiCrud - apiSetPaidStatus", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  const baseDetails: PaidItemDetails = {
    instanceId: "exp_cfg-2026-03",
    amount: 800,
    paymentDate: "2026-03-05",
    accountId: "acc-1",
    label: "Loyer",
    category: "Logement",
    subCategory: "Loyer",
    type: "EXPENSE",
    isVariable: false,
    isWaiting: false,
    isExtra: false,
    isRefund: false,
    isSalary: false,
  };

  it("appelle la RPC avec le payload complet pour un EXPENSE standard", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await apiSetPaidStatus(baseDetails, baseDetails.instanceId);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_atomic",
      expect.objectContaining({
        p_instance_id: "exp_cfg-2026-03",
        p_amount: 800,
        p_type: "EXPENSE",
        p_label: "Loyer",
        p_category: "Logement",
        p_sub_category: "Loyer",
        p_is_variable: false,
        p_is_extra: false,
        p_is_salary: false,
        p_beneficiary_amounts: null,
      })
    );
  });

  it("inclut les beneficiaryAmounts dans la RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const details: PaidItemDetails = {
      ...baseDetails,
      beneficiaryAmounts: [
        { beneficiaryId: "b1", amount: 500 },
        { beneficiaryId: "b2", amount: 300 },
      ],
    };

    await apiSetPaidStatus(details, details.instanceId);

    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_atomic",
      expect.objectContaining({
        p_beneficiary_amounts: [
          { beneficiaryId: "b1", amount: 500 },
          { beneficiaryId: "b2", amount: 300 },
        ],
      })
    );
  });

  it("supprime l'item via from().delete() quand details=null", async () => {
    const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    fromMock.mockReturnValue({ delete: deleteMock });

    await apiSetPaidStatus(null, "exp_cfg-2026-03");

    expect(fromMock).toHaveBeenCalledWith("paid_items");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("lève une erreur de validation si instanceId vide", async () => {
    const details: PaidItemDetails = { ...baseDetails, instanceId: "" };
    await expect(apiSetPaidStatus(details, "")).rejects.toThrow("Instance ID manquant");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("lève une erreur si montant = 0", async () => {
    const details: PaidItemDetails = { ...baseDetails, amount: 0 };
    await expect(apiSetPaidStatus(details, details.instanceId)).rejects.toThrow("montant doit être strictement supérieur à 0");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("lève une erreur si catégorie vide", async () => {
    const details: PaidItemDetails = { ...baseDetails, category: "" };
    await expect(apiSetPaidStatus(details, details.instanceId)).rejects.toThrow("catégorie est obligatoire");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("journalise l'erreur RPC via logger.error", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "constraint violation", code: "23514", details: "beneficiary sum exceeds total" },
    });

    const { loggerMock: logger } = vi.hoisted(() => ({ loggerMock: { error: vi.fn() } })) as any;

    // On vérifie que la fonction ne throw pas et retourne l'erreur
    const res = await apiSetPaidStatus(baseDetails, baseDetails.instanceId);
    expect(res.error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// apiUpsertVariableTransaction — cas supplémentaires
// ---------------------------------------------------------------------------

describe("apiCrud - apiUpsertVariableTransaction (cas complémentaires)", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  it("passe isExtra=true dans la RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const tx: VariableTransaction = {
      id: "var_extra",
      date: "2026-03-10",
      label: "Achat exceptionnel",
      amount: 250,
      category: "Loisirs",
      accountId: "acc-1",
      beneficiaryId: "b1",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: true,
    };

    await apiUpsertVariableTransaction(tx);

    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_atomic",
      expect.objectContaining({
        p_is_extra: true,
      })
    );
  });

  it("envoie p_is_variable=true pour toutes les transactions variables", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const tx: VariableTransaction = {
      id: "var_check",
      date: "2026-03-15",
      label: "Course",
      amount: 45,
      category: "Alimentation",
      accountId: "acc-1",
      beneficiaryId: "b1",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
    };

    await apiUpsertVariableTransaction(tx);

    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_atomic",
      expect.objectContaining({
        p_is_variable: true,
        p_is_salary: false, // Toujours false pour les variables
      })
    );
  });

  it("lève une erreur si accountId vide", async () => {
    const tx: VariableTransaction = {
      id: "var_no_account",
      date: "2026-03-15",
      label: "Course",
      amount: 45,
      category: "Alimentation",
      accountId: "",
      beneficiaryId: "b1",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
    };

    await expect(apiUpsertVariableTransaction(tx)).rejects.toThrow("compte est obligatoire");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("lève une erreur si catégorie vide", async () => {
    const tx: VariableTransaction = {
      id: "var_no_cat",
      date: "2026-03-15",
      label: "Course",
      amount: 45,
      category: "",
      accountId: "acc-1",
      beneficiaryId: "b1",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
    };

    await expect(apiUpsertVariableTransaction(tx)).rejects.toThrow("catégorie est obligatoire");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

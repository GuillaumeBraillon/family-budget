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

describe("apiCrud - RPC upsert_paid_item_with_tags", () => {
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
      "upsert_paid_item_with_tags",
      expect.objectContaining({
        p_instance_id: "var_1",
        p_amount: 42.5,
        p_type: "INCOME",
      })
    );
  });

  it("filtre les tagAmounts invalides avant envoi RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const tx: VariableTransaction = {
      id: "var_2",
      date: "2026-02-20",
      label: "Courses",
      amount: 100,
      category: "Alimentation",
      accountId: "3",
      beneficiaryId: "p_joint",
      type: "EXPENSE",
      isWaiting: false,
      isExtra: false,
      tagAmounts: [
        { tagId: "tag_ok", amount: 30, isExtra: true },
        { tagId: "", amount: 10 },
        { tagId: "tag_zero", amount: 0 },
        { tagId: "tag_neg", amount: -5 },
        { tagId: "tag_nan", amount: Number.NaN },
      ],
    };

    await apiUpsertVariableTransaction(tx);

    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_paid_item_with_tags",
      expect.objectContaining({
        p_tag_amounts: [{ tagId: "tag_ok", amount: 30, isExtra: true }],
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
      beneficiaryAmounts: [{ beneficiaryId: "p_persona", amount: 12.71 }],
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
      "upsert_paid_item_with_tags",
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

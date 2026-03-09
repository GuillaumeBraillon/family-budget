import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOperationsData } from "../hooks/operations/useOperationsData";
import { usePlanner } from "../hooks/usePlanner";
import { Account, AccountType, AppSettings, CategoryDef, OperationFilters, PlannedItem } from "../types";

vi.mock("../hooks/usePlanner", () => ({
  usePlanner: vi.fn(),
}));

const mockedUsePlanner = vi.mocked(usePlanner);

const defaultFilters: OperationFilters = {
  flux: "ALL",
  source: "ALL",
  status: "ALL",
  nature: "ALL",
  transfer: "EXCLUDE",
  salary: "EXCLUDE",
  accountIds: [],
  beneficiaryIds: [],
  includedTagIds: [],
  excludedTagIds: [],
  tagPresence: "ALL",
};

const accounts: Account[] = [
  {
    id: "acc-1",
    name: "Compte courant",
    type: AccountType.CHECKING,
    ownerId: "p-guillaume",
    currentBalance: 0,
    isJoint: false,
  },
];

const categories: CategoryDef[] = [];

const createItem = (): PlannedItem => ({
  type: "EXPENSE",
  source: "VARIABLE",
  configId: "cfg-1",
  instanceId: "tx-1",
  day: 10,
  label: "Courses",
  amount: 12.1,
  originalAmount: 12.1,
  isPaid: true,
  isWaiting: false,
  category: "Courses",
  beneficiaryId: "p-guillaume",
  beneficiaryAmounts: [
    { beneficiaryId: "p-guillaume", amount: 8 },
    { beneficiaryId: "p-nelly", amount: 4.1 },
  ],
  isExtra: false,
  isExtraGlobal: false,
  accountId: "acc-1",
});

describe("useOperationsData - ventilation bénéficiaires", () => {
  beforeEach(() => {
    mockedUsePlanner.mockReset();
    mockedUsePlanner.mockReturnValue({
      filteredPeriodBudgets: [
        {
          weekNumber: 1,
          label: "P1",
          startDate: 1,
          endDate: 31,
          items: [createItem()],
        },
      ],
    } as any);
  });

  it("calcule les quickStats en fonction de la part du bénéficiaire filtré", () => {
    const { result: guillaumeResult } = renderHook(() =>
      useOperationsData({
        accounts,
        configs: [],
        incomeConfigs: [],
        paidItems: {},
        variableTransactions: [],
        currentDate: new Date("2026-03-01"),
        searchQuery: "",
        settings: {} as AppSettings,
        categories,
        filters: { ...defaultFilters, beneficiaryIds: ["p-guillaume"] },
        scope: "MONTH",
        activeWeek: 1,
      })
    );

    const { result: nellyResult } = renderHook(() =>
      useOperationsData({
        accounts,
        configs: [],
        incomeConfigs: [],
        paidItems: {},
        variableTransactions: [],
        currentDate: new Date("2026-03-01"),
        searchQuery: "",
        settings: {} as AppSettings,
        categories,
        filters: { ...defaultFilters, beneficiaryIds: ["p-nelly"] },
        scope: "MONTH",
        activeWeek: 1,
      })
    );

    expect(guillaumeResult.current.quickStats.expenses.real).toBeCloseTo(8, 5);
    expect(nellyResult.current.quickStats.expenses.real).toBeCloseTo(4.1, 5);
  });
});

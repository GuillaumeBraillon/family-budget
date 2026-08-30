import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlanner } from "../hooks/usePlanner";
import { AppSettings, CategoryDef, ExpenseConfig, IncomeConfig, OperationFilters, PaidItemDetails, VariableTransaction } from "../types";

const settings: AppSettings = {
  period_type: "FIXED_DAYS",
  period_value: 31,
  operations_sorting: [],
  accounts_sorting: [],
};

const categories: CategoryDef[] = [
  {
    id: "cat-logement",
    name: "Logement",
    type: "EXPENSE",
    subCategories: [],
  },
];

const defaultFilters: OperationFilters = {
  flux: "ALL",
  source: "ALL",
  status: "ALL",
  nature: "ALL",
  salary: "ALL",
  accountIds: [],
  isAccountFilterActive: false,
  beneficiaryIds: [],
  isBeneficiaryFilterActive: false,
  includedCategoryIds: [],
  isCategoryFilterActive: false,
  includedSubCategoryIds: [],
  isSubCategoryFilterActive: false,
  projectFilterMode: "ALL",
  includedProjectIds: [],
  isProjectFilterActive: false,
};

const createVariableTransaction = (id: string, projectId?: string): VariableTransaction => ({
  id,
  date: "2026-06-10",
  label: id,
  amount: 25,
  category: "Logement",
  accountId: "acc-1",
  beneficiaryId: "pers-1",
  type: "EXPENSE",
  isWaiting: false,
  isExtra: false,
  projectId,
});

const getFilteredLabels = (filters: OperationFilters) => {
  const transactions = [createVariableTransaction("sans-projet"), createVariableTransaction("projet-a", "project-a"), createVariableTransaction("projet-b", "project-b")];

  const { result } = renderHook(() =>
    usePlanner(
      [] as ExpenseConfig[],
      [] as IncomeConfig[],
      {} as Record<string, PaidItemDetails>,
      transactions,
      new Date("2026-06-01"),
      "",
      settings,
      categories,
      filters
    )
  );

  return result.current.filteredPeriodBudgets.flatMap((period) => period.items).map((item) => item.label);
};

describe("usePlanner - paid_items orphelins", () => {
  it("garde visible un paid_item récurrent si la config a été supprimée", () => {
    const paidItems: Record<string, PaidItemDetails> = {
      "cfg-loyer-2026-06": {
        instanceId: "cfg-loyer-2026-06",
        amount: 850,
        paymentDate: "2026-06-05",
        accountId: "acc-1",
        label: "Loyer",
        category: "Logement",
        type: "EXPENSE",
        isVariable: false,
        isWaiting: false,
        isExtra: false,
      },
    };

    const { result } = renderHook(() =>
      usePlanner([] as ExpenseConfig[], [] as IncomeConfig[], paidItems, [] as VariableTransaction[], new Date("2026-06-01"), "", settings, categories)
    );

    const allItems = result.current.filteredPeriodBudgets.flatMap((period) => period.items);
    const item = allItems.find((planned) => planned.instanceId === "cfg-loyer-2026-06");

    expect(item).toBeDefined();
    expect(item?.source).toBe("RECURRING");
    expect(item?.isPaid).toBe(true);
    expect(item?.amount).toBe(850);
  });

  it("n'ajoute pas de doublon quand la config récurrente existe", () => {
    const configs: ExpenseConfig[] = [
      {
        id: "cfg-loyer",
        label: "Loyer",
        amount: 850,
        category: "Logement",
        beneficiaryId: "pers-1",
        accountId: "acc-1",
        dayOfMonth: 5,
      },
    ];

    const paidItems: Record<string, PaidItemDetails> = {
      "cfg-loyer-2026-06": {
        instanceId: "cfg-loyer-2026-06",
        amount: 850,
        paymentDate: "2026-06-05",
        accountId: "acc-1",
        label: "Loyer",
        category: "Logement",
        type: "EXPENSE",
        isVariable: false,
        isWaiting: false,
        isExtra: false,
      },
    };

    const { result } = renderHook(() =>
      usePlanner(configs, [] as IncomeConfig[], paidItems, [] as VariableTransaction[], new Date("2026-06-01"), "", settings, categories)
    );

    const items = result.current.filteredPeriodBudgets.flatMap((period) => period.items).filter((planned) => planned.instanceId === "cfg-loyer-2026-06");

    expect(items).toHaveLength(1);
  });
});

describe("usePlanner - filtre projets", () => {
  it("affiche toutes les opérations quand projectFilterMode vaut ALL", () => {
    expect(getFilteredLabels({ ...defaultFilters, projectFilterMode: "ALL" }).sort()).toEqual(["projet-a", "projet-b", "sans-projet"]);
  });

  it("affiche uniquement les opérations liées à un projet", () => {
    expect(getFilteredLabels({ ...defaultFilters, projectFilterMode: "WITH_PROJECT", isProjectFilterActive: true }).sort()).toEqual(["projet-a", "projet-b"]);
  });

  it("affiche uniquement les opérations sans projet", () => {
    expect(getFilteredLabels({ ...defaultFilters, projectFilterMode: "WITHOUT_PROJECT", isProjectFilterActive: true })).toEqual(["sans-projet"]);
  });

  it("affiche uniquement les projets sélectionnés", () => {
    expect(
      getFilteredLabels({
        ...defaultFilters,
        projectFilterMode: "SELECTED",
        includedProjectIds: ["project-b"],
        isProjectFilterActive: true,
      })
    ).toEqual(["projet-b"]);
  });
});

import React, { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { ListSorter, SortOrder, SortOption } from "../../../ui/molecules/ListSorter";
import { FilterDropdown, FilterOption } from "../../../ui/molecules/FilterDropdown";
import { useAdminView } from "@/contexts/AdminViewContext";
import { useAuth } from "@/hooks/useAuth";
import { useBudget } from "@/hooks/useBudget";
import { Account, AccountType, CategoryDef, ExpenseConfig, IncomeConfig, PaidItemDetails, VariableTransaction, OperationFilters, Person } from "@/types";
import { MonthSelector } from "./MonthSelector";

interface SubCategoryMatrixRow {
  id: string;
  name: string;
  months: number[];
  yearTotal: number;
}

interface CategoryMatrixRow {
  id: string;
  name: string;
  type: CategoryDef["type"];
  months: number[];
  yearTotal: number;
  subCategories: Record<string, SubCategoryMatrixRow>;
  hasData: boolean;
}

interface SavingsByCategoryCardProps {
  accounts: Account[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  categories: CategoryDef[];
  people: Person[];
  year: number;
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
  onYearChange: (year: number) => void;
}

const formatAmount = (amount: number) => `${amount.toFixed(2)} €`;

const getMonthName = (monthIndex: number) => {
  return new Date(2000, monthIndex, 1).toLocaleString("fr-FR", { month: "long" });
};

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nom alphabétique" },
  { key: "amount", label: "Montant (Annuel)" },
];

const FLUX_OPTIONS: FilterOption[] = [
  { id: "ALL", label: "Tous les flux" },
  { id: "INCOME", label: "Revenus uniquement" },
  { id: "EXPENSE", label: "Dépenses uniquement" },
];

export const SavingsByCategoryCard: React.FC<SavingsByCategoryCardProps> = ({
  accounts,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  categories,
  people,
  year,
  onNavigateToPlanner,
  onYearChange,
}) => {
  const { user } = useAuth();
  const { authorizedUsers } = useBudget();
  const { viewAsNonAdmin } = useAdminView();
  const currentEmail = user?.email;
  const actualIsAdmin = !!authorizedUsers.find((u) => u.email === currentEmail && !!u.isAdmin);
  const isAdmin = actualIsAdmin && !viewAsNonAdmin;

  const [sortKey, setSortKey] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [fluxFilter, setFluxFilter] = useState<OperationFilters["flux"]>("ALL");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);

  const checkingAccountIds = useMemo(() => accounts.filter((account) => account.type === AccountType.CHECKING).map((account) => account.id), [accounts]);

  const targetMonthForYearTotal = useMemo(() => {
    const today = new Date();
    if (today.getFullYear() === year) {
      return new Date(year, today.getMonth(), 1);
    }
    return new Date(year, 11, 1);
  }, [year]);

  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);

  const accountOptions = useMemo<FilterOption[]>(() => {
    return accounts
      .filter((acc) => checkingAccountIds.includes(acc.id))
      .map((acc) => ({ id: acc.id, label: acc.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [accounts, checkingAccountIds]);

  const activeMonthsFlags = useMemo(() => {
    const flags = new Array(12).fill(false);
    variableTransactions.forEach((t) => {
      if (!checkingAccountIds.includes(t.accountId) || t.isWaiting || t.category === "Virement Interne") return;
      const d = new Date(t.date);
      if (d.getFullYear() === year) flags[d.getMonth()] = true;
    });
    for (let m = 0; m < 12; m++) {
      const monthKey = `${year}-${String(m + 1).padStart(2, "0")}`;
      const hasIncome = incomeConfigs.some((c) => {
        if (!checkingAccountIds.includes(c.accountId)) return false;
        if (c.startMonth && monthKey < c.startMonth) return false;
        if (c.endMonth && monthKey > c.endMonth) return false;
        return paidItems[`${c.id}-${monthKey}`] && !paidItems[`${c.id}-${monthKey}`].isWaiting;
      });
      const hasExpense = configs.some((c) => {
        if (!checkingAccountIds.includes(c.accountId)) return false;
        if (c.startMonth && monthKey < c.startMonth) return false;
        if (c.endMonth && monthKey > c.endMonth) return false;
        return paidItems[`${c.id}-${monthKey}`] && !paidItems[`${c.id}-${monthKey}`].isWaiting;
      });
      if (hasIncome || hasExpense) flags[m] = true;
    }
    return flags;
  }, [variableTransactions, incomeConfigs, configs, checkingAccountIds, year, paidItems]);

  const { filteredRows, categoryOptions, beneficiaryOptions } = useMemo(() => {
    const categoryByName = new Map(categories.map((c) => [c.name, c]));
    const subCategoryLookup = new Map<string, string>();

    categories.forEach((cat) => {
      const subs = cat.subCategories || [];
      subs.forEach((sub) => {
        if (sub.id && sub.name) {
          subCategoryLookup.set(`${cat.id}:${sub.name.toLowerCase().trim()}`, sub.id);
        }
      });
    });

    const matrix = new Map<string, CategoryMatrixRow>();
    const uniqueBeneficiaryIds = new Set<string>();

    const getCategoryRow = (categoryName: string, fallbackType: CategoryDef["type"]): CategoryMatrixRow => {
      const category = categoryByName.get(categoryName);
      const id = category?.id ?? `unknown-${categoryName}`;
      let row = matrix.get(id);

      if (!row) {
        row = {
          id,
          name: category?.name ?? categoryName,
          type: category?.type ?? fallbackType,
          months: new Array(12).fill(0),
          yearTotal: 0,
          subCategories: {},
          hasData: false,
        };
        matrix.set(id, row);
      }
      return row;
    };

    const addValues = (
      monthIndex: number,
      categoryName: string,
      subCategoryName: string | undefined,
      type: "INCOME" | "EXPENSE",
      amount: number,
      accountId: string,
      beneficiaryId: string | undefined
    ) => {
      if (fluxFilter !== "ALL" && fluxFilter !== type) return;

      if (beneficiaryId) {
        uniqueBeneficiaryIds.add(beneficiaryId);
      }

      if (selectedAccountIds.length > 0 && !selectedAccountIds.includes(accountId)) return;
      if (selectedBeneficiaryIds.length > 0 && (!beneficiaryId || !selectedBeneficiaryIds.includes(beneficiaryId))) return;

      const row = getCategoryRow(categoryName, type);
      const subName = subCategoryName?.trim() || "Non spécifié";
      const lookupKey = `${row.id}:${subName.toLowerCase()}`;
      const subCategoryId = subCategoryLookup.get(lookupKey) ?? `unknown-${subName}`;

      if (!row.subCategories[subCategoryId]) {
        row.subCategories[subCategoryId] = {
          id: subCategoryId,
          name: subName,
          months: new Array(12).fill(0),
          yearTotal: 0,
        };
      }

      row.months[monthIndex] += amount;
      row.yearTotal += amount;
      row.subCategories[subCategoryId].months[monthIndex] += amount;
      row.subCategories[subCategoryId].yearTotal += amount;
    };

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

      incomeConfigs.forEach((incomeConfig) => {
        if (!checkingAccountIds.includes(incomeConfig.accountId)) return;
        if (incomeConfig.startMonth && monthKey < incomeConfig.startMonth) return;
        if (incomeConfig.endMonth && monthKey > incomeConfig.endMonth) return;

        const paid = paidItems[`${incomeConfig.id}-${monthKey}`];
        if (!paid || paid.isWaiting) return;

        const categoryName = paid.category || incomeConfig.category;
        const category = categoryByName.get(categoryName);
        const subCategory = paid.subCategory || incomeConfig.subCategory;

        const paidBeneficiaryId = paid.beneficiaryAmounts && paid.beneficiaryAmounts.length > 0 ? paid.beneficiaryAmounts[0].beneficiaryId : undefined;
        const bId = paidBeneficiaryId || incomeConfig.beneficiaryId;

        if (paid.type === "EXPENSE" || category?.type === "EXPENSE" || paid.isRefund) {
          addValues(monthIndex, categoryName, subCategory, "EXPENSE", -paid.amount, incomeConfig.accountId, bId);
        } else {
          addValues(monthIndex, categoryName, subCategory, "INCOME", paid.amount, incomeConfig.accountId, bId);
        }
      });

      configs.forEach((expenseConfig) => {
        if (!checkingAccountIds.includes(expenseConfig.accountId)) return;
        if (expenseConfig.startMonth && monthKey < expenseConfig.startMonth) return;
        if (expenseConfig.endMonth && monthKey > expenseConfig.endMonth) return;

        const paid = paidItems[`${expenseConfig.id}-${monthKey}`];
        if (!paid || paid.isWaiting) return;

        const categoryName = paid.category || expenseConfig.category;
        const subCategory = paid.subCategory || expenseConfig.subCategory;

        const paidBeneficiaryId = paid.beneficiaryAmounts && paid.beneficiaryAmounts.length > 0 ? paid.beneficiaryAmounts[0].beneficiaryId : undefined;
        const bId = paidBeneficiaryId || expenseConfig.beneficiaryId;

        addValues(monthIndex, categoryName, subCategory, "EXPENSE", paid.amount, expenseConfig.accountId, bId);
      });
    }

    variableTransactions.forEach((transaction) => {
      if (!checkingAccountIds.includes(transaction.accountId)) return;
      if (transaction.isWaiting) return;
      if (transaction.category === "Virement Interne") return;

      const date = new Date(transaction.date);
      if (date.getFullYear() !== year) return;

      const monthIndex = date.getMonth();
      const category = categoryByName.get(transaction.category);
      const subCategory = transaction.subCategory;
      const bId = transaction.beneficiaryId;

      if (transaction.type === "EXPENSE") {
        addValues(monthIndex, transaction.category, subCategory, "EXPENSE", transaction.amount, transaction.accountId, bId);
      } else if (category?.type === "EXPENSE" || transaction.isRefund) {
        addValues(monthIndex, transaction.category, subCategory, "EXPENSE", -transaction.amount, transaction.accountId, bId);
      } else {
        addValues(monthIndex, transaction.category, subCategory, "INCOME", transaction.amount, transaction.accountId, bId);
      }
    });

    const allComputedRows = Array.from(matrix.values())
      .map((row) => {
        const hasData = row.months.some((m) => Math.abs(m) > 0.005);
        return { ...row, hasData };
      })
      .filter((row) => row.hasData);

    const catOptions: FilterOption[] = allComputedRows.map((r) => ({ id: r.id, label: r.name })).sort((a, b) => a.label.localeCompare(b.label));

    const benefOptions: FilterOption[] = Array.from(uniqueBeneficiaryIds)
      .map((id) => ({
        id,
        label: peopleMap.get(id) || `Bénéficiaire Inconnu (${id})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const filtered = allComputedRows.filter((row) => {
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(row.id)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const comparison = sortKey === "amount" ? Math.abs(a.yearTotal) - Math.abs(b.yearTotal) : a.name.localeCompare(b.name);

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return { filteredRows: filtered, categoryOptions: catOptions, beneficiaryOptions: benefOptions };
  }, [
    categories,
    checkingAccountIds,
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    year,
    sortKey,
    sortOrder,
    fluxFilter,
    selectedCategoryIds,
    selectedAccountIds,
    selectedBeneficiaryIds,
    peopleMap,
  ]);

  if (!isAdmin) return null;

  const activeMonthIndexes = activeMonthsFlags.map((isActive, index) => (isActive ? index : -1)).filter((index) => index !== -1);

  const makeFilters = (flux: "INCOME" | "EXPENSE", categoryId: string, subCategoryId?: string): Partial<OperationFilters> => {
    const hasValidSubCategory = subCategoryId && !subCategoryId.startsWith("unknown-");
    return {
      flux,
      status: "REAL",
      source: "ALL",
      nature: "ALL",
      salary: "ALL",
      isCategoryFilterActive: true,
      includedCategoryIds: [categoryId],
      isSubCategoryFilterActive: !!hasValidSubCategory,
      includedSubCategoryIds: hasValidSubCategory ? [subCategoryId] : [],
    };
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">Analyse Matricielle Détaillée</CardTitle>
          <MonthSelector year={year} onYearChange={onYearChange} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Flux"
            icon={<Filter size={13} />}
            options={FLUX_OPTIONS}
            selectedValues={[fluxFilter]}
            onChange={(vals) => setFluxFilter((vals[vals.length - 1] as OperationFilters["flux"]) || "ALL")}
            singleSelect={true}
            color="indigo"
          />

          <FilterDropdown
            label="Catégories"
            icon={<Filter size={13} />}
            options={categoryOptions}
            selectedValues={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            onClear={() => setSelectedCategoryIds([])}
            color="indigo"
          />

          <FilterDropdown
            label="Bénéficiaires"
            icon={<Filter size={13} />}
            options={beneficiaryOptions}
            selectedValues={selectedBeneficiaryIds}
            onChange={setSelectedBeneficiaryIds}
            onClear={() => setSelectedBeneficiaryIds([])}
            color="indigo"
          />

          <FilterDropdown
            label="Comptes"
            icon={<Filter size={13} />}
            options={accountOptions}
            selectedValues={selectedAccountIds}
            onChange={setSelectedAccountIds}
            onClear={() => setSelectedAccountIds([])}
            color="indigo"
          />

          <ListSorter
            options={SORT_OPTIONS}
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSortChange={(key, order) => {
              setSortKey(key);
              setSortOrder(order);
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 bg-slate-100 font-bold text-slate-700 border-r border-slate-200 min-w-[220px]">Catégorie / Sous-Catégorie</th>
              {activeMonthIndexes.map((mIndex) => (
                <th key={`m-${mIndex}`} className="px-3 py-3 text-right font-bold text-slate-700 bg-slate-100/70 border-r border-slate-200 capitalize">
                  {getMonthName(mIndex)}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-black text-slate-800 bg-slate-200/60 border-l-2 border-slate-300">Total Annuel</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={1 + activeMonthIndexes.length + 1} className="px-4 py-8 text-center text-slate-400 italic">
                  Aucune donnée disponible avec les filtres sélectionnés.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isIncome = row.type === "INCOME";
                const colorClass = isIncome ? "text-emerald-700 font-bold" : "text-rose-700 font-bold";
                const headerColorClass = isIncome ? "text-emerald-900 font-black" : "text-rose-900 font-black";

                return (
                  <React.Fragment key={row.id}>
                    <tr className="bg-slate-50/60 font-bold transition-colors group border-t border-slate-200">
                      <td className="px-4 py-3 border-r border-slate-200 text-slate-900 bg-slate-50 group-hover:bg-slate-100">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{row.name}</span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{isIncome ? "Revenus" : "Dépenses"}</span>
                        </div>
                      </td>
                      {activeMonthIndexes.map((mIndex) => {
                        const amount = row.months[mIndex];
                        const cellDate = new Date(year, mIndex, 1);
                        return (
                          <td key={`p-cell-${row.id}-${mIndex}`} className={`px-3 py-3 text-right border-r border-slate-200 ${colorClass}`}>
                            {amount !== 0 ? (
                              <ClickableAmount date={cellDate} filters={makeFilters(row.type, row.id)} onNavigate={onNavigateToPlanner}>
                                {formatAmount(amount)}
                              </ClickableAmount>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                      <td className={`px-4 py-3 text-right bg-slate-200/20 border-l-2 border-slate-300 ${headerColorClass}`}>
                        {row.yearTotal !== 0 ? (
                          <ClickableAmount date={targetMonthForYearTotal} filters={makeFilters(row.type, row.id)} onNavigate={onNavigateToPlanner}>
                            {formatAmount(row.yearTotal)}
                          </ClickableAmount>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>

                    {Object.values(row.subCategories).map((subCat) => {
                      const subColorClass = isIncome ? "text-emerald-600/90 font-medium" : "text-rose-600/90 font-medium";
                      const subTotalColorClass = isIncome ? "text-emerald-800 font-bold" : "text-rose-800 font-bold";

                      return (
                        <tr key={`sub-${row.id}-${subCat.id}`} className="hover:bg-slate-50/50 transition-colors group text-[11px]">
                          <td className="px-8 py-2 border-r border-slate-100 italic text-slate-600 bg-white">↳ {subCat.name}</td>
                          {activeMonthIndexes.map((mIndex) => {
                            const subAmount = subCat.months[mIndex];
                            const cellDate = new Date(year, mIndex, 1);
                            return (
                              <td
                                key={`sub-cell-${row.id}-${subCat.id}-${mIndex}`}
                                className={`px-3 py-2 text-right border-r border-slate-100 ${subColorClass}`}
                              >
                                {subAmount !== 0 ? (
                                  <ClickableAmount date={cellDate} filters={makeFilters(row.type, row.id, subCat.id)} onNavigate={onNavigateToPlanner}>
                                    {formatAmount(subAmount)}
                                  </ClickableAmount>
                                ) : (
                                  "-"
                                )}
                              </td>
                            );
                          })}
                          <td className={`px-4 py-2 text-right bg-slate-100/30 border-l-2 border-slate-200 ${subTotalColorClass}`}>
                            {subCat.yearTotal !== 0 ? (
                              <ClickableAmount
                                date={targetMonthForYearTotal}
                                filters={makeFilters(row.type, row.id, subCat.id)}
                                onNavigate={onNavigateToPlanner}
                              >
                                {formatAmount(subCat.yearTotal)}
                              </ClickableAmount>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

import { useMemo } from "react";
import { usePlanner } from "../usePlanner";
import {
  Account,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  VariableTransaction,
  AppSettings,
  CategoryDef,
  Person,
  WeeklyBudget,
  FamilyVariableNetBreakdown,
  FamilyVariablePeriodCarryovers,
  BalancesStats,
  NameAmountDetail,
  ConsumedDetail,
  AllowanceContext,
} from "../../types";
import { getFamilyBeneficiaryIds } from "../../services/financeUtils";
import { useAllowanceContext } from "./useAllowanceContext";
import useFamilyVariableBudget, {
  calculateFamilyVariableNet,
  calculateFamilyVariableNetBreakdown,
  calculateFamilyVariablePeriodCarryover,
  calculateFamilyVariableBudgetTotal,
  calculateFamilyVariableMonthlyCarryover,
} from "./useFamilyVariableBudget";
import { usePersonalConsumption } from "./usePersonalConsumption";
import useBalancesDetails from "./useBalancesDetails";

export interface UseBalancesDataReturn {
  periodCarryovers: FamilyVariablePeriodCarryovers;
  totalPersonalBudgetAmount: number;
  familyBeneficiaryIds: string[];
  familyVariableBudgetTotalAmount: number;
  familyVariableMonthBudgetAmount: number;
  familyVariablePeriodsCount: number;
  familyVariablePeriodValue: number | undefined;
  familyVariableNetAmount: number;
  familyVariableNetBreakdown: FamilyVariableNetBreakdown;
  familyVariableBudgetRemainingAmount: number;
  totalPendingRecurringAmount: number;
  paidRecurringAmount: number;
  paidRecurringNetAmount: number;
  totalRecurringAmount: number;
  personalBudgetConsumedAmount: number;
  totalPersonalRemainingAmount: number;
  checkingAccounts: Account[];
  jointAccount: Account | undefined;
  personalAccounts: Account[];
  totalPersonalBalanceAmount: number;
  pendingVariableDetails: NameAmountDetail[];
  pendingRecurringDetails: NameAmountDetail[];
  totalDebtDetails: NameAmountDetail[];
  consumedDetails: ConsumedDetail[];
  stats: BalancesStats;
  filteredPeriodBudgets: WeeklyBudget[];
  allowanceContext: AllowanceContext;
}

interface UseBalancesDataParams {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  categories: CategoryDef[];
  currentDate: Date;
  scope: "MONTH" | "PERIOD";
  activeWeek: number;
}

export const useBalancesData = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  settings,
  categories,
  currentDate,
  scope,
  activeWeek,
}: UseBalancesDataParams): UseBalancesDataReturn => {
  const personalBeneficiaryIds = useMemo(() => {
    const nonChildIds = new Set(people.filter((person) => !person.isChild).map((person) => person.id));
    return Array.from(new Set(accounts.filter((account) => account.type === "COURANT" && !account.isJoint).map((account) => account.ownerId))).filter((id) =>
      nonChildIds.has(id)
    );
  }, [accounts, people]);

  const familyBeneficiaryIds = useMemo(() => getFamilyBeneficiaryIds(people), [people]);

  const { calculatePeriodStatistics, filteredPeriodBudgets } = usePlanner(
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    currentDate,
    "",
    settings,
    categories
  );

  const statsWeekNumber = scope === "MONTH" ? filteredPeriodBudgets.reduce((maxWeek, period) => Math.max(maxWeek, period.weekNumber), 1) : activeWeek;
  const stats = calculatePeriodStatistics(statsWeekNumber);

  const allowanceContext = useAllowanceContext({ currentDate, paidItems, personalBeneficiaryIds, settings, configs, incomeConfigs });

  const familyVariable = useFamilyVariableBudget({ filteredPeriodBudgets, familyBeneficiaryIds, settings, scope, activeWeek });

  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === "COURANT"), [accounts]);
  const jointAccount = checkingAccounts.find((a) => a.isJoint);
  const personalAccounts = checkingAccounts.filter((a) => !a.isJoint);

  const totalPersonalBalanceAmount = personalAccounts.reduce((total, account) => total + account.currentBalance, 0);

  const scopeItems = useMemo(() => filteredPeriodBudgets.flatMap((w) => w.items), [filteredPeriodBudgets]);

  const recurringExpensesScopeItems = useMemo(() => {
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    return relevantPeriods
      .flatMap((w) => w.items)
      .filter(
        (item) =>
          item.source === "RECURRING" && item.type === "EXPENSE" && item.category !== "Virement Interne" && item.subCategory !== "Intérêts" && !item.isSalary
      );
  }, [filteredPeriodBudgets, scope, activeWeek]);

  const paidRecurringAmount = useMemo(
    () => recurringExpensesScopeItems.filter((item) => item.isPaid).reduce((sum, item) => sum + item.amount, 0),
    [recurringExpensesScopeItems]
  );

  const recurringNetScopeItems = useMemo(() => {
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    return relevantPeriods
      .flatMap((w) => w.items)
      .filter((item) => item.source === "RECURRING" && item.category !== "Virement Interne" && item.subCategory !== "Intérêts" && !item.isSalary);
  }, [filteredPeriodBudgets, scope, activeWeek]);

  const paidRecurringNetAmount = useMemo(
    () => recurringNetScopeItems.filter((item) => item.isPaid).reduce((sum, item) => sum + (item.type === "INCOME" ? -item.amount : item.amount), 0),
    [recurringNetScopeItems]
  );

  const totalRecurringAmount = useMemo(() => recurringExpensesScopeItems.reduce((sum, item) => sum + item.amount, 0), [recurringExpensesScopeItems]);

  const personalConsumption = usePersonalConsumption({ scopeItems, personalBeneficiaryIds, budgetPeriodeGlobal: allowanceContext.availableMonthlyAllowance });

  const details = useBalancesDetails({ checkingAccounts, filteredPeriodBudgets, stats, scope, activeWeek, people, personalBeneficiaryIds, allowanceContext });

  // Source de verite unique: reste total calcule a partir des restes par beneficiaire.
  const totalRemainingFromDetails = useMemo(() => details.consumedDetails.reduce((sum, detail) => sum + (detail.remaining ?? 0), 0), [details.consumedDetails]);

  return {
    periodCarryovers: familyVariable.periodCarryovers,
    totalPersonalBudgetAmount: allowanceContext.availableMonthlyAllowance,
    familyBeneficiaryIds,
    familyVariableBudgetTotalAmount: familyVariable.familyVariableBudgetTotalAmount,
    familyVariableMonthBudgetAmount: familyVariable.familyVariableMonthBudgetAmount,
    familyVariablePeriodsCount: familyVariable.familyVariablePeriodsCount,
    familyVariablePeriodValue: familyVariable.familyVariablePeriodValue,
    familyVariableNetAmount: familyVariable.familyVariableNetAmount,
    familyVariableNetBreakdown: familyVariable.familyVariableNetBreakdown,
    familyVariableBudgetRemainingAmount: familyVariable.familyVariableBudgetRemainingAmount,
    totalPendingRecurringAmount: stats.fixedToPay + stats.fixedDelays,
    paidRecurringAmount,
    paidRecurringNetAmount,
    totalRecurringAmount,
    personalBudgetConsumedAmount: personalConsumption.personalBudgetConsumedAmount,
    totalPersonalRemainingAmount: totalRemainingFromDetails,
    checkingAccounts,
    jointAccount,
    personalAccounts,
    totalPersonalBalanceAmount,
    pendingVariableDetails: details.pendingVariableDetails,
    pendingRecurringDetails: details.pendingRecurringDetails,
    totalDebtDetails: details.totalDebtDetails,
    consumedDetails: details.consumedDetails,
    stats,
    filteredPeriodBudgets,
    allowanceContext,
  };
};

// Re-export helpers for backward compatibility with tests
export {
  calculateFamilyVariableNet,
  calculateFamilyVariableNetBreakdown,
  calculateFamilyVariablePeriodCarryover,
  calculateFamilyVariableBudgetTotal,
  calculateFamilyVariableMonthlyCarryover,
};

export default useBalancesData;

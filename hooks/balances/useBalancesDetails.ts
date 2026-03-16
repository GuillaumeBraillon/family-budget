import { useMemo } from "react";
import { Account, Person, WeeklyBudget, BalancesStats, AllowanceContext, NameAmountDetail, ConsumedDetail } from "../../types";
import { isBudgetExcluded, getBeneficiaryStandardShare } from "../../services/financeUtils";

export interface UseBalancesDetailsReturn {
  pendingVariableDetails: NameAmountDetail[];
  pendingRecurringDetails: NameAmountDetail[];
  totalDebtDetails: NameAmountDetail[];
  consumedDetails: ConsumedDetail[];
}

interface Params {
  checkingAccounts: Account[];
  filteredPeriodBudgets: WeeklyBudget[];
  stats: BalancesStats;
  scope: "MONTH" | "PERIOD";
  activeWeek: number;
  people: Person[];
  personalBeneficiaryIds: string[];
  allowanceContext: AllowanceContext;
}

export const useBalancesDetails = ({
  checkingAccounts,
  filteredPeriodBudgets,
  stats,
  scope,
  activeWeek,
  people,
  personalBeneficiaryIds,
  allowanceContext,
}: Params): UseBalancesDetailsReturn => {
  const pendingVariableDetails = useMemo(() => {
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    return checkingAccounts
      .map((acc) => {
        const totalPending = relevantPeriods
          .flatMap((w) => w.items)
          .filter(
            (i) =>
              i.accountId === acc.id && i.source === "VARIABLE" && !i.isPaid && i.category !== "Virement Interne" && i.subCategory !== "Intérêts" && !i.isSalary
          )
          .reduce((total, item) => total + (item.type === "INCOME" ? -item.amount : item.amount), 0);

        return { name: acc.name, amount: totalPending };
      })
      .filter((x) => x.amount !== 0);
  }, [filteredPeriodBudgets, checkingAccounts, scope, activeWeek]);

  const pendingRecurringDetails = useMemo(() => {
    const relevantPeriods = scope === "MONTH" ? filteredPeriodBudgets : filteredPeriodBudgets.filter((w) => w.weekNumber <= activeWeek);

    const relevantItems = relevantPeriods
      .flatMap((w) => w.items)
      .filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne" && i.subCategory !== "Intérêts" && !i.isSalary);

    return checkingAccounts
      .map((acc) => {
        const amount = relevantItems
          .filter((i) => i.accountId === acc.id)
          .reduce((total, item) => total + (item.type === "INCOME" ? -item.amount : item.amount), 0);
        return { name: acc.name, amount };
      })
      .filter((x) => x.amount !== 0);
  }, [filteredPeriodBudgets, activeWeek, checkingAccounts, scope]);

  const totalDebtDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const remaining = stats.byAccount[acc.id]?.remaining || 0;
        return { name: acc.name, amount: remaining };
      })
      .filter((x) => x.amount > 0);
  }, [checkingAccounts, stats]);

  const consumedDetails = useMemo(() => {
    const relevantItems = filteredPeriodBudgets.flatMap((week) => week.items).filter((item) => !isBudgetExcluded(item));

    return personalBeneficiaryIds
      .map((beneficiaryId) => {
        const person = people.find((candidate) => candidate.id === beneficiaryId);
        if (!person) return null;

        const amount = relevantItems.reduce((total, item) => {
          if (item.type === "EXPENSE") {
            const share = getBeneficiaryStandardShare(item, beneficiaryId);
            return total + (share > 0 ? share : 0);
          }

          if (item.type === "INCOME" && !item.isSalary) {
            const share = getBeneficiaryStandardShare(item, beneficiaryId);
            return total - (share > 0 ? share : 0);
          }

          return total;
        }, 0);

        const available = allowanceContext.allowancePerBeneficiary + (allowanceContext.carryoverByBeneficiary[beneficiaryId] || 0);
        const remaining = available - amount;

        return { beneficiaryId, name: person.name, amount, available, remaining };
      })
      .filter((entry): entry is ConsumedDetail => !!entry);
  }, [filteredPeriodBudgets, people, personalBeneficiaryIds, allowanceContext.allowancePerBeneficiary, allowanceContext.carryoverByBeneficiary]);

  return { pendingVariableDetails, pendingRecurringDetails, totalDebtDetails, consumedDetails };
};

export default useBalancesDetails;

import { useMemo } from "react";
import { PlannedItem } from "../../types";
import { getBeneficiaryStandardShare, isBudgetExcluded } from "../../services/financeUtils";

export interface UsePersonalConsumptionReturn {
  variableItems: PlannedItem[];
  personalBudgetConsumedAmount: number;
  totalPersonalRemainingAmount: number;
}

interface Params {
  scopeItems: PlannedItem[];
  personalBeneficiaryIds: string[];
  budgetPeriodeGlobal: number;
}

export const usePersonalConsumption = ({ scopeItems, personalBeneficiaryIds, budgetPeriodeGlobal }: Params): UsePersonalConsumptionReturn => {
  const variableItems = useMemo(() => scopeItems.filter((i) => !isBudgetExcluded(i)), [scopeItems]);

  const personalBudgetConsumedAmount = useMemo(() => {
    return variableItems.reduce((total, item) => {
      const personalStandard = personalBeneficiaryIds.reduce((sum, id) => sum + getBeneficiaryStandardShare(item, id), 0);
      if (item.type === "EXPENSE") return total + personalStandard;
      if (item.type === "INCOME" && !item.isSalary) return total - personalStandard;
      return total;
    }, 0);
  }, [variableItems, personalBeneficiaryIds]);

  const totalPersonalRemainingAmount = budgetPeriodeGlobal - personalBudgetConsumedAmount;

  return {
    variableItems,
    personalBudgetConsumedAmount,
    totalPersonalRemainingAmount,
  };
};

export default usePersonalConsumption;

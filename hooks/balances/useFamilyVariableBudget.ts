import { useMemo } from "react";
import { PlannedItem, AppSettings, FamilyVariableNetBreakdown, FamilyVariablePeriodCarryovers, WeeklyBudget } from "../../types";
import { getBeneficiaryStandardShare, getBeneficiaryExtraShare, isBudgetExcluded } from "../../services/financeUtils";

export interface UseFamilyVariableBudgetReturn {
  familyVariableNetBreakdown: FamilyVariableNetBreakdown;
  familyVariableBudgetTotalAmount: number;
  familyVariableMonthBudgetAmount: number;
  familyVariableBudgetRemainingAmount: number;
  familyVariableNetAmount: number;
  periodCarryovers: FamilyVariablePeriodCarryovers;
  familyVariablePeriodsCount: number;
  familyVariablePeriodValue: number | undefined;
  familyVariableValuesByPeriod: Record<number, { budget: number; net: number; remaining: number }>;
  familyVariableNetBreakdownByPeriod: Record<number, FamilyVariableNetBreakdown>;
}

interface Params {
  filteredPeriodBudgets: WeeklyBudget[];
  familyBeneficiaryIds: string[];
  settings: AppSettings;
  scope: "MONTH" | "PERIOD";
  activeWeek: number;
}

// Helpers (extracted from previous implementation)
export const calculateFamilyVariableNet = (items: PlannedItem[], familyBeneficiaryIds: string[]): number => {
  if (!familyBeneficiaryIds.length) return 0;
  const uniqueFamilyBeneficiaryIds = Array.from(new Set(familyBeneficiaryIds));

  return items.reduce((total, item) => {
    if (item.source !== "VARIABLE") return total;
    if (isBudgetExcluded(item)) return total;

    const standardFamilyShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryStandardShare(item, beneficiaryId), 0);
    const extraFamilyShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryExtraShare(item, beneficiaryId), 0);
    const totalFamilyShare = standardFamilyShare + extraFamilyShare;

    if (item.type === "EXPENSE") return total + totalFamilyShare;
    if (item.type === "INCOME") return total - totalFamilyShare;
    return total;
  }, 0);
};

export const calculateFamilyVariableNetBreakdown = (items: PlannedItem[], familyBeneficiaryIds: string[]): FamilyVariableNetBreakdown => {
  if (!familyBeneficiaryIds.length) {
    return {
      nature: { standard: 0, refunds: 0, extra: 0, total: 0 },
      status: { real: 0, waiting: 0, realStandard: 0, waitingStandard: 0, realExtra: 0, waitingExtra: 0 },
    };
  }

  const uniqueFamilyBeneficiaryIds = Array.from(new Set(familyBeneficiaryIds));

  let standard = 0;
  let extra = 0;
  let refundsStandard = 0;
  let refundsExtra = 0;
  let real = 0;
  let waiting = 0;
  let realStandard = 0;
  let waitingStandard = 0;
  let realExtra = 0;
  let waitingExtra = 0;

  items.forEach((item) => {
    if (item.source !== "VARIABLE") return;
    if (isBudgetExcluded(item)) return;

    const standardShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryStandardShare(item, beneficiaryId), 0);
    const extraShare = uniqueFamilyBeneficiaryIds.reduce((sum, beneficiaryId) => sum + getBeneficiaryExtraShare(item, beneficiaryId), 0);

    if (item.type === "EXPENSE") {
      const totalShare = standardShare + extraShare;
      standard += standardShare;
      extra += extraShare;

      if (item.isPaid) {
        real += totalShare;
        realStandard += standardShare;
        realExtra += extraShare;
      } else {
        waiting += totalShare;
        waitingStandard += standardShare;
        waitingExtra += extraShare;
      }
      return;
    }

    if (item.type === "INCOME") {
      const totalShare = standardShare + extraShare;
      standard -= standardShare;
      extra -= extraShare;

      if (item.isRefund) {
        refundsStandard += standardShare;
        refundsExtra += extraShare;
      }

      if (item.isPaid) {
        real -= totalShare;
        realStandard -= standardShare;
        realExtra -= extraShare;
      } else {
        waiting -= totalShare;
        waitingStandard -= standardShare;
        waitingExtra -= extraShare;
      }
      return;
    }
  });

  return {
    nature: {
      standard,
      refunds: refundsStandard + refundsExtra,
      extra,
      total: standard + extra,
    },
    status: {
      real,
      waiting,
      realStandard,
      waitingStandard,
      realExtra,
      waitingExtra,
    },
  };
};

export const calculateFamilyVariablePeriodCarryover = (
  monthlyBudget: number,
  openingCarryover: number,
  periodSpents: number[]
): FamilyVariablePeriodCarryovers => {
  const totalPeriods = periodSpents.length;
  if (totalPeriods <= 0) {
    return {
      periodBudgets: [],
      periodRemaining: [],
      monthBudget: monthlyBudget + openingCarryover,
      monthSpent: 0,
      monthRemaining: monthlyBudget + openingCarryover,
    };
  }

  const periodBaseBudget = totalPeriods > 0 ? monthlyBudget / totalPeriods : 0;
  let carryover = openingCarryover;

  const periodBudgets: number[] = [];
  const periodRemaining: number[] = [];

  periodSpents.forEach((spent) => {
    const periodBudget = periodBaseBudget + carryover;
    const remaining = periodBudget - spent;

    periodBudgets.push(periodBudget);
    periodRemaining.push(remaining);

    carryover = remaining;
  });

  const monthSpent = periodSpents.reduce((sum, spent) => sum + spent, 0);
  const monthBudget = monthlyBudget + openingCarryover;
  const monthRemaining = monthBudget - monthSpent;

  return {
    periodBudgets,
    periodRemaining,
    monthBudget,
    monthSpent,
    monthRemaining,
  };
};

export const calculateFamilyVariableBudgetTotal = (monthlyBudget: number, totalPeriodsInMonth: number, periodsInScopeCount: number): number => {
  if (monthlyBudget <= 0) return 0;
  if (totalPeriodsInMonth <= 0) return 0;
  if (periodsInScopeCount <= 0) return 0;

  return (monthlyBudget / totalPeriodsInMonth) * periodsInScopeCount;
};

export const calculateFamilyVariableMonthlyCarryover = (monthlyBudget: number, previousMonthSpents: number[]): number => {
  if (previousMonthSpents.length === 0) return 0;

  return previousMonthSpents.reduce((carryover, spent) => carryover + (monthlyBudget - spent), 0);
};

export const useFamilyVariableBudget = ({
  filteredPeriodBudgets,
  familyBeneficiaryIds,
  settings,
  scope,
  activeWeek,
}: Params): UseFamilyVariableBudgetReturn => {
  const sortedPeriods = useMemo(() => [...filteredPeriodBudgets].sort((a, b) => a.weekNumber - b.weekNumber), [filteredPeriodBudgets]);

  const familyVariableBudgetMonthly = Number(settings.family_variable_budget || 0);
  const familyOpeningCarryover = 0;

  const periodCarryovers = useMemo(() => {
    const periodNets = sortedPeriods.map((period) => calculateFamilyVariableNetBreakdown(period.items, familyBeneficiaryIds).status.realStandard);
    return calculateFamilyVariablePeriodCarryover(familyVariableBudgetMonthly, familyOpeningCarryover, periodNets);
  }, [sortedPeriods, familyBeneficiaryIds, familyVariableBudgetMonthly, familyOpeningCarryover]);

  const familyVariableValuesByPeriod = useMemo(() => {
    const byPeriod: Record<number, { budget: number; net: number; remaining: number }> = {};
    sortedPeriods.forEach((period, index) => {
      const net = calculateFamilyVariableNet(period.items, familyBeneficiaryIds);
      byPeriod[period.weekNumber] = {
        budget: periodCarryovers.periodBudgets[index] || 0,
        net,
        remaining: periodCarryovers.periodRemaining[index] || 0,
      };
    });
    return byPeriod;
  }, [sortedPeriods, familyBeneficiaryIds, periodCarryovers.periodBudgets, periodCarryovers.periodRemaining]);

  const familyVariableNetBreakdownByPeriod = useMemo(() => {
    const byPeriod: Record<number, FamilyVariableNetBreakdown> = {};
    sortedPeriods.forEach((period) => {
      byPeriod[period.weekNumber] = calculateFamilyVariableNetBreakdown(period.items, familyBeneficiaryIds);
    });
    return byPeriod;
  }, [sortedPeriods, familyBeneficiaryIds]);

  const familyVariableMonthNetBreakdown = useMemo(
    () =>
      calculateFamilyVariableNetBreakdown(
        sortedPeriods.flatMap((p) => p.items),
        familyBeneficiaryIds
      ),
    [sortedPeriods, familyBeneficiaryIds]
  );

  const familyVariableNetBreakdown =
    scope === "MONTH"
      ? familyVariableMonthNetBreakdown
      : familyVariableNetBreakdownByPeriod[activeWeek] || {
          nature: { standard: 0, refunds: 0, extra: 0, total: 0 },
          status: { real: 0, waiting: 0, realStandard: 0, waitingStandard: 0, realExtra: 0, waitingExtra: 0 },
        };

  const familyVariableBudgetTotalAmount = scope === "MONTH" ? periodCarryovers.monthBudget : familyVariableValuesByPeriod[activeWeek]?.budget || 0;
  const familyVariableMonthBudgetAmount = periodCarryovers.monthBudget;
  const familyVariablePeriodsCount = filteredPeriodBudgets.length;
  const familyVariablePeriodValue = settings.period_value;
  const familyVariableNetAmount = familyVariableNetBreakdown.nature.total;
  const familyVariableRealStandard = familyVariableNetBreakdown.status.realStandard;
  const familyVariableBudgetRemainingAmount = familyVariableBudgetTotalAmount - familyVariableRealStandard;

  return {
    familyVariableNetBreakdown: familyVariableNetBreakdown,
    familyVariableBudgetTotalAmount,
    familyVariableMonthBudgetAmount,
    familyVariableBudgetRemainingAmount,
    familyVariableNetAmount,
    periodCarryovers,
    familyVariablePeriodsCount,
    familyVariablePeriodValue,
    familyVariableValuesByPeriod,
    familyVariableNetBreakdownByPeriod,
  };
};

export default useFamilyVariableBudget;

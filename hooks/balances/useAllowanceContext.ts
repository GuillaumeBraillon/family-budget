import { useMemo } from "react";
import { PaidItemDetails, AppSettings, AllowanceContext, ExpenseConfig, IncomeConfig } from "../../types";
import { resolveBeneficiaryAmounts, getBeneficiaryStandardShare, isBudgetExcluded } from "../../services/financeUtils";

export type UseAllowanceContextReturn = AllowanceContext;

interface UseAllowanceContextParams {
  currentDate: Date;
  paidItems: Record<string, PaidItemDetails>;
  personalBeneficiaryIds: string[];
  settings: AppSettings;
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
}

/** Génère tous les mois au format YYYY-MM entre start (inclus) et end (exclus). */
const generateMonthRange = (start: string, end: string): string[] => {
  const result: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m < em)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return result;
};

const isConfigActiveInMonth = (conf: { startMonth?: string; endMonth?: string }, monthKey: string): boolean => {
  if (conf.startMonth && monthKey < conf.startMonth) return false;
  if (conf.endMonth && monthKey > conf.endMonth) return false;
  return true;
};

export const useAllowanceContext = ({
  currentDate,
  paidItems,
  personalBeneficiaryIds,
  settings,
  configs,
  incomeConfigs,
}: UseAllowanceContextParams): UseAllowanceContextReturn => {
  return useMemo(() => {
    const allowancePerBeneficiary = Number(settings.personal_budget_amount || 350);
    if (personalBeneficiaryIds.length === 0) {
      return {
        allowancePerBeneficiary,
        previousCarryoverTotal: 0,
        availableMonthlyAllowance: 0,
        carryoverByBeneficiary: {} as Record<string, number>,
      };
    }

    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    // --- Montants réellement pointés (paidItems des mois passés) ---
    const monthlyPaidByBeneficiary: Record<string, Record<string, number>> = {};

    Object.values(paidItems).forEach((details) => {
      if (isBudgetExcluded(details)) return;
      if (details.isSalary) return;
      if (details.type !== "EXPENSE" && details.type !== "INCOME") return;

      const monthKey = details.paymentDate.slice(0, 7);
      if (monthKey >= currentMonthKey) return;

      resolveBeneficiaryAmounts(details)
        .filter((ba) => personalBeneficiaryIds.includes(ba.beneficiaryId))
        .forEach((ba) => {
          const standardShare = getBeneficiaryStandardShare(details, ba.beneficiaryId);
          if (!monthlyPaidByBeneficiary[monthKey]) monthlyPaidByBeneficiary[monthKey] = {};
          const delta = details.type === "EXPENSE" ? standardShare : -standardShare;
          monthlyPaidByBeneficiary[monthKey][ba.beneficiaryId] = (monthlyPaidByBeneficiary[monthKey][ba.beneficiaryId] || 0) + delta;
        });
    });

    // --- Détermination de la plage de mois à couvrir ---
    // Ancrage fixe : 1er janvier de l'année courante (remise à zéro annuelle).
    const januaryKey = `${currentDate.getFullYear()}-01`;
    const allPastMonths = generateMonthRange(januaryKey, currentMonthKey);

    // --- Récurrents planifiés mais NON pointés (aucune entrée paidItems) ---
    // Cohérence avec consumedDetails du mois courant qui inclut les items isPaid=false
    const monthlyUnpaidRecurringByBeneficiary: Record<string, Record<string, number>> = {};

    allPastMonths.forEach((monthKey) => {
      configs.forEach((conf) => {
        if (isBudgetExcluded(conf)) return;
        if (!isConfigActiveInMonth(conf, monthKey)) return;
        if (paidItems[`${conf.id}-${monthKey}`]) return; // Déjà compté via paidItems

        personalBeneficiaryIds.forEach((beneficiaryId) => {
          const share = getBeneficiaryStandardShare(conf, beneficiaryId);
          if (share <= 0) return;
          if (!monthlyUnpaidRecurringByBeneficiary[monthKey]) monthlyUnpaidRecurringByBeneficiary[monthKey] = {};
          monthlyUnpaidRecurringByBeneficiary[monthKey][beneficiaryId] = (monthlyUnpaidRecurringByBeneficiary[monthKey][beneficiaryId] || 0) + share;
        });
      });

      incomeConfigs.forEach((inc) => {
        if (isBudgetExcluded(inc)) return;
        if (inc.isSalary) return;
        if (!isConfigActiveInMonth(inc, monthKey)) return;
        if (paidItems[`${inc.id}-${monthKey}`]) return;

        personalBeneficiaryIds.forEach((beneficiaryId) => {
          const share = getBeneficiaryStandardShare(inc, beneficiaryId);
          if (share <= 0) return;
          if (!monthlyUnpaidRecurringByBeneficiary[monthKey]) monthlyUnpaidRecurringByBeneficiary[monthKey] = {};
          // Un revenu non pointé réduit la consommation (sens opposé)
          monthlyUnpaidRecurringByBeneficiary[monthKey][beneficiaryId] = (monthlyUnpaidRecurringByBeneficiary[monthKey][beneficiaryId] || 0) - share;
        });
      });
    });

    // --- Calcul du report cumulatif ---
    const carryoverByBeneficiary: Record<string, number> = {};
    personalBeneficiaryIds.forEach((id) => {
      carryoverByBeneficiary[id] = 0;
    });

    allPastMonths.forEach((monthKey) => {
      personalBeneficiaryIds.forEach((beneficiaryId) => {
        const paid = monthlyPaidByBeneficiary[monthKey]?.[beneficiaryId] || 0;
        const unpaidRecurring = monthlyUnpaidRecurringByBeneficiary[monthKey]?.[beneficiaryId] || 0;
        const consumed = paid + unpaidRecurring;
        const available = allowancePerBeneficiary + carryoverByBeneficiary[beneficiaryId];
        carryoverByBeneficiary[beneficiaryId] = available - consumed;
      });
    });

    const previousCarryoverTotal = personalBeneficiaryIds.reduce((sum, id) => sum + (carryoverByBeneficiary[id] || 0), 0);
    const availableMonthlyAllowance = personalBeneficiaryIds.length * allowancePerBeneficiary + previousCarryoverTotal;

    return {
      allowancePerBeneficiary,
      previousCarryoverTotal,
      availableMonthlyAllowance,
      carryoverByBeneficiary,
    };
  }, [currentDate, paidItems, personalBeneficiaryIds, settings.personal_budget_amount, configs, incomeConfigs]);
};

export default useAllowanceContext;

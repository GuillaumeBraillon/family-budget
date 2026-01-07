import { useMemo } from "react";
import { startOfMonth, endOfMonth, eachWeekOfInterval, getDate, getDaysInMonth } from "date-fns";
import { ExpenseConfig, IncomeConfig, PaidItemDetails, PlannedItem, WeeklyBudget, AppSettings, VariableTransaction, OperationFilters, CategoryDef } from "../types";

export const usePlanner = (
  configs: ExpenseConfig[],
  incomeConfigs: IncomeConfig[],
  paidItems: Record<string, PaidItemDetails>,
  variableTransactions: VariableTransaction[],
  currentDate: Date,
  searchQuery: string,
  settings: AppSettings,
  categories: CategoryDef[],
  filters?: OperationFilters
) => {
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = getDaysInMonth(currentDate);
  const monthlyBudget = settings.monthly_envelope || 0;

  const weeks = useMemo(() => {
    const res: WeeklyBudget[] = [];
    const type = settings.period_type || "FIXED_DAYS";
    const val = settings.period_value || 7;

    const createPeriod = (start: number, end: number, num: number, limitOverride?: number) => {
      const periodDays = end - start + 1;
      const distributedLimit = limitOverride ?? (monthlyBudget / daysInMonth) * periodDays;

      return {
        weekNumber: num,
        label: `Période ${num} (${start} au ${end})`,
        items: [],
        startDate: start,
        endDate: end,
        periodLimit: distributedLimit,
      };
    };

    if (type === "FIXED_DAYS") {
      for (let start = 1; start <= daysInMonth; start += val) {
        const isLast = start + val - 1 >= daysInMonth;
        const end = isLast ? daysInMonth : start + val - 1;
        res.push(createPeriod(start, end, res.length + 1));
        if (isLast) break;
      }
    } else if (type === "CALENDAR_WEEKS") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarWeeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

      calendarWeeks.forEach((weekDate, idx) => {
        const start = getDate(weekDate < monthStart ? monthStart : weekDate);
        const nextWeek = new Date(weekDate);
        nextWeek.setDate(nextWeek.getDate() + 6);
        const end = getDate(nextWeek > monthEnd ? monthEnd : nextWeek);
        res.push(createPeriod(start, end, idx + 1));
      });
    } else if (type === "CUSTOM_SPLIT") {
      const parts = Math.max(1, Math.min(daysInMonth, val));
      const daysPerPart = Math.floor(daysInMonth / parts);
      const equalLimit = monthlyBudget / parts;

      for (let i = 0; i < parts; i++) {
        const start = i * daysPerPart + 1;
        const end = i === parts - 1 ? daysInMonth : (i + 1) * daysPerPart;
        res.push(createPeriod(start, end, i + 1, equalLimit));
      }
    }

    const assignToPeriod = (item: PlannedItem) => {
      const period = res.find((p) => item.day >= p.startDate && item.day <= p.endDate);
      if (period) period.items.push(item);
    };

    const getDayFromDateStr = (dateStr?: string, defaultDay?: number) => {
      if (!dateStr) return defaultDay || 1;
      const parts = dateStr.split("-");
      if (parts.length === 3) return parseInt(parts[2], 10);
      return new Date(dateStr).getDate();
    };

    configs
      .filter((conf) => {
        if (!conf.startMonth) return true;
        if (currentMonthKey < conf.startMonth) return false;
        if (conf.endMonth && currentMonthKey > conf.endMonth) return false;
        return true;
      })
      .forEach((conf) => {
        const instanceId = `${conf.id}-${currentMonthKey}`;
        const paid = paidItems[instanceId];
        const isActuallyPaid = paid ? !paid.isWaiting : false;
        const day = paid ? getDayFromDateStr(paid.paymentDate, conf.dayOfMonth) : conf.dayOfMonth;

        assignToPeriod({
          type: "EXPENSE",
          source: "RECURRING",
          configId: conf.id,
          instanceId,
          day,
          label: paid ? paid.label : conf.label,
          amount: paid ? paid.amount : conf.amount,
          originalAmount: conf.amount,
          category: conf.category,
          subCategory: conf.subCategory,
          beneficiaryId: conf.beneficiaryId,
          accountId: conf.accountId,
          isExtra: !!(paid ? paid.isExtra : conf.isExtra),
          isPaid: isActuallyPaid,
          isWaiting: !isActuallyPaid,
          paidDetails: paid,
          comments: paid?.comments || "",
          tagAmounts: paid?.tagAmounts,
          position: paid?.position,
        });
      });

    incomeConfigs.forEach((inc) => {
      const instanceId = `${inc.id}-${currentMonthKey}`;
      const paid = paidItems[instanceId];
      const isActuallyPaid = paid ? !paid.isWaiting : false;
      const day = paid ? getDayFromDateStr(paid.paymentDate, inc.dayOfMonth) : inc.dayOfMonth;

      assignToPeriod({
        type: "INCOME",
        source: "RECURRING",
        configId: inc.id,
        instanceId,
        day,
        label: paid ? paid.label : inc.label,
        amount: paid ? paid.amount : inc.amount,
        originalAmount: inc.amount,
        category: inc.category,
        subCategory: inc.subCategory,
        beneficiaryId: inc.beneficiaryId,
        accountId: inc.accountId,
        isPaid: isActuallyPaid,
        isWaiting: !isActuallyPaid,
        paidDetails: paid,
        isExtra: !!(paid ? paid.isExtra : inc.isExtra),
        isSalary: !!inc.isSalary,
        comments: paid?.comments || "",
        tagAmounts: paid?.tagAmounts,
        position: paid?.position,
      });
    });

    variableTransactions
      .filter((vt) => {
        const d = new Date(vt.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      })
      .forEach((vt) => {
        const d = new Date(vt.date).getDate();
        assignToPeriod({
          type: vt.type === "INCOME" ? "INCOME" : "EXPENSE",
          source: "VARIABLE",
          configId: vt.id,
          instanceId: vt.id,
          day: d,
          label: vt.label,
          amount: vt.amount,
          originalAmount: vt.amount,
          category: vt.category,
          subCategory: vt.subCategory,
          beneficiaryId: vt.beneficiaryId || "",
          accountId: vt.accountId,
          isPaid: !vt.isWaiting,
          isWaiting: !!vt.isWaiting,
          isExtra: !!vt.isExtra,
          comments: vt.comments || "",
          tagAmounts: vt.tagAmounts,
          position: vt.position,
        });
      });

    // --- SCORE DE TRI ROBUSTE POUR BIGINT ---
    // Utilisation d'entiers larges (100 Milliards) pour éviter les collisions et l'arrondi.
    const getItemSortScore = (item: PlannedItem) => {
      if (typeof item.position === "number" && item.position !== 0) return item.position;

      // Base : 100 Milliards. Espace large pour insertion avant/après.
      const BASE_SCORE = 100_000_000_000;
      const DAY_STEP = 100_000_000; // 100 Millions par jour

      // Génération d'un hash entier déterministe entre 0 et 99,999,999
      let hash = 0;
      for (let i = 0; i < item.instanceId.length; i++) {
        hash = (hash << 5) - hash + item.instanceId.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      const safeHash = Math.abs(hash) % DAY_STEP;

      // Le score par défaut dépend du jour + un hash stable pour l'ordre intra-jour par défaut
      return BASE_SCORE + item.day * DAY_STEP + safeHash;
    };

    res.forEach((w) =>
      w.items.sort((a, b) => {
        const scoreA = getItemSortScore(a);
        const scoreB = getItemSortScore(b);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.instanceId.localeCompare(b.instanceId);
      })
    );
    return res;
  }, [configs, incomeConfigs, paidItems, variableTransactions, currentMonthKey, settings, currentDate, daysInMonth, monthlyBudget]);

  const filteredWeeks = useMemo(() => {
    return weeks.map((w) => {
      let items = w.items;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().replace(/,/g, ".");
        items = items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q) ||
            i.amount.toString().includes(q) ||
            (i.comments && i.comments.toLowerCase().includes(q))
        );
      }

      if (filters) {
        if (filters.flux !== "ALL") items = items.filter((i) => i.type === filters.flux);
        if (filters.source !== "ALL") items = items.filter((i) => i.source === filters.source);
        if (filters.status !== "ALL") {
          const wantWaiting = filters.status === "WAITING";
          items = items.filter((i) => i.isWaiting === wantWaiting);
        }
        if (filters.extra === "ONLY") items = items.filter((i) => i.isExtra === true);
        else if (filters.extra === "EXCLUDE") items = items.filter((i) => i.isExtra === false);

        if (filters.transfer === "ONLY") items = items.filter((i) => i.category === "Virement Interne");
        else if (filters.transfer === "EXCLUDE") items = items.filter((i) => i.category !== "Virement Interne");

        if (filters.salary === "ONLY") items = items.filter((i) => i.isSalary === true);
        else if (filters.salary === "EXCLUDE") items = items.filter((i) => !i.isSalary);

        if (filters.accountIds.length > 0) items = items.filter((i) => filters.accountIds.includes(i.accountId));
        if (filters.beneficiaryIds.length > 0) items = items.filter((i) => filters.beneficiaryIds.includes(i.beneficiaryId));

        if (filters.tagPresence === "WITH_TAGS") {
          items = items.filter((i) => i.tagAmounts && i.tagAmounts.length > 0);
        } else if (filters.tagPresence === "WITHOUT_TAGS") {
          items = items.filter((i) => !i.tagAmounts || i.tagAmounts.length === 0);
        }

        if (filters.excludedTagIds && filters.excludedTagIds.length > 0) {
          items = items.filter((i) => {
            if (!i.tagAmounts || i.tagAmounts.length === 0) return true;
            return !i.tagAmounts.some((ta) => filters.excludedTagIds.includes(ta.tagId));
          });
        }

        if (filters.includedTagIds && filters.includedTagIds.length > 0) {
          items = items.filter((i) => {
            if (!i.tagAmounts || i.tagAmounts.length === 0) return false;
            return i.tagAmounts.some((ta) => filters.includedTagIds.includes(ta.tagId));
          });
        }
      }

      return { ...w, items };
    });
  }, [weeks, searchQuery, filters]);

  const getStats = (activeWeek: number) => {
    const safeActiveWeek = weeks.some((w) => w.weekNumber === activeWeek) ? activeWeek : 1;
    const currentWeek = weeks.find((w) => w.weekNumber === safeActiveWeek);
    const currentItems = currentWeek?.items || [];
    const previousUnpaidItems = weeks
      .filter((w) => w.weekNumber < safeActiveWeek)
      .flatMap((w) => w.items)
      .filter((i) => !i.isPaid);

    const isRefund = (item: PlannedItem) => {
      if (item.type !== "INCOME") return false;
      if (item.category === "Dépenses" || item.category === "Remboursement") return true;
      const catDef = categories.find((c) => c.name === item.category);
      if (catDef && catDef.type === "EXPENSE") return true;
      return false;
    };

    const sum = (items: PlannedItem[], type: "EXPENSE" | "INCOME", useOriginal = false) =>
      items.filter((i) => i.type === type).reduce((acc, i) => acc + (useOriginal ? i.originalAmount : i.amount), 0);

    const byAccount: Record<string, any> = {};
    const expByBeneficiary: Record<string, any> = {};
    const incByBeneficiary: Record<string, any> = {};

    [...currentItems, ...previousUnpaidItems].forEach((item) => {
      if (!byAccount[item.accountId]) byAccount[item.accountId] = { paid: 0, remaining: 0, planned: 0, pendingCount: 0 };
      const val = item.amount;
      const originalVal = item.originalAmount;

      if (item.isPaid) {
        byAccount[item.accountId].paid += item.type === "EXPENSE" ? val : -val;
      } else {
        byAccount[item.accountId].remaining += item.type === "EXPENSE" ? val : -val;
        byAccount[item.accountId].pendingCount++;
      }

      if (item.source === "RECURRING") {
        byAccount[item.accountId].planned += item.type === "EXPENSE" ? originalVal : -originalVal;
      }

      if (item.category !== "Virement Interne") {
        if (item.isPaid) {
          if (!incByBeneficiary[item.beneficiaryId]) incByBeneficiary[item.beneficiaryId] = { paid: 0, planned: 0 };
          if (!expByBeneficiary[item.beneficiaryId]) expByBeneficiary[item.beneficiaryId] = { paid: 0, planned: 0 };

          if (item.type === "INCOME") incByBeneficiary[item.beneficiaryId].paid += val;
          else expByBeneficiary[item.beneficiaryId].paid += val;
        }

        if (item.source === "RECURRING") {
          if (item.type === "INCOME") {
            if (!incByBeneficiary[item.beneficiaryId]) incByBeneficiary[item.beneficiaryId] = { paid: 0, planned: 0 };
            incByBeneficiary[item.beneficiaryId].planned += originalVal;
          } else {
            if (!expByBeneficiary[item.beneficiaryId]) expByBeneficiary[item.beneficiaryId] = { paid: 0, planned: 0 };
            expByBeneficiary[item.beneficiaryId].planned += originalVal;
          }
        }
      }
    });

    const periodLimit = currentWeek?.periodLimit || 0;
    const budgetVariableItems = currentItems.filter((i) => i.source === "VARIABLE" && !i.isExtra && !i.isWaiting && i.category !== "Virement Interne");

    let varExpenses = 0;
    let varIncome = 0;

    budgetVariableItems.forEach((item) => {
      if (item.type === "EXPENSE") {
        varExpenses += item.amount;
      } else if (item.type === "INCOME") {
        if (isRefund(item)) {
          varExpenses -= item.amount;
        } else {
          varIncome += item.amount;
        }
      }
    });

    return {
      fixedPaid: sum(
        currentItems.filter((i) => i.source === "RECURRING" && i.isPaid && i.category !== "Virement Interne"),
        "EXPENSE"
      ),
      fixedToPay: sum(
        currentItems.filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne"),
        "EXPENSE"
      ),
      fixedDelays: sum(
        previousUnpaidItems.filter((i) => i.source === "RECURRING" && i.category !== "Virement Interne"),
        "EXPENSE"
      ),
      fixedPlanned: sum(
        currentItems.filter((i) => i.source === "RECURRING" && i.category !== "Virement Interne"),
        "EXPENSE",
        true
      ),
      varExpenses,
      varIncome,
      periodLimit,
      varRemaining: periodLimit + varIncome - varExpenses,
      totalIncomeReal: sum(
        currentItems.filter((i) => i.isPaid && i.category !== "Virement Interne"),
        "INCOME"
      ),
      byAccount,
      expByBeneficiary,
      incByBeneficiary,
    };
  };

  return { filteredWeeks, getStats };
};

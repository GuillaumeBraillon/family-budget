
import { useMemo } from 'react';
import { startOfMonth, endOfMonth, eachWeekOfInterval, getDate, getDaysInMonth } from 'date-fns';
import { ExpenseConfig, IncomeConfig, PaidItemDetails, PlannedItem, WeeklyBudget, AppSettings } from '../types';

/**
 * Gère la génération dynamique des périodes, le filtrage et les statistiques du Planner.
 * Ajoute désormais la distribution du budget mensuel par période.
 */
export const usePlanner = (
  configs: ExpenseConfig[],
  incomeConfigs: IncomeConfig[],
  paidItems: Record<string, PaidItemDetails>,
  currentDate: Date,
  searchQuery: string,
  settings: AppSettings
) => {
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(currentDate);
  const monthlyBudget = settings.monthly_envelope || 0;

  const weeks = useMemo(() => {
    const res: WeeklyBudget[] = [];
    const type = settings.period_type || 'FIXED_DAYS';
    const val = settings.period_value || 7;

    const createPeriod = (start: number, end: number, num: number) => {
      const periodDays = end - start + 1;
      const distributedLimit = (monthlyBudget / daysInMonth) * periodDays;
      return {
        weekNumber: num,
        label: `Période ${num} (${start} au ${end})`,
        items: [],
        startDate: start,
        endDate: end,
        periodLimit: distributedLimit
      };
    };

    if (type === 'FIXED_DAYS') {
      for (let start = 1; start <= daysInMonth; start += val) {
        const isLast = (start + val - 1) >= daysInMonth;
        const end = isLast ? daysInMonth : (start + val - 1);
        res.push(createPeriod(start, end, res.length + 1));
        if (isLast) break;
      }
    } else if (type === 'CALENDAR_WEEKS') {
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
    } else if (type === 'CUSTOM_SPLIT') {
      const parts = Math.max(1, Math.min(daysInMonth, val));
      const daysPerPart = Math.floor(daysInMonth / parts);
      
      for (let i = 0; i < parts; i++) {
        const start = i * daysPerPart + 1;
        const end = (i === parts - 1) ? daysInMonth : (i + 1) * daysPerPart;
        res.push(createPeriod(start, end, i + 1));
      }
    }

    const assignToPeriod = (item: PlannedItem) => {
      const period = res.find(p => item.day >= p.startDate && item.day <= p.endDate);
      if (period) period.items.push(item);
    };

    configs.filter(conf => {
      if (!conf.startMonth) return true;
      if (currentMonthKey < conf.startMonth) return false;
      if (conf.endMonth && currentMonthKey > conf.endMonth) return false;
      return true;
    }).forEach(conf => {
      const instanceId = `${conf.id}-${currentMonthKey}`;
      const paid = paidItems[instanceId];
      assignToPeriod({
        type: 'EXPENSE', configId: conf.id, instanceId, day: conf.dayOfMonth,
        label: paid ? paid.label : conf.label,
        amount: paid ? paid.amount : conf.amount,
        originalAmount: conf.amount, category: conf.category, subCategory: conf.subCategory,
        beneficiaryId: conf.beneficiaryId, accountId: conf.accountId, isExtra: conf.isExtra,
        isPaid: !!paid, paidDetails: paid
      });
    });

    incomeConfigs.forEach(inc => {
      const instanceId = `${inc.id}-${currentMonthKey}`;
      const paid = paidItems[instanceId];
      assignToPeriod({
        type: 'INCOME', configId: inc.id, instanceId, day: inc.dayOfMonth,
        label: paid ? paid.label : inc.label,
        amount: paid ? paid.amount : inc.amount,
        originalAmount: inc.amount, category: inc.category, subCategory: inc.subCategory,
        beneficiaryId: inc.beneficiaryId, accountId: inc.accountId, isPaid: !!paid, paidDetails: paid
      });
    });

    res.forEach(w => w.items.sort((a, b) => a.day - b.day));
    return res;
  }, [configs, incomeConfigs, paidItems, currentMonthKey, settings, currentDate, daysInMonth, monthlyBudget]);

  const filteredWeeks = useMemo(() => {
    if (!searchQuery.trim()) return weeks;
    const q = searchQuery.toLowerCase();
    return weeks.map(w => ({
      ...w,
      items: w.items.filter(i => i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }));
  }, [weeks, searchQuery]);

  const getStats = (activeWeek: number) => {
    const safeActiveWeek = weeks.some(w => w.weekNumber === activeWeek) ? activeWeek : 1;
    const currentWeek = filteredWeeks.find(w => w.weekNumber === safeActiveWeek);
    const currentItems = currentWeek?.items || [];
    const previousUnpaid = filteredWeeks.filter(w => w.weekNumber < safeActiveWeek).flatMap(w => w.items).filter(i => !i.isPaid);

    const calcRemaining = (items: PlannedItem[]) => items.reduce((acc, i) => i.type === 'EXPENSE' ? acc + i.amount : acc - i.amount, 0);

    const byAccount: Record<string, { total: number, remaining: number, planned: number, paid: number }> = {};
    const expByBeneficiary: Record<string, { planned: number, paid: number }> = {};
    const incByBeneficiary: Record<string, { planned: number, paid: number }> = {};

    [...currentItems, ...previousUnpaid].forEach(item => {
      if (!byAccount[item.accountId]) byAccount[item.accountId] = { total: 0, remaining: 0, planned: 0, paid: 0 };
      
      const isCurrent = currentItems.some(ci => ci.instanceId === item.instanceId);
      
      if (isCurrent) {
        const targetBeneficiary = item.type === 'EXPENSE' ? expByBeneficiary : incByBeneficiary;
        if (!targetBeneficiary[item.beneficiaryId]) targetBeneficiary[item.beneficiaryId] = { planned: 0, paid: 0 };
        
        targetBeneficiary[item.beneficiaryId].planned += item.originalAmount;
        byAccount[item.accountId].planned += (item.type === 'EXPENSE' ? item.originalAmount : -item.originalAmount);
        
        if (item.isPaid) {
          targetBeneficiary[item.beneficiaryId].paid += item.amount;
          byAccount[item.accountId].paid += (item.type === 'EXPENSE' ? item.amount : -item.amount);
        }

        const impact = item.type === 'EXPENSE' ? item.amount : -item.amount;
        byAccount[item.accountId].total += impact;
      }
      
      if (!item.isPaid) {
        const impact = item.type === 'EXPENSE' ? item.amount : -item.amount;
        byAccount[item.accountId].remaining += impact;
      }
    });

    return {
      totalOriginal: currentItems.reduce((acc, i) => i.type === 'EXPENSE' ? acc + i.originalAmount : acc - i.originalAmount, 0),
      currentRemaining: calcRemaining(currentItems.filter(i => !i.isPaid)),
      previousRemaining: calcRemaining(previousUnpaid),
      remainingToPay: calcRemaining(currentItems.filter(i => !i.isPaid)) + calcRemaining(previousUnpaid),
      currentPaidExpenses: currentItems.reduce((acc, i) => i.isPaid && i.type === 'EXPENSE' ? acc + i.amount : acc, 0),
      byAccount,
      expByBeneficiary,
      incByBeneficiary,
      periodLimit: currentWeek?.periodLimit || 0
    };
  };

  return { filteredWeeks, getStats };
};

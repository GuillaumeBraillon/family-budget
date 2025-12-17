import { useMemo, useState } from 'react';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, WeeklyBudget } from '../types';

/**
 * Gère la génération des semaines, le filtrage et les statistiques du Planner.
 */
export const usePlanner = (
  configs: ExpenseConfig[],
  incomeConfigs: IncomeConfig[],
  paidItems: Record<string, PaidItemDetails>,
  currentDate: Date,
  searchQuery: string
) => {
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const weeks = useMemo(() => {
    const res: WeeklyBudget[] = [
      { weekNumber: 1, label: "Semaine 1 (1 au 7)", items: [] },
      { weekNumber: 2, label: "Semaine 2 (8 au 14)", items: [] },
      { weekNumber: 3, label: "Semaine 3 (15 au 21)", items: [] },
      { weekNumber: 4, label: "Semaine 4 (22 à fin)", items: [] },
    ];

    // Dépenses
    configs.filter(conf => {
      if (!conf.startMonth) return true;
      if (currentMonthKey < conf.startMonth) return false;
      if (conf.endMonth && currentMonthKey > conf.endMonth) return false;
      return true;
    }).forEach(conf => {
      const target = conf.dayOfMonth <= 7 ? 0 : conf.dayOfMonth <= 14 ? 1 : conf.dayOfMonth <= 21 ? 2 : 3;
      const instanceId = `${conf.id}-${currentMonthKey}`;
      const paid = paidItems[instanceId];
      res[target].items.push({
        type: 'EXPENSE', configId: conf.id, instanceId, day: conf.dayOfMonth,
        label: paid ? paid.label : conf.label,
        amount: paid ? paid.amount : conf.amount,
        originalAmount: conf.amount, category: conf.category, subCategory: conf.subCategory,
        beneficiaryId: conf.beneficiaryId, accountId: conf.accountId, isExtra: conf.isExtra,
        isPaid: !!paid, paidDetails: paid
      });
    });

    // Revenus
    incomeConfigs.forEach(inc => {
      const target = inc.dayOfMonth <= 7 ? 0 : inc.dayOfMonth <= 14 ? 1 : inc.dayOfMonth <= 21 ? 2 : 3;
      const instanceId = `${inc.id}-${currentMonthKey}`;
      const paid = paidItems[instanceId];
      res[target].items.push({
        type: 'INCOME', configId: inc.id, instanceId, day: inc.dayOfMonth,
        label: paid ? paid.label : inc.label,
        amount: paid ? paid.amount : inc.amount,
        originalAmount: inc.amount, category: inc.category, subCategory: inc.subCategory,
        beneficiaryId: inc.beneficiaryId, accountId: inc.accountId, isPaid: !!paid, paidDetails: paid
      });
    });

    res.forEach(w => w.items.sort((a, b) => a.day - b.day));
    return res;
  }, [configs, incomeConfigs, paidItems, currentMonthKey]);

  const filteredWeeks = useMemo(() => {
    if (!searchQuery.trim()) return weeks;
    const q = searchQuery.toLowerCase();
    return weeks.map(w => ({
      ...w,
      items: w.items.filter(i => i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }));
  }, [weeks, searchQuery]);

  const getStats = (activeWeek: number) => {
    const currentWeek = filteredWeeks.find(w => w.weekNumber === activeWeek);
    const currentItems = currentWeek?.items || [];
    const previousUnpaid = filteredWeeks.filter(w => w.weekNumber < activeWeek).flatMap(w => w.items).filter(i => !i.isPaid);

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

        // Ancienne logique de 'total' maintenue pour compatibilité si nécessaire
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
      incByBeneficiary
    };
  };

  return { filteredWeeks, getStats };
};

import React, { useMemo, useState } from 'react';
import { getDaysInMonth } from 'date-fns';
import { DashboardHeader } from './components/DashboardHeader';
import { SavingsSummaryCard } from './components/SavingsSummaryCard';
import { AnnualIncomeAnalysis } from './components/AnnualIncomeAnalysis';
import { GlobalMonthlyAnalysis } from './components/GlobalMonthlyAnalysis';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, Transfer, VariableTransaction, CategoryDef, OperationFilters, AccountType } from '../../../types';

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  transfers: Transfer[];
  variableTransactions?: VariableTransaction[];
  categories: CategoryDef[];
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
  onNavigateToConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  accounts, configs, incomeConfigs, paidItems, settings, transfers, variableTransactions = [], categories,
  onNavigateToPlanner 
}) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Identification des comptes courants
  const checkingAccountIds = useMemo(() => 
    accounts.filter(a => a.type === AccountType.CHECKING).map(a => a.id),
  [accounts]);

  // Fonction utilitaire pour détecter les remboursements
  const isRefundCategory = (categoryName: string) => {
      if (categoryName === 'Remboursement' || categoryName === 'Dépenses') return true;
      const catDef = categories.find(c => c.name === categoryName);
      return catDef?.type === 'EXPENSE';
  };

  // --- LOGIQUE 1 : TABLEAU MACRO (Salaires inclus) ---
  const globalMonthlyData = useMemo(() => {
    const data = [];
    for (let month = 0; month < 12; month++) {
        const currentMonthDate = new Date(selectedYear, month, 1);
        const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
        
        let salaryTotal = 0;
        let otherIncomeTotal = 0;
        let expenseTotal = 0;

        // 1. Salaires et Revenus Récurrents
        incomeConfigs.forEach(inc => {
            if (inc.startMonth && monthKey < inc.startMonth) return;
            if (inc.endMonth && monthKey > inc.endMonth) return;

            const instanceId = `${inc.id}-${monthKey}`;
            const paid = paidItems[instanceId];
            
            // Si payé, on prend le montant réel, sinon 0 (car on est sur du "Réel")
            if (paid && !paid.isWaiting) {
                // Vérification si c'est un remboursement récurrent (rare mais possible)
                if (isRefundCategory(inc.category)) {
                    expenseTotal -= paid.amount;
                } else if (inc.isSalary) {
                    salaryTotal += paid.amount;
                } else {
                    otherIncomeTotal += paid.amount;
                }
            }
        });

        // 2. Dépenses Récurrentes (Réel)
        configs.forEach(conf => {
            if (conf.startMonth && monthKey < conf.startMonth) return;
            if (conf.endMonth && monthKey > conf.endMonth) return;
            const instanceId = `${conf.id}-${monthKey}`;
            const paid = paidItems[instanceId];
            if (paid && !paid.isWaiting) {
                expenseTotal += paid.amount;
            }
        });

        // 3. Transactions Variables (Réel)
        variableTransactions.forEach(tx => {
            if (!checkingAccountIds.includes(tx.accountId)) return;
            if (tx.isWaiting) return; 
            if (tx.category === 'Virement Interne') return;

            const [y, m] = tx.date.split('-').map(Number);
            if (y === selectedYear && (m - 1) === month) {
                if (tx.type === 'INCOME') {
                    if (isRefundCategory(tx.category)) {
                        // C'est un remboursement : on diminue les dépenses au lieu d'augmenter les revenus
                        expenseTotal -= tx.amount;
                    } else {
                        otherIncomeTotal += tx.amount;
                    }
                } else {
                    expenseTotal += tx.amount;
                }
            }
        });

        const totalIncome = salaryTotal + otherIncomeTotal;
        const balance = totalIncome - expenseTotal;
        const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

        data.push({
            monthName: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentMonthDate),
            salaries: salaryTotal,
            otherIncome: otherIncomeTotal,
            totalIncome,
            expenses: expenseTotal,
            balance,
            savingsRate
        });
    }
    return data.reverse();
  }, [selectedYear, configs, incomeConfigs, paidItems, variableTransactions, checkingAccountIds, categories]);


  // --- LOGIQUE 2 : TABLEAU DÉTAILLÉ PAR PÉRIODE (Salaires EXCLUS) ---
  const annualData = useMemo(() => {
    const monthsData = [];

    for (let month = 0; month < 12; month++) {
        const currentMonthDate = new Date(selectedYear, month, 1);
        const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
        const daysInMonth = getDaysInMonth(currentMonthDate);

        // 1. GÉNÉRATION DES PÉRIODES
        const periods = [];
        const type = settings.period_type || 'FIXED_DAYS';
        const val = settings.period_value || 7;

        if (type === 'FIXED_DAYS') {
            for (let start = 1; start <= daysInMonth; start += val) {
                const end = Math.min(start + val - 1, daysInMonth);
                periods.push({ id: periods.length + 1, start, end, label: `Période ${periods.length + 1}` });
            }
        } else if (type === 'CUSTOM_SPLIT') {
            const parts = Math.max(1, Math.min(daysInMonth, val));
            const daysPerPart = Math.floor(daysInMonth / parts);
            for (let i = 0; i < parts; i++) {
                const start = i * daysPerPart + 1;
                const end = (i === parts - 1) ? daysInMonth : (i + 1) * daysPerPart;
                periods.push({ id: i + 1, start, end, label: `Période ${i + 1}` });
            }
        } else {
            for (let start = 1; start <= daysInMonth; start += 7) {
                const end = Math.min(start + 6, daysInMonth);
                periods.push({ id: periods.length + 1, start, end, label: `Semaine ${periods.length + 1}` });
            }
        }

        // 2. AGRÉGATION DES DONNÉES PAR PÉRIODE
        const periodData = periods.map(p => ({
            period: p,
            income: { recurring: 0, variable: 0, total: 0 },
            expenses: { recurring: 0, variable: 0, total: 0 },
            balance: 0
        }));

        const addToPeriod = (day: number, amount: number, type: 'income_recurring' | 'income_variable' | 'expense_recurring' | 'expense_variable') => {
            const pIndex = periods.findIndex(p => day >= p.start && day <= p.end);
            if (pIndex !== -1) {
                if (type === 'income_recurring') {
                    periodData[pIndex].income.recurring += amount;
                    periodData[pIndex].income.total += amount;
                    periodData[pIndex].balance += amount;
                } else if (type === 'income_variable') {
                    periodData[pIndex].income.variable += amount;
                    periodData[pIndex].income.total += amount;
                    periodData[pIndex].balance += amount;
                } else if (type === 'expense_recurring') {
                    periodData[pIndex].expenses.recurring += amount;
                    periodData[pIndex].expenses.total += amount;
                    periodData[pIndex].balance -= amount;
                } else if (type === 'expense_variable') {
                    periodData[pIndex].expenses.variable += amount;
                    periodData[pIndex].expenses.total += amount;
                    periodData[pIndex].balance -= amount;
                }
            }
        };

        // -> REVENUS RÉCURRENTS (Réel uniquement, HORS SALAIRES)
        incomeConfigs.forEach(inc => {
            if (inc.isSalary) return; 
            if (inc.startMonth && monthKey < inc.startMonth) return;
            if (inc.endMonth && monthKey > inc.endMonth) return;

            const instanceId = `${inc.id}-${monthKey}`;
            const paid = paidItems[instanceId];
            
            if (paid && !paid.isWaiting) {
                let day = inc.dayOfMonth;
                if (paid.paymentDate) {
                    const parts = paid.paymentDate.split('-').map(Number);
                    if (parts.length === 3) day = parts[2];
                }
                
                if (isRefundCategory(inc.category)) {
                    // Remboursement récurrent -> Réduit les dépenses récurrentes
                    // Note: techniquement c'est un flux entrant, pour l'affichage ici on le soustrait des dépenses ou on le met en revenu négatif ?
                    // Pour le tableau détaillé, on le considère comme un "Revenu Variable" (Remboursement) ou on réduit la dépense ?
                    // Pour rester simple dans ce tableau : on le traite comme une réduction de dépense récurrente
                    // Mais `addToPeriod` gère des buckets. On va le mettre en dépense négative.
                    addToPeriod(day, -paid.amount, 'expense_recurring');
                } else {
                    addToPeriod(day, paid.amount, 'income_recurring');
                }
            }
        });

        // -> DÉPENSES RÉCURRENTES (Réel uniquement)
        configs.forEach(conf => {
            if (conf.startMonth && monthKey < conf.startMonth) return;
            if (conf.endMonth && monthKey > conf.endMonth) return;

            const instanceId = `${conf.id}-${monthKey}`;
            const paid = paidItems[instanceId];

            if (paid && !paid.isWaiting) {
                let day = conf.dayOfMonth;
                if (paid.paymentDate) {
                    const parts = paid.paymentDate.split('-').map(Number);
                    if (parts.length === 3) day = parts[2];
                }
                addToPeriod(day, paid.amount, 'expense_recurring');
            }
        });

        // -> TRANSACTIONS VARIABLES (Réel uniquement)
        variableTransactions.forEach(tx => {
            if (!checkingAccountIds.includes(tx.accountId)) return;

            const [y, m, d] = tx.date.split('-').map(Number);
            
            if (y === selectedYear && (m - 1) === month) {
                if (tx.isWaiting) return; // Exclusion stricte du prévisionnel
                if (tx.category === 'Virement Interne') return;

                if (tx.type === 'INCOME') {
                    if (isRefundCategory(tx.category)) {
                        // Remboursement variable -> Réduit les dépenses variables
                        addToPeriod(d, -tx.amount, 'expense_variable');
                    } else {
                        addToPeriod(d, tx.amount, 'income_variable');
                    }
                } else {
                    addToPeriod(d, tx.amount, 'expense_variable');
                }
            }
        });

        // Totaux Mensuels
        const monthTotals = periodData.reduce((acc, p) => ({
            income: acc.income + p.income.total,
            expenses: acc.expenses + p.expenses.total,
            balance: acc.balance + p.balance
        }), { income: 0, expenses: 0, balance: 0 });

        monthsData.push({
            monthName: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentMonthDate),
            monthIndex: month,
            dateObj: currentMonthDate,
            periods: periodData,
            totals: monthTotals
        });
    }

    return monthsData.reverse(); 
  }, [selectedYear, configs, incomeConfigs, paidItems, variableTransactions, settings, categories, checkingAccountIds]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <SavingsSummaryCard 
        accounts={accounts} 
        transfers={transfers} 
        paidItems={paidItems}
      />

      <DashboardHeader 
        currentDate={new Date()} 
        onNavigateToPlanner={() => onNavigateToPlanner(new Date())} 
      />
      
      {/* SECTION MACRO : CASHFLOW GLOBAL (Salaires inclus) */}
      <GlobalMonthlyAnalysis 
        data={globalMonthlyData} 
        year={selectedYear} 
      />

      {/* SECTION MICRO : ANALYSE PAR PÉRIODE (Salaires exclus) */}
      <AnnualIncomeAnalysis 
        data={annualData} 
        year={selectedYear}
        onYearChange={setSelectedYear}
        onNavigateToPlanner={onNavigateToPlanner}
      />

    </div>
  );
};

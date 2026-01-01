
import React, { useMemo, useState } from 'react';
import { getDaysInMonth } from 'date-fns';
import { DashboardHeader } from './components/DashboardHeader';
import { SavingsSummaryCard } from './components/SavingsSummaryCard';
import { AnnualIncomeAnalysis } from './components/AnnualIncomeAnalysis';
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

  // Identification des comptes courants (pour exclure les intérêts des livrets du budget opérationnel)
  const checkingAccountIds = useMemo(() => 
    accounts.filter(a => a.type === AccountType.CHECKING).map(a => a.id),
  [accounts]);

  // --- LOGIQUE D'AGRÉGATION ANNUELLE ---
  const annualData = useMemo(() => {
    const monthsData = [];

    // On parcourt les 12 mois de l'année sélectionnée
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
            income: { recurring: 0, variable: 0, extra: 0, total: 0 },
            expenses: { total: 0 }
        }));

        const addToPeriod = (day: number, amount: number, type: 'recurring' | 'variable' | 'extra' | 'expense') => {
            const pIndex = periods.findIndex(p => day >= p.start && day <= p.end);
            if (pIndex !== -1) {
                if (type === 'expense') {
                    periodData[pIndex].expenses.total += amount;
                } else {
                    // FUSION EXTRA VERS VARIABLE POUR L'AFFICHAGE
                    const targetType = type === 'extra' ? 'variable' : type;
                    periodData[pIndex].income[targetType] += amount;
                    periodData[pIndex].income.total += amount;
                }
            }
        };

        // -> Revenus Récurrents (EXCLURE SALAIRES pour correspondre à la vue Opérations par défaut)
        incomeConfigs.forEach(inc => {
            if (inc.isSalary) return; 

            // Vérif validité config pour ce mois
            if (inc.startMonth && monthKey < inc.startMonth) return;
            if (inc.endMonth && monthKey > inc.endMonth) return;

            const instanceId = `${inc.id}-${monthKey}`;
            const paid = paidItems[instanceId];
            
            // STRICT CASHFLOW : On ne prend que ce qui est réellement payé (pas d'attente, pas de prévisionnel)
            if (paid && !paid.isWaiting) {
                let day = inc.dayOfMonth;
                if (paid.paymentDate) {
                    const parts = paid.paymentDate.split('-').map(Number);
                    if (parts.length === 3) day = parts[2];
                }
                addToPeriod(day, paid.amount, 'recurring');
            }
        });

        // -> Transactions Variables
        variableTransactions.forEach(tx => {
            if (!checkingAccountIds.includes(tx.accountId)) return;

            const [y, m, d] = tx.date.split('-').map(Number);
            
            if (y === selectedYear && (m - 1) === month) {
                if (tx.type === 'INCOME' && tx.category !== 'Virement Interne') {
                    // STRICT CASHFLOW : Exclusion des variables en attente
                    if (!tx.isWaiting) {
                        addToPeriod(d, tx.amount, tx.isExtra ? 'variable' : 'variable');
                    }
                }
            }
        });

        // Totaux Mensuels
        const monthTotals = periodData.reduce((acc, p) => ({
            income: acc.income + p.income.total,
            expenses: acc.expenses + p.expenses.total
        }), { income: 0, expenses: 0 });

        monthsData.push({
            monthName: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentMonthDate),
            monthIndex: month,
            dateObj: currentMonthDate,
            periods: periodData,
            totals: monthTotals
        });
    }

    // On inverse pour avoir les mois récents en premier, ou on garde l'ordre chrono selon la préférence
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
      
      {/* SECTION ANALYSE REVENUS DÉTAILLÉE */}
      <AnnualIncomeAnalysis 
        data={annualData} 
        year={selectedYear}
        onYearChange={setSelectedYear}
        onNavigateToPlanner={onNavigateToPlanner}
      />

    </div>
  );
};

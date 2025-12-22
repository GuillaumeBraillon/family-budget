
import React, { useMemo } from 'react';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction } from '../../../types';
import { usePlanner } from '../../../hooks/usePlanner';
import { BalancesHeader } from './components/BalancesHeader';
import { BalancesTable, BalanceRow } from './components/BalancesTable';
import { TransferSummaryCard } from './components/TransferSummaryCard';

interface BalancesViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  onUpdateAccount: (account: Account) => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  settings,
  onUpdateAccount
}) => {
  const currentDate = new Date();
  const { getStats } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, currentDate, '', settings);
  
  const getWeekFromDate = (date: Date): number => {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };
  const activeWeek = getWeekFromDate(currentDate);
  const stats = getStats(activeWeek);
  
  const budgetPeriodeGlobal = stats.periodLimit;
  const resteAPayer = stats.fixedToPay + stats.fixedDelays;

  const totalPersonalBalance = useMemo(() => {
    return accounts
      .filter(a => a.type === 'COURANT' && !a.isJoint)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [accounts]);

  const { rows, virLddsTotal } = useMemo(() => {
    const r: BalanceRow[] = [];
    const checkingAccounts = accounts.filter(a => a.type === 'COURANT');
    const jointAccount = checkingAccounts.find(a => a.isJoint);
    let totalNeededByPersonals = 0;
    const personalAccounts = checkingAccounts.filter(a => !a.isJoint);
    
    for (const acc of personalAccounts) {
        const owner = people.find(p => p.id === acc.ownerId);
        let target = 0;
        
        if (acc.targetRatio !== undefined || acc.targetCap !== undefined) {
            const ratioPart = acc.targetRatio ? (budgetPeriodeGlobal * (acc.targetRatio / 100)) : Infinity;
            const capPart = acc.targetCap !== undefined ? acc.targetCap : Infinity;
            
            if (ratioPart === Infinity && capPart === Infinity) {
                target = 0;
            } else {
                target = Math.min(ratioPart, capPart);
            }
        }

        const transfer = target - acc.currentBalance;
        if (transfer > 0) totalNeededByPersonals += transfer;

        r.push({
            id: acc.id,
            name: acc.name,
            owner: owner?.name || 'Inconnu',
            balance: acc.currentBalance,
            target: target,
            transfer: transfer,
            isJoint: false
        });
    }

    let jointTransfer = 0;
    
    if (jointAccount) {
        const owner = people.find(p => p.id === jointAccount.ownerId);
        const totalNeedJoint = resteAPayer + totalNeededByPersonals;
        jointTransfer = totalNeedJoint - jointAccount.currentBalance;

        r.unshift({
            id: jointAccount.id,
            name: jointAccount.name,
            owner: owner?.name || 'Commun',
            balance: jointAccount.currentBalance,
            target: totalNeedJoint,
            transfer: jointTransfer,
            isJoint: true
        });
    }

    return { rows: r, virLddsTotal: jointTransfer };
  }, [accounts, people, budgetPeriodeGlobal, resteAPayer]);

  const handleUpdateBalance = (id: string, newBalance: number) => {
    const account = accounts.find(a => a.id === id);
    if (account) {
        onUpdateAccount({ ...account, currentBalance: newBalance });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BalancesHeader 
        budgetPeriodeGlobal={budgetPeriodeGlobal}
        resteAPayer={resteAPayer}
        totalPersonalBalance={totalPersonalBalance}
      />

      <BalancesTable 
        rows={rows} 
        onUpdateBalance={handleUpdateBalance} 
      />

      <TransferSummaryCard amount={virLddsTotal} />
    </div>
  );
};

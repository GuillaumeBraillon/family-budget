
import React, { useMemo } from 'react';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings } from '../../types';
import { usePlanner } from '../../hooks/usePlanner';
import { BalancesHeader } from './molecules/BalancesHeader';
import { BalancesTable, BalanceRow } from './organisms/BalancesTable';
import { TransferSummaryCard } from './molecules/TransferSummaryCard';

interface BalancesViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  onUpdateAccount: (account: Account) => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  settings,
  onUpdateAccount
}) => {
  const currentDate = new Date();
  const { getStats } = usePlanner(configs, incomeConfigs, paidItems, currentDate, '', settings);
  
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
  const resteAPayer = stats.totalToRegularizeActual;

  // Calcul du solde total des comptes personnels (COURANT et NON JOINT)
  const totalPersonalBalance = useMemo(() => {
    return accounts
      .filter(a => a.type === 'COURANT' && !a.isJoint)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [accounts]);

  const { rows, virLddsTotal } = useMemo(() => {
    const r: BalanceRow[] = [];
    const checkingAccounts = accounts.filter(a => a.type === 'COURANT');
    
    // 1. Identification du compte joint (pivot)
    const jointAccount = checkingAccounts.find(a => a.isJoint);
    
    // 2. Calcul des besoins pour les comptes PERSONNELS
    // Ils doivent recevoir l'argent DU compte joint
    let totalNeededByPersonals = 0;

    const personalAccounts = checkingAccounts.filter(a => !a.isJoint);
    
    for (const acc of personalAccounts) {
        const owner = people.find(p => p.id === acc.ownerId);
        let target = 0;
        
        // Règle : Min(Ratio%, Cap)
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

    // 3. Calcul du besoin pour le COMPTE JOINT
    // Il doit couvrir : Le Reste à payer global (Factures) + Les virements vers les comptes persos
    // Il reçoit l'argent DU LDDS
    let jointTransfer = 0;
    
    if (jointAccount) {
        const owner = people.find(p => p.id === jointAccount.ownerId);
        
        // Besoin du Joint = (Factures à payer + Besoins des Persos) - Solde Actuel
        // On considère que le Reste à Payer global est à charge du compte joint par défaut
        const totalNeedJoint = resteAPayer + totalNeededByPersonals;
        
        jointTransfer = totalNeedJoint - jointAccount.currentBalance;

        r.unshift({ // On le met en premier dans la liste
            id: jointAccount.id,
            name: jointAccount.name,
            owner: owner?.name || 'Commun',
            balance: jointAccount.currentBalance,
            target: totalNeedJoint, // Cible dynamique incluant le reste à payer + besoins persos
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


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
  // On récupère filteredWeeks pour avoir accès aux items de la semaine (y compris variables en attente)
  const { getStats, filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, currentDate, '', settings);
  
  const getWeekFromDate = (date: Date): number => {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };
  const activeWeek = getWeekFromDate(currentDate);
  const stats = getStats(activeWeek);
  
  // Budget alloué pour la période
  const budgetPeriodeGlobal = stats.periodLimit;

  // 1. Identification des comptes
  const checkingAccounts = useMemo(() => accounts.filter(a => a.type === 'COURANT'), [accounts]);
  const jointAccount = checkingAccounts.find(a => a.isJoint);
  const personalAccounts = checkingAccounts.filter(a => !a.isJoint);

  // 2. Calcul du total des soldes personnels actuels
  const totalPersonalBalance = personalAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 3. Récupération des données précises de la semaine active
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === (filteredWeeks.some(w => w.weekNumber === activeWeek) ? activeWeek : 1));
  const weekItems = currentWeekData?.items || [];

  // Calcul de la consommation variable totale (Payé + En attente)
  // On exclut les virements internes et les extras
  const totalVariableConsumed = weekItems
    .filter(i => i.source === 'VARIABLE' && !i.isExtra && i.category !== 'Virement Interne')
    .reduce((acc, i) => acc + i.amount, 0);

  // Dépenses en attente sur le compte joint (Récurrentes + Variables)
  const pendingOnJoint = weekItems
    .filter(i => !i.isPaid && i.accountId === jointAccount?.id && i.category !== 'Virement Interne')
    .reduce((acc, i) => acc + i.amount, 0);
    
  // Ajout des retards passés (Fixed Delays) qui sont forcément dus
  const totalJointLiability = pendingOnJoint + stats.fixedDelays;

  const { rows, virLddsTotal } = useMemo(() => {
    const r: BalanceRow[] = [];
    
    // -- A. CALCUL DU RESTE À VIVRE RÉEL --
    // Budget Période - (Ce qu'on a déjà dépensé ou engagé en variable)
    const remainingBudget = Math.max(0, budgetPeriodeGlobal - totalVariableConsumed);

    // -- B. MONTANT NET À DISTRIBUER (TOP-UP) --
    // Reste à vivre - Ce qu'ils ont déjà sur leurs comptes
    const netDistributable = Math.max(0, remainingBudget - totalPersonalBalance);

    let totalTransfersToPersonals = 0;

    // -- C. CALCUL POUR CHAQUE COMPTE PERSO --
    for (const acc of personalAccounts) {
        const owner = people.find(p => p.id === acc.ownerId);
        
        let transferAmount = 0;
        
        // Si le compte a un ratio défini
        if (acc.targetRatio !== undefined) {
            // Le ratio s'applique sur le montant NET à distribuer (le complément)
            const shareOfDistributable = netDistributable * (acc.targetRatio / 100);
            
            // Application du plafond (Cap) si défini
            const cap = acc.targetCap !== undefined ? acc.targetCap : Infinity;
            transferAmount = Math.min(shareOfDistributable, cap);
        }

        // Cible = Solde Actuel + Virement calculé
        // (C'est ce qu'ils auront à la fin pour finir la période)
        const targetBalance = acc.currentBalance + transferAmount;

        if (transferAmount > 0) {
            totalTransfersToPersonals += transferAmount;
        }

        r.push({
            id: acc.id,
            name: acc.name,
            owner: owner?.name || 'Inconnu',
            balance: acc.currentBalance,
            target: targetBalance,
            transfer: transferAmount,
            isJoint: false
        });
    }

    // -- D. LOGIQUE COMPTE JOINT --
    let jointTransferNeeded = 0;
    let jointTarget = 0;

    if (jointAccount) {
        const owner = people.find(p => p.id === jointAccount.ownerId);
        
        // Besoin Joint = (Toutes les dettes en attente) + (Argent à envoyer aux comptes persos)
        const totalNeedJoint = totalJointLiability + totalTransfersToPersonals;
        
        // Virement nécessaire = Besoin - Solde Actuel
        jointTransferNeeded = totalNeedJoint - jointAccount.currentBalance;
        jointTarget = totalNeedJoint; // La cible est d'avoir exactement de quoi tout payer

        r.unshift({
            id: jointAccount.id,
            name: jointAccount.name,
            owner: owner?.name || 'Commun',
            balance: jointAccount.currentBalance,
            target: jointTarget,
            transfer: jointTransferNeeded,
            isJoint: true
        });
    }

    return { rows: r, virLddsTotal: jointTransferNeeded };
  }, [
    accounts, people, budgetPeriodeGlobal, totalVariableConsumed, 
    totalJointLiability, totalPersonalBalance, jointAccount, personalAccounts
  ]);

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
        resteAPayer={totalJointLiability}
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

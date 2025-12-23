
import React, { useMemo } from 'react';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction } from '../../../types';
import { usePlanner } from '../../../hooks/usePlanner';
import { BalancesHeader } from './components/BalancesHeader';
import { BalancesTable, BalanceRow } from './components/BalancesTable';
import { TransferSummaryCard } from './components/TransferSummaryCard';
import { Info } from 'lucide-react';
import { MobileTooltip } from '../../ui/MobileTooltip';

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

  // Calcul des opérations récurrentes en attente (Courant + Retard)
  const pendingRecurring = stats.fixedToPay + stats.fixedDelays;

  // 1. Identification des comptes
  const checkingAccounts = useMemo(() => accounts.filter(a => a.type === 'COURANT'), [accounts]);
  const jointAccount = checkingAccounts.find(a => a.isJoint);
  const personalAccounts = checkingAccounts.filter(a => !a.isJoint);

  // 2. Calcul du total des soldes personnels actuels
  const totalPersonalBalance = personalAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 3. Récupération des données précises de la semaine active
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === (filteredWeeks.some(w => w.weekNumber === activeWeek) ? activeWeek : 1));
  const weekItems = currentWeekData?.items || [];

  // Calcul de la consommation variable totale (Payé + En attente) pour déterminer le reste de l'enveloppe
  const variableItems = weekItems.filter(i => i.source === 'VARIABLE' && !i.isExtra && i.category !== 'Virement Interne');
  const varExpenses = variableItems.filter(i => i.type === 'EXPENSE').reduce((acc, i) => acc + i.amount, 0);
  const varIncome = variableItems.filter(i => i.type === 'INCOME').reduce((acc, i) => acc + i.amount, 0);

  // Calculs pour le Header
  const realConsumption = varExpenses - varIncome;
  const distributableBalance = Math.max(0, budgetPeriodeGlobal - realConsumption);

  const { jointRows, personalRows, totalPersonalRow, virLddsTotal } = useMemo(() => {
    const jRows: BalanceRow[] = [];
    const pRows: BalanceRow[] = [];
    
    // --- LOGIQUE COMPTES PERSONNELS (Méthode Enveloppe) ---
    // 1. Calcul du Reste à Vivre Réel (Budget - Consommation)
    const remainingBudget = distributableBalance;

    // 2. Calcul du Montant Net à Distribuer (Reste à vivre - Ce qu'ils ont déjà)
    const netDistributable = Math.max(0, remainingBudget - totalPersonalBalance);

    let totalTransfersToPersonals = 0;

    // Calcul pour chaque compte perso
    for (const acc of personalAccounts) {
        const owner = people.find(p => p.id === acc.ownerId);
        
        let transferAmount = 0;
        
        // Application du Ratio sur le Net à Distribuer
        if (acc.targetRatio !== undefined) {
            const shareOfDistributable = netDistributable * (acc.targetRatio / 100);
            const cap = acc.targetCap !== undefined ? acc.targetCap : Infinity;
            transferAmount = Math.min(shareOfDistributable, cap);
        }

        // Cible = Solde Actuel + Virement (Ce qu'ils devraient avoir au final)
        const targetBalance = acc.currentBalance + transferAmount;

        // On cumule les virements positifs uniquement pour la synthèse
        if (transferAmount > 0) {
            totalTransfersToPersonals += transferAmount;
        }

        pRows.push({
            id: acc.id,
            name: acc.name,
            owner: owner?.name || 'Inconnu',
            balance: acc.currentBalance,
            target: targetBalance,
            transfer: transferAmount, // Peut être négatif si surplus (mais ignoré pour le global)
            isJoint: false,
            ratio: acc.targetRatio,
            cap: acc.targetCap
        });
    }

    // --- LOGIQUE COMPTE JOINT (Méthode Couverture de Dettes) ---
    let jointTransferNeeded = 0;
    let jointTarget = 0;

    if (jointAccount) {
        const owner = people.find(p => p.id === jointAccount.ownerId);
        
        // Besoin Joint = Somme de toutes les dettes en attente sur ce compte (Récurrentes + Variables)
        const jointStats = stats.byAccount[jointAccount.id];
        const pendingOnJoint = jointStats ? jointStats.remaining : 0;

        // Le compte joint doit couvrir ses dettes.
        jointTarget = pendingOnJoint;
        
        // Virement nécessaire = Dettes - Solde Actuel
        const gap = pendingOnJoint - jointAccount.currentBalance;
        
        // Si le solde couvre les dettes (gap < 0), le virement est 0 pour la synthèse
        jointTransferNeeded = Math.max(0, gap);

        jRows.push({
            id: jointAccount.id,
            name: jointAccount.name,
            owner: owner?.name || 'Commun',
            balance: jointAccount.currentBalance,
            target: jointTarget,
            transfer: gap, // On affiche le vrai gap même si négatif (excédent)
            isJoint: true
        });
    }

    // --- LIGNE DE TOTAL POUR COMPTES PERSONNELS ---
    const totalPersonalRow: BalanceRow = {
        id: 'total',
        name: 'TOTAL',
        owner: '',
        balance: pRows.reduce((sum, r) => sum + r.balance, 0),
        target: pRows.reduce((sum, r) => sum + r.target, 0),
        transfer: pRows.reduce((sum, r) => sum + r.transfer, 0),
        isJoint: false
    };

    // --- SYNTHÈSE GLOBALE ---
    // Le virement du LDDS doit couvrir le trou du Compte Joint + les Top-ups des comptes persos
    const globalTransfer = jointTransferNeeded + totalTransfersToPersonals;

    return { jointRows: jRows, personalRows: pRows, totalPersonalRow, virLddsTotal: globalTransfer };
  }, [
    accounts, people, budgetPeriodeGlobal, varExpenses, varIncome, 
    totalPersonalBalance, jointAccount, personalAccounts, stats, distributableBalance
  ]);

  const handleUpdateBalance = (id: string, newBalance: number) => {
    const account = accounts.find(a => a.id === id);
    if (account) {
        onUpdateAccount({ ...account, currentBalance: newBalance });
    }
  };

  // Récupération de la dette totale pour l'affichage header
  const totalPendingHeader = checkingAccounts.reduce((sum, acc) => {
      return sum + (stats.byAccount[acc.id]?.remaining || 0);
  }, 0);

  // Helpers pour l'affichage (arrondis)
  const roundTo0 = (amount: number) => Math.round(amount);
  const roundTo5 = (amount: number) => Math.round(amount / 5) * 5;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BalancesHeader 
        resteAPayer={totalPendingHeader}
        pendingRecurring={pendingRecurring}
      />

      {jointRows.length > 0 && (
          <BalancesTable 
            title="Compte Pivot"
            rows={jointRows} 
            onUpdateBalance={handleUpdateBalance} 
          />
      )}

      {/* SECTION RÉPARTITION BUDGÉTAIRE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight pr-1">
                      Enveloppe Total
                  </span>
                  <div className="-mt-1 -mr-1">
                      <MobileTooltip 
                          text="Montant du budget variable alloué pour la période en cours." 
                          icon={<Info size={14} className="text-slate-300 hover:text-indigo-500"/>}
                          widthClass="w-48"
                      />
                  </div>
              </div>
              <div>
                  <div className="text-xl font-black text-indigo-600">
                      {roundTo5(budgetPeriodeGlobal)} €
                  </div>
                  {Math.abs(roundTo5(budgetPeriodeGlobal) - budgetPeriodeGlobal) > 0.01 && (
                      <div className="text-[10px] font-bold text-slate-300">
                          {budgetPeriodeGlobal.toFixed(2)} €
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight pr-1">
                      Deja utilisé
                  </span>
                  <div className="-mt-1 -mr-1">
                      <MobileTooltip 
                          text="Dépenses variables standards nettes (Dépenses - Revenus variables) sur la période." 
                          icon={<Info size={14} className="text-slate-300 hover:text-indigo-500"/>}
                          widthClass="w-48"
                      />
                  </div>
              </div>
              <div>
                  <div className="text-xl font-black text-rose-600">
                      {-roundTo0(realConsumption)} €
                  </div>
                  {Math.abs(roundTo0(realConsumption) - realConsumption) > 0.01 && (
                      <div className="text-[10px] font-bold text-slate-300">
                          {(-realConsumption).toFixed(2)} €
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight pr-1">
                      Reste à répartir
                  </span>
                  <div className="-mt-1 -mr-1">
                      <MobileTooltip 
                          text="Budget Période - Conso. Réelle. C'est le montant théorique disponible pour recharger les comptes persos." 
                          icon={<Info size={14} className="text-slate-300 hover:text-indigo-500"/>}
                          widthClass="w-48"
                      />
                  </div>
              </div>
              <div>
                  <div className={`text-xl font-black ${distributableBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {roundTo5(distributableBalance)} €
                  </div>
                  {Math.abs(roundTo5(distributableBalance) - distributableBalance) > 0.01 && (
                      <div className="text-[10px] font-bold text-slate-300">
                          {distributableBalance.toFixed(2)} €
                      </div>
                  )}
              </div>
          </div>
      </div>

      <BalancesTable 
        title="Comptes Courants"
        rows={personalRows} 
        onUpdateBalance={handleUpdateBalance} 
        totalRow={totalPersonalRow}
      />

      <TransferSummaryCard amount={virLddsTotal} />
    </div>
  );
};

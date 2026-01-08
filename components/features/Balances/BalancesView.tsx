import React, { useMemo } from "react";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction, CategoryDef } from "../../../types";
import { usePlanner } from "../../../hooks/usePlanner";
import { BalancesHeader } from "./components/BalancesHeader";
import { BalancesTable, BalanceRow } from "./components/BalancesTable";
import { TransferSummaryCard } from "./components/TransferSummaryCard";
import { BudgetDistributionSummary } from "./components/BudgetDistributionSummary";

interface BalancesViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  categories: CategoryDef[];
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
  categories,
  onUpdateAccount,
}) => {
  const currentDate = new Date();
  const { calculatePeriodStatistics, filteredPeriodBudgets } = usePlanner(
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    currentDate,
    "",
    settings,
    categories
  );

  const getWeekFromDate = (date: Date): number => {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };
  const activeWeek = getWeekFromDate(currentDate);
  const stats = calculatePeriodStatistics(activeWeek);

  // Budget alloué pour la période
  const budgetPeriodeGlobal = stats.periodLimit;

  // Calcul des opérations récurrentes en attente (Courant + Retard)
  const pendingRecurring = stats.fixedToPay + stats.fixedDelays;

  // 1. Identification des comptes
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === "COURANT"), [accounts]);
  const jointAccount = checkingAccounts.find((a) => a.isJoint);
  const personalAccounts = checkingAccounts.filter((a) => !a.isJoint);

  // 2. Calcul du total des soldes personnels actuels
  const totalPersonalBalance = personalAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 3. Récupération des données précises de la semaine active
  const currentWeekData = filteredPeriodBudgets.find((w) => w.weekNumber === (filteredPeriodBudgets.some((w) => w.weekNumber === activeWeek) ? activeWeek : 1));
  const weekItems = currentWeekData?.items || [];

  // Calcul de la consommation variable totale (Payé + En attente)
  // Exclusion de "Virement Interne" ET "Intérêts"
  const variableItems = weekItems.filter((i) => i.source === "VARIABLE" && !i.isExtra && i.category !== "Virement Interne" && i.subCategory !== "Intérêts");

  // LOGIQUE SIMPLIFIÉE GRÂCE AUX DÉPENSES NÉGATIVES
  // Somme simple : Si dépense (100) -> +100. Si remboursement (-20) -> -20.
  // Donc le total = Somme des montants dépenses
  let varExpenses = 0;
  let varIncome = 0;

  variableItems.forEach((i) => {
    if (i.type === "EXPENSE") {
      varExpenses += i.amount; // i.amount peut être négatif si c'est un remboursement
    } else if (i.type === "INCOME") {
      varIncome += i.amount;
    }
  });

  // Calculs pour le Header
  const realConsumption = varExpenses - varIncome;
  const distributableBalance = Math.max(0, budgetPeriodeGlobal - realConsumption);

  // --- DÉTAILS PAR COMPTE ---

  // 1. Opérations Variables En Attente
  const pendingVariablesDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const totalPending = filteredPeriodBudgets
          .flatMap((w) => w.items)
          .filter((i) => i.accountId === acc.id && i.source === "VARIABLE" && i.type === "EXPENSE" && !i.isPaid && i.subCategory !== "Intérêts")
          .reduce((sum, i) => sum + i.amount, 0); // Marche aussi avec montants négatifs

        return { name: acc.name, amount: totalPending };
      })
      .filter((x) => x.amount > 0); // On n'affiche que s'il y a une dette positive
  }, [filteredPeriodBudgets, checkingAccounts]);

  // 2. Opérations Récurrentes En Attente (Courant + Retards)
  const pendingRecurringDetails = useMemo(() => {
    const relevantItems = filteredPeriodBudgets
      .filter((w) => w.weekNumber <= activeWeek)
      .flatMap((w) => w.items)
      .filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne" && i.type === "EXPENSE");

    return checkingAccounts
      .map((acc) => {
        const amount = relevantItems.filter((i) => i.accountId === acc.id).reduce((sum, i) => sum + i.amount, 0);
        return { name: acc.name, amount };
      })
      .filter((x) => x.amount > 0);
  }, [filteredPeriodBudgets, activeWeek, checkingAccounts]);

  // 3. Total Dette (Reste à payer global)
  const totalDebtDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const remaining = stats.byAccount[acc.id]?.remaining || 0;
        return { name: acc.name, amount: remaining };
      })
      .filter((x) => x.amount > 0);
  }, [checkingAccounts, stats]);

  // 4. Consommation Variable Réelle par compte
  const consumedDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const items = variableItems.filter((i) => i.accountId === acc.id);

        let expense = 0;
        let income = 0;

        items.forEach((i) => {
          if (i.type === "EXPENSE") {
            expense += i.amount;
          } else if (i.type === "INCOME") {
            income += i.amount;
          }
        });

        return { name: acc.name, amount: expense - income };
      })
      .filter((x) => Math.abs(x.amount) > 0.01);
  }, [checkingAccounts, variableItems]);

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
      const owner = people.find((p) => p.id === acc.ownerId);

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
        owner: owner?.name || "Inconnu",
        balance: acc.currentBalance,
        target: targetBalance,
        transfer: transferAmount, // Peut être négatif si surplus (mais ignoré pour le global)
        isJoint: false,
        ratio: acc.targetRatio,
        cap: acc.targetCap,
      });
    }

    // --- LOGIQUE COMPTE JOINT (Méthode Couverture de Dettes) ---
    let jointTransferNeeded = 0;
    let jointTarget = 0;

    if (jointAccount) {
      const owner = people.find((p) => p.id === jointAccount.ownerId);

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
        owner: owner?.name || "Commun",
        balance: jointAccount.currentBalance,
        target: jointTarget,
        transfer: gap, // On affiche le vrai gap même si négatif (excédent)
        isJoint: true,
      });
    }

    // --- LIGNE DE TOTAL POUR COMPTES PERSONNELS ---
    const totalPersonalRow: BalanceRow = {
      id: "total",
      name: "TOTAL",
      owner: "",
      balance: pRows.reduce((sum, r) => sum + r.balance, 0),
      target: pRows.reduce((sum, r) => sum + r.target, 0),
      transfer: pRows.reduce((sum, r) => sum + r.transfer, 0),
      isJoint: false,
    };

    // --- SYNTHÈSE GLOBALE ---
    // Le virement du LDDS doit couvrir le trou du Compte Joint + les Top-ups des comptes persos
    const globalTransfer = jointTransferNeeded + totalTransfersToPersonals;

    // Tri par libellé (name) pour un affichage cohérent
    jRows.sort((a, b) => a.name.localeCompare(b.name));
    pRows.sort((a, b) => a.name.localeCompare(b.name));

    return { jointRows: jRows, personalRows: pRows, totalPersonalRow, virLddsTotal: globalTransfer };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, people, budgetPeriodeGlobal, totalPersonalBalance, jointAccount, personalAccounts, stats, distributableBalance]);

  const handleUpdateBalance = (id: string, newBalance: number) => {
    const account = accounts.find((a) => a.id === id);
    if (account) {
      onUpdateAccount({ ...account, currentBalance: newBalance });
    }
  };

  // Récupération de la dette totale pour l'affichage header
  const totalPendingHeader = checkingAccounts.reduce((sum, acc) => {
    return sum + (stats.byAccount[acc.id]?.remaining || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BalancesHeader
        resteAPayer={totalPendingHeader}
        pendingRecurring={pendingRecurring}
        pendingVariablesDetails={pendingVariablesDetails}
        pendingRecurringDetails={pendingRecurringDetails}
        totalDetails={totalDebtDetails}
      />

      {jointRows.length > 0 && <BalancesTable title="Compte Pivot" rows={jointRows} onUpdateBalance={handleUpdateBalance} />}

      {/* SECTION RÉPARTITION BUDGÉTAIRE */}
      <BudgetDistributionSummary
        totalEnvelope={budgetPeriodeGlobal}
        usedEnvelope={realConsumption}
        distributable={distributableBalance}
        consumedDetails={consumedDetails}
      />

      <BalancesTable title="Comptes Courants" rows={personalRows} onUpdateBalance={handleUpdateBalance} totalRow={totalPersonalRow} />

      <TransferSummaryCard amount={virLddsTotal} />
    </div>
  );
};

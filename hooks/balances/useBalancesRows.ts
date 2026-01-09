/**
 * @file Hook de génération des lignes de tableau de soldes
 * @description Centralise la logique de génération des lignes personal/joint avec calcul
 * des transferts selon l'algorithme de redistribution à 2 passes (seuil 10€).
 *
 * @architecture
 * **Responsabilités :**
 * - Calcul du gap du compte joint (dettes - solde)
 * - Identification des contributeurs (> seuil 10€)
 * - Redistribution proportionnelle aux contributeurs uniquement
 * - Génération des lignes de tableau avec calculation tooltips
 * - Calcul du complément LDDS nécessaire
 *
 * **Algorithme de redistribution (2 passes) :**
 * - **Passe 1** : Identifier les comptes dont le montant théorique > 10€
 * - **Passe 2** : Redistribuer la totalité du besoin proportionnellement aux contributeurs
 *
 * @dependencies
 * - types.ts : BalanceRow interface
 */
import { useMemo } from "react";
import { Account, Person } from "../../types";

export interface BalanceRow {
  id: string;
  name: string;
  owner: string;
  balance: number;
  target: number;
  transfer: number;
  isJoint: boolean;
  ratio?: number;
  cap?: number;
  calculation?: {
    sharePercent?: number;
    theoreticalAmount?: number;
    isContributor?: boolean;
    jointDebts?: number;
    jointGap?: number;
    fromPersonals?: number;
    fromLdds?: number;
  };
}

interface UseBalancesRowsParams {
  _accounts: Account[];
  people: Person[];
  _budgetPeriodeGlobal: number;
  totalPersonalBalance: number;
  distributableBalance: number;
  jointAccount: Account | undefined;
  personalAccounts: Account[];
  stats: {
    byAccount: Record<string, { remaining: number }>;
  };
}

/**
 * Hook de génération des lignes de tableau de soldes.
 *
 * @description
 * Génère les lignes pour BalancesTable avec toutes les données de calcul :
 * - Lignes personnelles avec transferts calculés (contributeurs uniquement)
 * - Ligne joint avec gap et sources de financement
 * - Ligne de total pour comptes personnels
 * - Montant LDDS nécessaire
 *
 * **Workflow de calcul :**
 * 1. Calculer le gap du compte joint (pending - balance)
 * 2. Déterminer le montant à prendre des comptes persos (min entre gap et excédent)
 * 3. Passe 1 : Identifier contributeurs (montant théorique > 10€)
 * 4. Passe 2 : Redistribuer proportionnellement aux contributeurs
 * 5. Calculer le complément LDDS si nécessaire
 *
 * @param {UseBalancesRowsParams} params - Paramètres de calcul
 * @returns {Object} Lignes et totaux
 * @returns {Array} jointRows - Lignes du compte joint (0 ou 1)
 * @returns {Array} personalRows - Lignes des comptes personnels
 * @returns {Object} totalPersonalRow - Ligne de total des comptes persos
 * @returns {number} virLddsTotal - Montant du virement LDDS nécessaire
 *
 * @example
 * ```tsx
 * const { jointRows, personalRows, totalPersonalRow, virLddsTotal } = useBalancesRows({
 *   accounts,
 *   people,
 *   budgetPeriodeGlobal,
 *   totalPersonalBalance,
 *   distributableBalance,
 *   jointAccount,
 *   personalAccounts,
 *   stats
 * });
 * ```
 */
export const useBalancesRows = ({
  _accounts,
  people,
  _budgetPeriodeGlobal,
  totalPersonalBalance,
  distributableBalance,
  jointAccount,
  personalAccounts,
  stats,
}: UseBalancesRowsParams) => {
  return useMemo(() => {
    const jRows: BalanceRow[] = [];
    const pRows: BalanceRow[] = [];

    // --- ÉTAPE 1 : Calculer le gap du compte joint ---
    let jointGap = 0;
    let jointTarget = 0;

    if (jointAccount) {
      const jointStats = stats.byAccount[jointAccount.id];
      const pendingOnJoint = jointStats ? jointStats.remaining : 0;
      jointTarget = pendingOnJoint;
      jointGap = pendingOnJoint - jointAccount.currentBalance;
    }

    // --- ÉTAPE 2 : Répartir la ponction proportionnellement aux soldes ---
    const amountToTakeFromPersonals = Math.max(0, Math.min(jointGap, totalPersonalBalance - distributableBalance));

    const totalTransfersToPersonals = 0;
    let totalSurplusFromPersonals = 0;

    // PASSE 1 : Identifier qui peut contribuer (> seuil 10€)
    const contributorAccounts = personalAccounts.filter((acc) => {
      const shareOfTotal = totalPersonalBalance > 0 ? acc.currentBalance / totalPersonalBalance : 0;
      const amountToTake = amountToTakeFromPersonals * shareOfTotal;
      return amountToTake > 10;
    });

    // PASSE 2 : Calculer les transferts effectifs
    const totalContributorBalance = contributorAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    for (const acc of personalAccounts) {
      const owner = people.find((p) => p.id === acc.ownerId);
      let transferAmount = 0;

      const isContributor = contributorAccounts.some((c) => c.id === acc.id);
      const shareOfTotal = totalPersonalBalance > 0 ? acc.currentBalance / totalPersonalBalance : 0;
      const theoreticalAmount = amountToTakeFromPersonals * shareOfTotal;

      if (isContributor && totalContributorBalance > 0) {
        // Ce compte contribue : calculer sa part proportionnelle du total nécessaire
        const shareOfContributors = acc.currentBalance / totalContributorBalance;
        const amountToTake = amountToTakeFromPersonals * shareOfContributors;

        transferAmount = -amountToTake;
        totalSurplusFromPersonals += amountToTake;
      } else {
        // Ce compte ne contribue pas (montant trop faible)
        transferAmount = 0;
      }

      const targetBalance = acc.currentBalance + transferAmount;

      pRows.push({
        id: acc.id,
        name: acc.name,
        owner: owner?.name || "Inconnu",
        balance: acc.currentBalance,
        target: targetBalance,
        transfer: transferAmount,
        isJoint: false,
        ratio: acc.targetRatio,
        cap: acc.targetCap,
        calculation: {
          sharePercent: shareOfTotal * 100,
          theoreticalAmount: theoreticalAmount,
          isContributor: isContributor,
        },
      });
    }

    // --- LOGIQUE COMPTE JOINT ---
    let jointTransferNeeded = 0;

    if (jointAccount) {
      const owner = people.find((p) => p.id === jointAccount.ownerId);

      // Si les comptes persos ont des excédents, on les utilise d'abord avant le LDDS
      let remainingGap = jointGap;
      if (remainingGap > 0 && totalSurplusFromPersonals > 0) {
        const surplusUsed = Math.min(remainingGap, totalSurplusFromPersonals);
        remainingGap -= surplusUsed;
      }

      // Si le solde + excédents persos couvrent les dettes, pas besoin du LDDS
      jointTransferNeeded = Math.max(0, remainingGap);

      jRows.push({
        id: jointAccount.id,
        name: jointAccount.name,
        owner: owner?.name || "Commun",
        balance: jointAccount.currentBalance,
        target: jointTarget,
        transfer: jointGap,
        isJoint: true,
        calculation: {
          jointDebts: jointTarget,
          jointGap: jointGap,
          fromPersonals: totalSurplusFromPersonals,
          fromLdds: jointTransferNeeded,
        },
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
    const globalTransfer = jointTransferNeeded + totalTransfersToPersonals;

    // Tri par libellé pour affichage cohérent
    jRows.sort((a, b) => a.name.localeCompare(b.name));
    pRows.sort((a, b) => a.name.localeCompare(b.name));

    return { jointRows: jRows, personalRows: pRows, totalPersonalRow, virLddsTotal: globalTransfer };
  }, [people, totalPersonalBalance, jointAccount, personalAccounts, stats, distributableBalance]);
};

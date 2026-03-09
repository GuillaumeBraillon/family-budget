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
  pendingAmount?: number; // Total des opérations en attente
  pendingStandard?: number; // Opérations en attente Standard (dans le budget)
  pendingExtra?: number; // Opérations en attente Extra (hors budget)
  paidAmount?: number; // Total des opérations pointées
  paidStandard?: number; // Opérations pointées Standard (dans le budget)
  paidExtra?: number; // Opérations pointées Extra (hors budget)
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
  people: Person[];
  jointAccount: Account | undefined;
  personalAccounts: Account[];
  consumedDetails: { beneficiaryId: string; name: string; amount: number; available: number; remaining: number }[];
  stats: {
    byAccount: Record<
      string,
      {
        remaining: number;
        remainingStandard: number;
        paid: number;
        paidStandard: number;
      }
    >;
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
 *   totalPersonalBudgetAmount,
 *   totalPersonalBalanceAmount,
 *   distributableBudgetAmount,
 *   jointAccount,
 *   personalAccounts,
 *   stats
 * });
 * ```
 */
export const useBalancesRows = ({ people, jointAccount, personalAccounts, consumedDetails, stats }: UseBalancesRowsParams) => {
  return useMemo(() => {
    const jRows: BalanceRow[] = [];
    const pRows: BalanceRow[] = [];

    let lddsToJoint = 0;
    let lddsToPersonals = 0;

    for (const acc of personalAccounts) {
      const owner = people.find((p) => p.id === acc.ownerId);
      const beneficiaryPocket = consumedDetails.find((detail) => detail.beneficiaryId === acc.ownerId);
      const pocketToAdd = beneficiaryPocket?.available || 0;

      const pending = stats.byAccount[acc.id]?.remaining || 0;
      const pendingStandard = stats.byAccount[acc.id]?.remainingStandard || 0;
      const paid = stats.byAccount[acc.id]?.paid || 0;
      const paidStandard = stats.byAccount[acc.id]?.paidStandard || 0;

      pRows.push({
        id: acc.id,
        name: acc.name,
        owner: owner?.name || "Inconnu",
        balance: acc.currentBalance,
        target: acc.currentBalance + pocketToAdd,
        transfer: pocketToAdd,
        isJoint: false,
        ratio: acc.targetRatio,
        cap: acc.targetCap,
        pendingAmount: pending,
        pendingStandard: pendingStandard,
        pendingExtra: pending - pendingStandard,
        paidAmount: paid,
        paidStandard: paidStandard,
        paidExtra: paid - paidStandard,
        calculation: {
          theoreticalAmount: pocketToAdd,
          isContributor: false,
        },
      });

      lddsToPersonals += pocketToAdd;
    }

    // --- LOGIQUE COMPTE JOINT ---

    if (jointAccount) {
      const owner = people.find((p) => p.id === jointAccount.ownerId);

      const jointPending = stats.byAccount[jointAccount.id]?.remaining || 0;
      const jointPendingStandard = stats.byAccount[jointAccount.id]?.remainingStandard || 0;
      const jointPaid = stats.byAccount[jointAccount.id]?.paid || 0;
      const jointPaidStandard = stats.byAccount[jointAccount.id]?.paidStandard || 0;

      // Besoin factures : couvrir uniquement le standard en attente sur le compte joint
      const projectedAfterStandardPending = jointAccount.currentBalance + jointPendingStandard;
      const jointTransferNeeded = Math.max(0, -projectedAfterStandardPending);
      lddsToJoint = jointTransferNeeded;

      const targetBalance = jointAccount.currentBalance + jointTransferNeeded;
      const standardDebts = Math.max(0, -jointPendingStandard);

      jRows.push({
        id: jointAccount.id,
        name: jointAccount.name,
        owner: owner?.name || "Commun",
        balance: jointAccount.currentBalance,
        target: targetBalance,
        transfer: jointTransferNeeded,
        isJoint: true,
        pendingAmount: jointPending,
        pendingStandard: jointPendingStandard,
        pendingExtra: jointPending - jointPendingStandard,
        paidAmount: jointPaid,
        paidStandard: jointPaidStandard,
        paidExtra: jointPaid - jointPaidStandard,
        calculation: {
          jointDebts: standardDebts,
          jointGap: jointTransferNeeded,
          fromPersonals: 0,
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
      pendingAmount: pRows.reduce((sum, r) => sum + (r.pendingAmount || 0), 0),
    };

    const globalTransfer = lddsToJoint + lddsToPersonals;

    // Tri par libellé pour affichage cohérent
    jRows.sort((a, b) => a.name.localeCompare(b.name));
    pRows.sort((a, b) => a.name.localeCompare(b.name));

    return {
      jointRows: jRows,
      personalRows: pRows,
      totalPersonalRow,
      virLddsTotal: globalTransfer,
      lddsToJoint,
      lddsToPersonals,
    };
  }, [people, jointAccount, personalAccounts, consumedDetails, stats]);
};

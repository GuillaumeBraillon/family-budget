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
import { logger } from "../../services/logger";

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
  _accounts: Account[];
  people: Person[];
  budgetPeriodeGlobal: number;
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
  budgetPeriodeGlobal: _budgetPeriodeGlobal,
  totalPersonalBalance,
  distributableBalance,
  jointAccount,
  personalAccounts,
  stats,
}: UseBalancesRowsParams) => {
  return useMemo(() => {
    const jRows: BalanceRow[] = [];
    const pRows: BalanceRow[] = [];

    // Variables pour le détail des virements LDDS
    let lddsToJoint = 0;
    let lddsToPersonals = 0;

    // --- ÉTAPE 1 : Calculer le gap du compte joint ---
    let jointGap = 0;
    let jointTarget = 0;

    if (jointAccount) {
      const jointStats = stats.byAccount[jointAccount.id];
      const pendingOnJoint = jointStats ? jointStats.remaining : 0;

      // Target : Montant des dépenses à couvrir (valeur absolue)
      jointTarget = pendingOnJoint < 0 ? -pendingOnJoint : 0;

      // Gap : Ce qu'il manque pour finir à l'équilibre (0€) après paiement des opérations en attente
      // Solde Prévisionnel = Solde Actuel + Opérations en attente
      // Gap = 0 - Solde Prévisionnel
      const projectedBalance = jointAccount.currentBalance + pendingOnJoint;
      jointGap = -projectedBalance;
    }

    // --- ÉTAPE 2 : Calculer excédent OU déficit budgétaire global ---
    // RÈGLE MÉTIER GLOBALE :
    // - Si Total Soldes > Reste sur Période → Excédent (on prélève vers Joint)
    // - Si Total Soldes < Reste sur Période → Déficit (on alimente depuis LDDS via Joint)

    // Calcul de l'excédent ou déficit global
    const globalSurplus = totalPersonalBalance - distributableBalance;

    // Deux cas de figure :
    // 1. globalSurplus > 0 : Excédent → prélèvement vers joint
    // 2. globalSurplus < 0 : Déficit → alimentation depuis LDDS
    const amountToTakeFromPersonals = Math.max(0, Math.min(jointGap, globalSurplus));
    const amountToGiveToPersonals = Math.max(0, -globalSurplus);

    let totalTransfersToPersonals = 0;
    let totalSurplusFromPersonals = 0;

    // CAS 1 : Déficit global → Alimenter les comptes personnels
    if (globalSurplus < -0.01) {
      // NOUVELLE LOGIQUE : Répartir selon l'écart entre solde actuel et cible
      const TRANSFER_THRESHOLD = 20; // Seuil minimum pour éviter petits virements
      const totalRatio = personalAccounts.filter((acc) => acc.targetRatio && acc.targetRatio > 0).reduce((sum, acc) => sum + (acc.targetRatio || 0), 0);

      // Calculer les écarts pour chaque compte
      const accountGaps = personalAccounts.map((acc) => {
        if (!acc.targetRatio || acc.targetRatio <= 0 || totalRatio <= 0) {
          return { account: acc, targetBalance: acc.currentBalance, gap: 0 };
        }

        // Cible = ratio × reste disponible
        const targetBalance = (acc.targetRatio / totalRatio) * distributableBalance;

        // Gap = cible - solde actuel (positif si besoin, négatif si excédent)
        let gap = targetBalance - acc.currentBalance;

        // Si cap défini, limiter la cible
        if (acc.targetCap !== undefined && targetBalance > acc.targetCap) {
          gap = Math.max(0, acc.targetCap - acc.currentBalance);
        }

        return { account: acc, targetBalance, gap };
      });

      // Calculer le total des gaps positifs (besoins)
      const totalPositiveGaps = accountGaps.reduce((sum, item) => sum + Math.max(0, item.gap), 0);

      for (const item of accountGaps) {
        const acc = item.account;
        const owner = people.find((p) => p.id === acc.ownerId);
        let transferAmount = 0;

        if (item.gap > 0) {
          // Ce compte a besoin d'argent
          // Calculer sa part du montant disponible proportionnellement à son besoin
          const shareOfNeeds = totalPositiveGaps > 0 ? item.gap / totalPositiveGaps : 0;
          let calculatedTransfer = shareOfNeeds * amountToGiveToPersonals;

          // Ne pas dépasser le besoin réel du compte
          calculatedTransfer = Math.min(calculatedTransfer, item.gap);

          // Appliquer le seuil : pas de virement si < 20€
          if (calculatedTransfer >= TRANSFER_THRESHOLD) {
            transferAmount = calculatedTransfer;
          }

          totalTransfersToPersonals += transferAmount;
        }

        const targetBalance = acc.currentBalance + transferAmount;
        const pending = stats.byAccount[acc.id]?.remaining || 0;
        const pendingStandard = stats.byAccount[acc.id]?.remainingStandard || 0;
        const paid = stats.byAccount[acc.id]?.paid || 0;
        const paidStandard = stats.byAccount[acc.id]?.paidStandard || 0;

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
          pendingAmount: pending,
          pendingStandard: pendingStandard,
          pendingExtra: pending - pendingStandard,
          paidAmount: paid,
          paidStandard: paidStandard,
          paidExtra: paid - paidStandard,
          calculation: {
            sharePercent: acc.targetRatio || 0,
            theoreticalAmount: ((acc.targetRatio || 0) * amountToGiveToPersonals) / 100,
            isContributor: false, // Ils reçoivent, ne contribuent pas
          },
        });
      }
    }
    // CAS 2 : Aucun excédent/déficit → Pas de transfert
    else if (globalSurplus >= -0.01 && globalSurplus <= 0.01) {
      // Générer les lignes sans transfert
      for (const acc of personalAccounts) {
        const owner = people.find((p) => p.id === acc.ownerId);
        const pending = stats.byAccount[acc.id]?.remaining || 0;
        const pendingStandard = stats.byAccount[acc.id]?.remainingStandard || 0;
        const paid = stats.byAccount[acc.id]?.paid || 0;
        const paidStandard = stats.byAccount[acc.id]?.paidStandard || 0;

        pRows.push({
          id: acc.id,
          name: acc.name,
          owner: owner?.name || "Inconnu",
          balance: acc.currentBalance,
          target: acc.currentBalance,
          transfer: 0,
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
            sharePercent: totalPersonalBalance > 0 ? (acc.currentBalance / totalPersonalBalance) * 100 : 0,
            theoreticalAmount: 0,
            isContributor: false,
          },
        });
      }
    }
    // CAS 3 : Excédent global → Prélever vers joint (logique existante)
    else {
      // PASSE 1 : Identifier qui peut contribuer (> seuil 10€)
      const CONTRIBUTION_THRESHOLD = 10; // Seuil minimum pour participer à la contribution
      const contributorAccounts = personalAccounts.filter((acc) => {
        const shareOfTotal = totalPersonalBalance > 0 ? acc.currentBalance / totalPersonalBalance : 0;
        const theoreticalContribution = amountToTakeFromPersonals * shareOfTotal;
        return theoreticalContribution > CONTRIBUTION_THRESHOLD;
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

          // PROTECTION : Ne jamais mettre un compte courant en découvert
          // On limite le prélèvement au solde disponible
          const maxCanTake = Math.max(0, acc.currentBalance);
          const actualAmountToTake = Math.min(amountToTake, maxCanTake);

          transferAmount = -actualAmountToTake;
          totalSurplusFromPersonals += actualAmountToTake;
        } else {
          // Ce compte ne contribue pas (montant trop faible)
          transferAmount = 0;
        }

        const targetBalance = acc.currentBalance + transferAmount;
        const pending = stats.byAccount[acc.id]?.remaining || 0;
        const pendingStandard = stats.byAccount[acc.id]?.remainingStandard || 0;
        const paid = stats.byAccount[acc.id]?.paid || 0;
        const paidStandard = stats.byAccount[acc.id]?.paidStandard || 0;

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
          pendingAmount: pending,
          pendingStandard: pendingStandard,
          pendingExtra: pending - pendingStandard,
          paidAmount: paid,
          paidStandard: paidStandard,
          paidExtra: paid - paidStandard,
          calculation: {
            sharePercent: shareOfTotal * 100,
            theoreticalAmount: theoreticalAmount,
            isContributor: isContributor,
          },
        });
      }
    }

    // --- LOGIQUE COMPTE JOINT ---
    let jointTransferNeeded = 0;

    if (jointAccount) {
      const owner = people.find((p) => p.id === jointAccount.ownerId);

      // FLUX 1 : Si les comptes persos ont des excédents, on les utilise pour financer le joint
      let remainingGap = jointGap;
      if (remainingGap > 0 && totalSurplusFromPersonals > 0) {
        const surplusUsed = Math.min(remainingGap, totalSurplusFromPersonals);
        remainingGap -= surplusUsed;
      }

      // FLUX 2 : Si besoin de financer le joint depuis LDDS
      lddsToJoint = Math.max(0, remainingGap);

      // FLUX 3 : Si besoin de financer les comptes persos depuis LDDS (via joint)
      lddsToPersonals = totalTransfersToPersonals;

      // Total du virement LDDS nécessaire = flux vers joint + flux vers persos
      jointTransferNeeded = lddsToJoint + lddsToPersonals;

      logger.debug("balances-rows", "Calcul virement LDDS", {
        globalSurplus,
        distributableBalance,
        totalPersonalBalance,
        amountToGiveToPersonals,
        totalTransfersToPersonals,
        lddsToJoint,
        lddsToPersonals,
        jointTransferNeeded,
      });

      const jointPending = stats.byAccount[jointAccount.id]?.remaining || 0;
      const jointPendingStandard = stats.byAccount[jointAccount.id]?.remainingStandard || 0;
      const jointPaid = stats.byAccount[jointAccount.id]?.paid || 0;
      const jointPaidStandard = stats.byAccount[jointAccount.id]?.paidStandard || 0;

      // CORRECTION : Gestion du surplus avec priorité aux comptes courants
      // - Si besoin (jointGap > 0) : transfert depuis LDDS
      // - Si surplus ET comptes persos ont besoin (globalSurplus < 0) : utiliser surplus pour combler besoin persos
      // - Si surplus ET comptes persos OK :
      //   * Petit surplus (≤ 20€) : pas de transfert (tolérance)
      //   * Gros surplus (> 20€) : transfert négatif vers LDDS
      const SURPLUS_THRESHOLD = 20; // Seuil en dessous duquel on garde le surplus

      let effectiveTransfer = 0;
      if (jointGap > 0) {
        // Besoin : transfert positif depuis LDDS
        effectiveTransfer = jointGap;
      } else if (amountToGiveToPersonals > 0) {
        // Surplus du joint ET comptes persos ont besoin : utiliser le surplus pour combler le besoin
        const surplusAvailable = Math.abs(jointGap);
        const surplusUsedForPersonals = Math.min(surplusAvailable, amountToGiveToPersonals);
        // Le surplus est utilisé pour les persos, donc transfert = 0 (ou le reste si tout n'est pas utilisé)
        const remainingSurplus = surplusAvailable - surplusUsedForPersonals;
        effectiveTransfer = remainingSurplus > SURPLUS_THRESHOLD ? -remainingSurplus : 0;
      } else {
        // Surplus du joint ET comptes persos OK : transférer vers LDDS si > seuil
        effectiveTransfer = Math.abs(jointGap) > SURPLUS_THRESHOLD ? jointGap : 0;
      }

      // CORRECTION : Le solde prévu = solde actuel + virement
      const targetBalance = jointAccount.currentBalance + effectiveTransfer;

      jRows.push({
        id: jointAccount.id,
        name: jointAccount.name,
        owner: owner?.name || "Commun",
        balance: jointAccount.currentBalance,
        target: targetBalance,
        transfer: effectiveTransfer,
        isJoint: true,
        pendingAmount: jointPending,
        pendingStandard: jointPendingStandard,
        pendingExtra: jointPending - jointPendingStandard,
        paidAmount: jointPaid,
        paidStandard: jointPaidStandard,
        paidExtra: jointPaid - jointPaidStandard,
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
      pendingAmount: pRows.reduce((sum, r) => sum + (r.pendingAmount || 0), 0),
    };

    // --- SYNTHÈSE GLOBALE ---
    const globalTransfer = jointTransferNeeded + totalTransfersToPersonals;

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
  }, [people, totalPersonalBalance, jointAccount, personalAccounts, stats, distributableBalance]);
};

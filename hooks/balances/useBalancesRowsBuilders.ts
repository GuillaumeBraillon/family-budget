import { Account, Person, BalanceRow, BalancesStats, ConsumedDetail } from "../../types";

export interface TransferSummary {
  exactLddsToPivot: number;
  roundedLddsToPivot: number;
  jointPendingNeed: number;
  netPersonalNeed: number;
  hasNeedToPivot: boolean;
  hasReturnToLdds: boolean;
}

export const buildPersonalRows = (personalAccounts: Account[], people: Person[], consumedDetails: ConsumedDetail[], stats: BalancesStats) => {
  const rows = personalAccounts.map((acc) => {
    const owner = people.find((p) => p.id === acc.ownerId);
    const beneficiaryPocket = consumedDetails.find((detail) => detail.beneficiaryId === acc.ownerId);
    const targetBalance = beneficiaryPocket?.remaining || 0;
    const deficit = Math.max(0, targetBalance - acc.currentBalance);
    const excess = Math.max(0, acc.currentBalance - targetBalance);
    // Positif: le pivot doit alimenter le compte perso. Negatif: le compte perso peut alimenter le pivot.
    const pivotTransfer = deficit - excess;

    const pending = stats.byAccount[acc.id]?.remaining || 0;
    const pendingStandard = stats.byAccount[acc.id]?.remainingStandard || 0;
    const paid = stats.byAccount[acc.id]?.paid || 0;
    const paidStandard = stats.byAccount[acc.id]?.paidStandard || 0;

    return {
      id: acc.id,
      name: acc.name,
      owner: owner?.name || "Inconnu",
      balance: acc.currentBalance,
      target: targetBalance,
      transfer: pivotTransfer,
      isJoint: false,
      pendingAmount: pending,
      pendingStandard: pendingStandard,
      pendingExtra: pending - pendingStandard,
      paidAmount: paid,
      paidStandard: paidStandard,
      paidExtra: paid - paidStandard,
      calculation: {
        theoreticalAmount: targetBalance,
        isContributor: false,
      },
    } as BalanceRow;
  });

  const lddsToPersonals = rows.reduce((sum, r) => sum + (r.transfer || 0), 0);

  return { personalRows: rows, lddsToPersonals };
};

export const buildJointRows = (jointAccount: Account | undefined, people: Person[], stats: BalancesStats) => {
  if (!jointAccount) return { jointRows: [], lddsToJoint: 0 };

  const owner = people.find((p) => p.id === jointAccount.ownerId);

  const jointPending = stats.byAccount[jointAccount.id]?.remaining || 0;
  const jointPendingStandard = stats.byAccount[jointAccount.id]?.remainingStandard || 0;
  const jointPaid = stats.byAccount[jointAccount.id]?.paid || 0;
  const jointPaidStandard = stats.byAccount[jointAccount.id]?.paidStandard || 0;

  const projectedAfterPending = jointAccount.currentBalance + jointPending;
  const requiredForPending = Math.max(0, -jointPending);
  const maxAllowedBalance = requiredForPending * 1.1;

  const jointTransferNeeded =
    jointAccount.currentBalance > maxAllowedBalance ? -(jointAccount.currentBalance - requiredForPending) : Math.max(0, -projectedAfterPending);

  const row: BalanceRow = {
    id: jointAccount.id,
    name: jointAccount.name,
    owner: owner?.name || "Commun",
    balance: jointAccount.currentBalance,
    target: jointAccount.currentBalance + jointTransferNeeded,
    transfer: jointTransferNeeded,
    isJoint: true,
    pendingAmount: jointPending,
    pendingStandard: jointPendingStandard,
    pendingExtra: jointPending - jointPendingStandard,
    paidAmount: jointPaid,
    paidStandard: jointPaidStandard,
    paidExtra: jointPaid - jointPaidStandard,
    calculation: {
      jointDebts: Math.max(0, -jointPending),
      jointGap: jointTransferNeeded,
      fromPersonals: 0,
      fromLdds: jointTransferNeeded,
    },
  };

  return { jointRows: [row], lddsToJoint: jointTransferNeeded };
};

export const computeTotals = (personalRows: BalanceRow[], jointRows: BalanceRow[]) => {
  const totalPersonalRow: BalanceRow = {
    id: "total",
    name: "TOTAL",
    owner: "",
    balance: personalRows.reduce((sum, r) => sum + r.balance, 0),
    target: personalRows.reduce((sum, r) => sum + r.target, 0),
    transfer: personalRows.reduce((sum, r) => sum + r.transfer, 0),
    isJoint: false,
    pendingAmount: personalRows.reduce((sum, r) => sum + (r.pendingAmount || 0), 0),
  };

  const lddsToPersonals = personalRows.reduce((sum, r) => sum + (r.transfer || 0), 0);
  const lddsToJoint = jointRows.reduce((sum, r) => sum + (r.transfer || 0), 0);
  // Le LDDS alimente uniquement le pivot. Le pivot couvre ensuite les persos.
  // On compense d'abord deficits/excedents perso avant de solliciter le LDDS.
  const exactLddsToPivot = lddsToJoint + lddsToPersonals;
  const roundedLddsToPivot =
    exactLddsToPivot > 0 ? Math.ceil(exactLddsToPivot / 5) * 5 : exactLddsToPivot < 0 ? -Math.ceil(Math.abs(exactLddsToPivot) / 5) * 5 : 0;

  const transferSummary: TransferSummary = {
    exactLddsToPivot,
    roundedLddsToPivot,
    jointPendingNeed: lddsToJoint,
    netPersonalNeed: lddsToPersonals,
    hasNeedToPivot: roundedLddsToPivot > 0,
    hasReturnToLdds: roundedLddsToPivot < 0,
  };

  jointRows.sort((a, b) => a.name.localeCompare(b.name));
  personalRows.sort((a, b) => a.name.localeCompare(b.name));

  return { totalPersonalRow, transferSummary };
};

export default { buildPersonalRows, buildJointRows, computeTotals };

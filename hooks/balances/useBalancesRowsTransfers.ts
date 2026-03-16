import { Account, BalancesStats, ConsumedDetail } from "../../types";

export const computeLddsTransfers = (personalAccounts: Account[], consumedDetails: ConsumedDetail[], stats: BalancesStats, jointAccount?: Account) => {
  const lddsToPersonals = personalAccounts.reduce((sum, acc) => {
    const beneficiaryPocket = consumedDetails.find((d) => d.beneficiaryId === acc.ownerId);
    const pocketToAdd = beneficiaryPocket?.available || 0;
    return sum + pocketToAdd;
  }, 0);

  let lddsToJoint = 0;
  if (jointAccount) {
    const jointPendingStandard = stats.byAccount[jointAccount.id]?.remainingStandard || 0;
    const projectedAfterStandardPending = jointAccount.currentBalance + jointPendingStandard;
    const jointTransferNeeded = Math.max(0, -projectedAfterStandardPending);
    lddsToJoint = jointTransferNeeded;
  }

  return { lddsToPersonals, lddsToJoint };
};

export default computeLddsTransfers;

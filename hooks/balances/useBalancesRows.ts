import { useMemo } from "react";
import { Account, Person, BalanceRow, BalancesStats, ConsumedDetail } from "../../types";
import { buildPersonalRows, buildJointRows, computeTotals, TransferSummary } from "./useBalancesRowsBuilders";

export type { BalanceRow } from "../../types";

interface UseBalancesRowsParams {
  people: Person[];
  jointAccount: Account | undefined;
  personalAccounts: Account[];
  consumedDetails: ConsumedDetail[];
  stats: BalancesStats;
}

export interface UseBalancesRowsReturn {
  jointRows: BalanceRow[];
  personalRows: BalanceRow[];
  totalPersonalRow: BalanceRow;
  transferSummary: TransferSummary;
}

export const useBalancesRows = ({ people, jointAccount, personalAccounts, consumedDetails, stats }: UseBalancesRowsParams): UseBalancesRowsReturn => {
  return useMemo(() => {
    const { personalRows } = buildPersonalRows(personalAccounts, people, consumedDetails, stats);
    const { jointRows } = buildJointRows(jointAccount, people, stats);

    const { totalPersonalRow, transferSummary } = computeTotals(personalRows, jointRows);

    return {
      jointRows,
      personalRows,
      totalPersonalRow,
      transferSummary,
    };
  }, [people, jointAccount, personalAccounts, consumedDetails, stats]);
};

export default useBalancesRows;

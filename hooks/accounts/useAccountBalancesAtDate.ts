import { useMemo } from "react";
import { Account, PaidItemDetails, Transfer, VariableTransaction } from "../../types";

/**
 * Formate une Date en string "YYYY-MM-DD" (format ISO sans heure).
 */
const toDateKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Calcule les soldes des comptes à la fin de la période/date sélectionnée.
 *
 * Principe : currentBalance = solde aujourd'hui = "tout inclus jusqu'à maintenant".
 * Pour remonter à la date de coupure, on annule rétroactivement toutes les
 * opérations STRICTEMENT POSTÉRIEURES à cutoffDate.
 *
 * @param cutoffDate - Dernier jour inclus (fin de période ou fin de mois)
 * @returns accounts avec currentBalance ajusté
 */
export const useAccountBalancesAtDate = (
  accounts: Account[],
  paidItems: Record<string, PaidItemDetails>,
  variableTransactions: VariableTransaction[],
  transfers: Transfer[],
  cutoffDate: Date
): Account[] => {
  return useMemo(() => {
    const cutoffKey = toDateKey(cutoffDate);

    const deltas: Record<string, number> = {};
    const ensure = (id: string) => {
      if (deltas[id] === undefined) deltas[id] = 0;
    };

    // 1. PaidItems pointés (hors en attente) postérieurs à la date de coupure
    Object.values(paidItems).forEach((item) => {
      // paymentDate est "YYYY-MM-DD"
      if (item.paymentDate <= cutoffKey) return;
      if (item.isWaiting) return;
      ensure(item.accountId);
      if (item.type === "EXPENSE") deltas[item.accountId] += item.amount;
      if (item.type === "INCOME") deltas[item.accountId] -= item.amount;
    });

    // 2. VariableTransactions pointées (hors en attente et hors virements internes) postérieures
    variableTransactions.forEach((tx) => {
      if (tx.date <= cutoffKey) return;
      if (tx.isWaiting) return;
      if (tx.category === "Virement Interne") return;
      ensure(tx.accountId);
      if (tx.type === "EXPENSE") deltas[tx.accountId] += tx.amount;
      if (tx.type === "INCOME") deltas[tx.accountId] -= tx.amount;
    });

    // 3. Transfers postérieurs
    transfers.forEach((t) => {
      if (t.date <= cutoffKey) return;
      ensure(t.sourceAccountId);
      ensure(t.destinationAccountId);
      deltas[t.sourceAccountId] += t.amount;
      deltas[t.destinationAccountId] -= t.amount;
    });

    return accounts.map((acc) => ({
      ...acc,
      currentBalance: acc.currentBalance + (deltas[acc.id] || 0),
    }));
  }, [accounts, paidItems, variableTransactions, transfers, cutoffDate]);
};

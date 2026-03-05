import React from "react";
import { PiggyBank, Wallet } from "lucide-react";
import { Account, AccountType } from "../../../../types";

interface SavingsSummaryCardProps {
  accounts: Account[];
}

export const SavingsSummaryCard: React.FC<SavingsSummaryCardProps> = ({ accounts }) => {
  if (accounts.length === 0) return null;

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === AccountType.CHECKING ? -1 : 1;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {sortedAccounts.map((acc) => {
        const balance = acc.currentBalance;
        const isSavings = acc.type === AccountType.SAVINGS;

        return (
          <div
            key={acc.id}
            className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                  isSavings ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                }`}
              >
                {isSavings ? <PiggyBank size={14} /> : <Wallet size={14} />}
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-slate-700 text-xs truncate">{acc.name}</h4>
                <p className="text-[9px] text-slate-500 font-medium uppercase truncate flex items-center gap-1">
                  {acc.bankName || "Banque"}
                  {acc.isJoint && <span className="bg-purple-100 text-purple-700 px-1 rounded-[2px] text-[8px] ml-1">JOINT</span>}
                </p>
              </div>
            </div>

            <div className="text-right pl-2">
              <span className={`font-semibold block text-xs ${balance < 0 ? "text-rose-600" : "text-slate-900"}`}>{balance.toFixed(2)} €</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

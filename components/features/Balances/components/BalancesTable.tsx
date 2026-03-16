import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "../../../ui/Card";
import { Wallet, Pencil, Check, X, Users, Calculator, AlertTriangle } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { BalanceRow } from "../../../../hooks/balances";

interface BalancesTableProps {
  rows: BalanceRow[];
  onUpdateBalance: (accountId: string, newBalance: number) => void;
  title?: string;
  totalRow?: BalanceRow;
  onNavigateToPlanner?: (date: Date, filters: Record<string, unknown>, weekNumber?: number) => void;
  currentDate?: Date;
  activeWeek?: number;
  totalPersonalRemainingAmount?: number;
  excessAccounts?: { accountName: string; excessAmount: number }[];
  deficitAccounts?: { accountName: string; deficitAmount: number }[];
}

/**
 * Composant réutilisable pour l'affichage harmonisé d'un solde avec tooltip
 */
interface BalanceDisplayProps {
  label: string;
  amount: number;
  onClick: (e: React.MouseEvent) => void;
  tooltipContent: React.ReactNode;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ label, amount, onClick, tooltipContent }) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-slate-500 font-medium">{label}</span>
      <div
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded font-mono font-bold text-xs text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        onClick={onClick}
        title="Cliquer pour modifier le solde"
      >
        {amount.toFixed(2)} €
        <button
          type="button"
          className="p-0.5 bg-slate-200 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
          aria-label="Modifier le solde"
          onClick={(e) => {
            e.stopPropagation();
            onClick(e);
          }}
        >
          <Pencil size={10} />
        </button>
      </div>
      <MobileTooltip
        text={tooltipContent}
        icon={<Calculator size={9} className="text-slate-400 hover:text-slate-600" />}
        widthClass="w-48"
        ariaLabel="Voir le détail du calcul"
      />
    </div>
  );
};

export const BalancesTable: React.FC<BalancesTableProps> = ({
  rows,
  onUpdateBalance,
  title,
  totalRow,
  onNavigateToPlanner,
  currentDate,
  activeWeek,
  totalPersonalRemainingAmount,
  excessAccounts = [],
  deficitAccounts = [],
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>("");
  const [editMode, setEditMode] = useState<"WITH_PENDING" | "WITHOUT_PENDING">("WITH_PENDING");

  const sortedRows = [...rows].sort((a, b) => b.name.localeCompare(a.name, "fr", { sensitivity: "base" }));
  const accountVarianceDisplayThreshold = 10;

  const excessByAccountName = excessAccounts.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.accountName] = entry.excessAmount;
    return acc;
  }, {});

  const deficitByAccountName = deficitAccounts.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.accountName] = entry.deficitAmount;
    return acc;
  }, {});

  const startEdit = (id: string, balance: number, e: React.MouseEvent, mode: "WITH_PENDING" | "WITHOUT_PENDING" = "WITH_PENDING") => {
    e.stopPropagation();
    setEditingId(id);
    setEditMode(mode);
    setTempBalance(balance.toFixed(2));
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setTempBalance("");
  };

  const saveEdit = (id: string, e: React.MouseEvent | React.KeyboardEvent, pendingAmount?: number) => {
    e.stopPropagation();
    const editedValue = parseFloat(tempBalance);
    if (!isNaN(editedValue)) {
      // Si on édite le solde hors attente, il faut recalculer le solde actuel
      // Solde actuel = Solde hors attente - Pending
      const finalBalance = editMode === "WITHOUT_PENDING" && pendingAmount !== undefined ? editedValue - pendingAmount : editedValue;
      onUpdateBalance(id, finalBalance);
    }
    setEditingId(null);
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm flex flex-col">
      {title && (
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-2.5">
          <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
            {title.includes("Pivot") ? <Users size={16} className="text-purple-600" /> : <Wallet size={16} className="text-indigo-600" />}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-2.5">Libellés</th>
              <th className="px-4 py-2.5 text-right">
                Solde Actuel
                <MobileTooltip
                  text={
                    <div className="space-y-1.5 text-[10px]">
                      <p className="font-bold text-indigo-700 border-b border-slate-200 pb-1 mb-1">Deux types de solde :</p>

                      <div className="flex items-start gap-2">
                        <span className="text-slate-800 font-bold">Solde réel</span>
                        <span className="text-slate-700">Solde sur le compte bancaire qui ne prend pas en compte les opérations en attente</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-indigo-700 font-bold">Solde prévisionnel</span>
                        <span className="text-slate-700">Prend en compte les opérations en attente</span>
                      </div>

                      <p className="text-slate-600 text-[9px] italic mt-1 pt-1 border-t border-slate-200">Cliquez sur le solde pour le modifier.</p>
                    </div>
                  }
                  iconClassName="text-indigo-500 hover:text-indigo-700 transition-colors"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => {
              return (
                <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${row.isJoint ? "bg-purple-50/30" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg text-slate-500 ${row.isJoint ? "bg-purple-100 text-purple-600" : "bg-slate-100"}`}>
                        {row.isJoint ? <Users size={16} /> : <Wallet size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{row.name}</p>
                          {row.isJoint && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wide">PIVOT</span>}
                          {!row.isJoint && (excessByAccountName[row.name] ?? 0) > accountVarianceDisplayThreshold && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold">
                              Excédent +{(excessByAccountName[row.name] ?? 0).toFixed(2)}€
                            </span>
                          )}
                          {!row.isJoint && (deficitByAccountName[row.name] ?? 0) > accountVarianceDisplayThreshold && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold">
                              Déficit -{(deficitByAccountName[row.name] ?? 0).toFixed(2)}€
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">({row.owner})</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-2.5 text-right cursor-pointer"
                    onClick={(e) => {
                      if (editingId !== row.id) startEdit(row.id, row.balance, e, "WITH_PENDING");
                    }}
                  >
                    {editingId === row.id ? (
                      <div className="flex flex-col items-end gap-1.5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <input
                            autoFocus
                            type="number"
                            step="0.01"
                            value={tempBalance}
                            onChange={(e) => setTempBalance(e.target.value)}
                            className="w-24 p-1 text-right text-xs border border-indigo-300 rounded bg-white text-slate-900 outline-none ring-2 ring-indigo-100 font-bold"
                            onKeyDown={(e) => e.key === "Enter" && saveEdit(row.id, e as React.KeyboardEvent<HTMLInputElement>, row.pendingAmount)}
                          />
                          <button
                            onClick={(e) => saveEdit(row.id, e, row.pendingAmount)}
                            className="bg-emerald-100 text-emerald-600 p-1 rounded hover:bg-emerald-200"
                            aria-label="Valider la modification"
                          >
                            <Check size={12} />
                          </button>
                          <button onClick={(e) => cancelEdit(e)} className="bg-slate-100 text-slate-500 p-1 rounded hover:bg-slate-200" aria-label="Annuler">
                            <X size={12} />
                          </button>
                        </div>
                        <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-medium">{editMode === "WITH_PENDING" ? "Édition: Solde prévisionnel" : "Édition: Solde réel"}</span>
                          {row.pendingAmount !== undefined && Math.abs(row.pendingAmount) > 0.01 && (
                            <>
                              <span className="text-slate-500">→</span>
                              <span className="font-medium">{editMode === "WITH_PENDING" ? "Solde réel:" : "Solde prévisionnel:"}</span>
                              <span className="font-mono font-bold text-slate-700">
                                {editMode === "WITH_PENDING"
                                  ? (parseFloat(tempBalance || "0") + row.pendingAmount).toFixed(2)
                                  : (parseFloat(tempBalance || "0") - row.pendingAmount).toFixed(2)}{" "}
                                €
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-0.5">
                        {/* Solde "Solde réél" */}
                        <BalanceDisplay
                          label="Solde réél:"
                          amount={row.balance}
                          onClick={(e) => {
                            if (editingId !== row.id) startEdit(row.id, row.balance, e, "WITH_PENDING");
                          }}
                          tooltipContent={
                            <div className="space-y-1 text-[10px]">
                              <ClickableAmount
                                date={currentDate}
                                filters={{ status: "REAL", nature: "EXCLUDE", accountIds: [row.id] }}
                                weekNumber={activeWeek}
                                onNavigate={onNavigateToPlanner}
                                className="flex items-center gap-1 hover:bg-blue-50 px-1 py-0.5 rounded cursor-pointer"
                                title="Cliquer pour voir les opérations standards réelles"
                              >
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-800 hover:text-slate-900">Dépenses standards</span>
                                  <span className="font-mono font-bold text-blue-700 hover:text-blue-800">{row.paidStandard.toFixed(2)}€</span>
                                </div>
                              </ClickableAmount>
                              <ClickableAmount
                                date={currentDate}
                                filters={{ status: "REAL", nature: "ONLY", accountIds: [row.id] }}
                                weekNumber={activeWeek}
                                onNavigate={onNavigateToPlanner}
                                className="flex items-center gap-1 hover:bg-purple-50 px-1 py-0.5 rounded cursor-pointer"
                                title="Cliquer pour voir les opérations Extra réelles"
                              >
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-800 hover:text-slate-900">Dépenses Extra</span>
                                  <span className="font-mono font-bold text-purple-700 hover:text-purple-800">{row.paidExtra.toFixed(2)}€</span>
                                </div>
                              </ClickableAmount>
                              <ClickableAmount
                                date={currentDate}
                                filters={{ status: "REAL", nature: "ALL", accountIds: [row.id] }}
                                weekNumber={activeWeek}
                                onNavigate={onNavigateToPlanner}
                                className="flex items-center gap-1 hover:bg-emerald-50 px-1 py-0.5 rounded cursor-pointer"
                                title="Cliquer pour voir toutes les opérations réelles"
                              >
                                <div className="flex justify-between gap-4 border-t border-slate-200 pt-1">
                                  <span className="text-slate-900 hover:text-slate-950 font-bold">Dépenses réelles</span>
                                  <span className="font-mono font-bold text-emerald-700 hover:text-emerald-800">{row.paidAmount.toFixed(2)}€</span>
                                </div>
                              </ClickableAmount>
                            </div>
                          }
                        />

                        {/* Solde "Solde prévisionnel"*/}
                        {row.pendingAmount !== undefined && Math.abs(row.pendingAmount) > 0.01 && (
                          <BalanceDisplay
                            label="Solde prévisionnel:"
                            amount={row.balance + row.pendingAmount}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(row.id, row.balance + row.pendingAmount, e, "WITHOUT_PENDING");
                            }}
                            tooltipContent={
                              <div className="space-y-1 text-[10px]">
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "REAL", nature: "ALL", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-emerald-50 px-1 py-0.5 rounded cursor-pointer"
                                  title="Cliquer pour voir les opérations réelles"
                                >
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-800 hover:text-slate-900">Solde actuel</span>
                                    <span className="font-mono font-bold text-emerald-700 hover:text-emerald-800">{row.balance.toFixed(2)}€</span>
                                  </div>
                                </ClickableAmount>
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "WAITING", nature: "ALL", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-amber-50 px-1 py-0.5 rounded cursor-pointer"
                                  title="Cliquer pour voir les opérations en attente"
                                >
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-800 hover:text-slate-900">En attente</span>
                                    <span className="font-mono font-bold text-amber-700 hover:text-amber-800">{row.pendingAmount.toFixed(2)}€</span>
                                  </div>
                                </ClickableAmount>
                                <div className="flex justify-between gap-4 border-t border-slate-200 pt-1">
                                  <span className="text-slate-900 font-bold">Solde hors attente</span>
                                  <span className="font-mono font-bold text-slate-950">{(row.balance + row.pendingAmount).toFixed(2)}€</span>
                                </div>
                              </div>
                            }
                          />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic">
                  Aucun compte trouvé pour cette section.
                </td>
              </tr>
            )}
          </tbody>
          {totalRow && (
            <tfoot className="bg-slate-100 border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
              <tr>
                <td className="px-4 py-2.5 flex items-center gap-2 uppercase tracking-wider">
                  <Calculator size={14} /> TOTAL
                </td>

                <td
                  className={`px-4 py-2.5 text-right ${
                    totalPersonalRemainingAmount !== undefined && totalRow.balance - totalPersonalRemainingAmount > accountVarianceDisplayThreshold
                      ? "text-rose-600 font-bold"
                      : totalPersonalRemainingAmount !== undefined && totalPersonalRemainingAmount - totalRow.balance > accountVarianceDisplayThreshold
                        ? "text-amber-600 font-bold"
                        : ""
                  }`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {totalPersonalRemainingAmount !== undefined && totalRow.balance - totalPersonalRemainingAmount > accountVarianceDisplayThreshold && (
                      <MobileTooltip
                        text={
                          <div className="space-y-1 text-[10px]">
                            <div className="font-bold text-rose-700">Supérieur au reste personnel total ({totalPersonalRemainingAmount.toFixed(2)}€)</div>
                            {excessAccounts.length > 0 ? (
                              <>
                                <div className="text-slate-600">Comptes en excédent :</div>
                                {excessAccounts.map((account) => (
                                  <div key={account.accountName} className="flex items-center justify-between gap-3">
                                    <span className="text-slate-700">{account.accountName}</span>
                                    <span className="font-bold text-rose-700">+{account.excessAmount.toFixed(2)}€</span>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="text-slate-600">Aucun compte en excédent identifié.</div>
                            )}
                          </div>
                        }
                        icon={<AlertTriangle size={14} className="text-rose-600" />}
                      />
                    )}
                    {totalPersonalRemainingAmount !== undefined && totalPersonalRemainingAmount - totalRow.balance > accountVarianceDisplayThreshold && (
                      <MobileTooltip
                        text={
                          <div className="space-y-1 text-[10px]">
                            <div className="font-bold text-amber-700">Inférieur au reste personnel total ({totalPersonalRemainingAmount.toFixed(2)}€)</div>
                            {deficitAccounts.length > 0 ? (
                              <>
                                <div className="text-slate-600">Comptes en déficit :</div>
                                {deficitAccounts.map((account) => (
                                  <div key={account.accountName} className="flex items-center justify-between gap-3">
                                    <span className="text-slate-700">{account.accountName}</span>
                                    <span className="font-bold text-amber-700">-{account.deficitAmount.toFixed(2)}€</span>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="text-slate-600">Aucun compte en déficit identifié.</div>
                            )}
                          </div>
                        }
                        icon={<AlertTriangle size={14} className="text-amber-600" />}
                      />
                    )}
                    {totalRow.balance.toFixed(2)} €
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
};

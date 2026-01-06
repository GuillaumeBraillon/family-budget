import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "../../../ui/Card";
import { Wallet, Pencil, Check, X, Users, Percent, Ban, Calculator } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";

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
}

interface BalancesTableProps {
  rows: BalanceRow[];
  onUpdateBalance: (accountId: string, newBalance: number) => void;
  title?: string;
  totalRow?: BalanceRow;
}

export const BalancesTable: React.FC<BalancesTableProps> = ({ rows, onUpdateBalance, title, totalRow }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>("");

  const startEdit = (id: string, balance: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(id);
    setTempBalance(balance.toString());
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setTempBalance("");
  };

  const saveEdit = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newBalance = parseFloat(tempBalance);
    if (!isNaN(newBalance)) {
      onUpdateBalance(id, newBalance);
    }
    setEditingId(null);
  };

  // Arrondi au multiple de 5 le plus proche pour les virements
  const roundTransfer = (amount: number) => Math.round(amount / 5) * 5;

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
                Solde Actuel (Réel)
                <MobileTooltip
                  text="Montant réel présent sur votre compte bancaire. Cliquez pour le modifier."
                  iconClassName="text-indigo-300 hover:text-indigo-100 transition-colors"
                />
              </th>
              <th className="px-4 py-2.5 text-right">
                Solde prévu
                <MobileTooltip
                  text="Solde projeté après virement (Solde Actuel + Virement). Correspond à l'objectif à atteindre une fois le transfert effectué."
                  iconClassName="text-indigo-300 hover:text-indigo-100 transition-colors"
                />
              </th>
              <th className="px-4 py-2.5 text-right bg-indigo-50/50 text-indigo-900">
                Virement
                <MobileTooltip
                  text="Montant à ajouter pour atteindre la cible (arrondi à 5€). Si Négatif, c'est un excédent à virer vers le compte pivot."
                  iconClassName="text-indigo-600 hover:text-indigo-400 transition-colors"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              // Pour assurer la cohérence visuelle A + B = C
              const roundedTransfer = roundTransfer(row.transfer);
              // On recalcule le solde prévu affiché basé sur le solde exact + virement arrondi
              const displayedTarget = row.balance + roundedTransfer;

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
                          <span className="text-[10px] text-slate-400">({row.owner})</span>
                        </div>

                        {/* Règles de Trésorerie */}
                        {!row.isJoint && (row.ratio !== undefined || row.cap !== undefined) && (
                          <div className="flex flex-wrap gap-1 mt-0.5 animate-in slide-in-from-left-2 duration-300">
                            {row.ratio !== undefined && (
                              <span
                                className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0 rounded border border-indigo-100 flex items-center gap-1"
                                title="Ratio appliqué sur le reste à vivre"
                              >
                                <Percent size={8} /> {row.ratio}%
                              </span>
                            )}
                            {row.cap !== undefined && (
                              <span
                                className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0 rounded border border-slate-200 flex items-center gap-1"
                                title="Plafond maximum de virement"
                              >
                                <Ban size={8} /> Max {row.cap}€
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-2.5 text-right cursor-pointer"
                    onClick={(e) => {
                      if (editingId !== row.id) startEdit(row.id, row.balance, e);
                    }}
                  >
                    {editingId === row.id ? (
                      <div className="flex items-center justify-end gap-2 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="number"
                          step="0.01"
                          value={tempBalance}
                          onChange={(e) => setTempBalance(e.target.value)}
                          className="w-20 p-1 text-right text-xs border border-indigo-300 rounded bg-white text-slate-900 outline-none ring-2 ring-indigo-100 font-bold"
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(row.id, e as any)}
                        />
                        <button onClick={(e) => saveEdit(row.id, e)} className="bg-emerald-100 text-emerald-600 p-1 rounded hover:bg-emerald-200">
                          <Check size={12} />
                        </button>
                        <button onClick={(e) => cancelEdit(e)} className="bg-slate-100 text-slate-500 p-1 rounded hover:bg-slate-200">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-medium text-slate-600 border-b border-dashed border-slate-300 pb-0.5 text-sm">{row.balance.toFixed(2)} €</span>
                        <div className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <Pencil size={12} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div
                      className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold text-xs"
                      title={`Exact: ${row.target.toFixed(2)} €`}
                    >
                      {displayedTarget.toFixed(2)} €
                    </div>
                    {row.isJoint && <p className="text-[9px] text-slate-400 mt-0.5">Inclus factures</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right bg-indigo-50/30 font-bold font-mono">
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-sm ${row.transfer > 0 ? "text-indigo-600" : "text-emerald-600"}`}
                        title={`Exact: ${row.transfer > 0 ? "+" : ""}${row.transfer.toFixed(2)} €`}
                      >
                        {row.transfer > 0 ? "+" : ""}
                        {roundedTransfer} €
                      </span>
                      <span className="text-[9px] text-indigo-400 uppercase font-medium">
                        {row.transfer > 0 ? (row.isJoint ? "Depuis LDDS" : "Depuis C. Joint") : row.isJoint ? "Vers LDDS" : "Vers C. Joint"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
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
                <td className="px-4 py-2.5 text-right">{totalRow.balance.toFixed(2)} €</td>
                <td className="px-4 py-2.5 text-right">
                  {/* Cohérence aussi pour le total : Solde + Virement */}
                  {(totalRow.balance + roundTransfer(totalRow.transfer)).toFixed(2)} €
                </td>
                <td className="px-4 py-2.5 text-right bg-indigo-100/50 text-indigo-800">
                  {roundTransfer(totalRow.transfer) > 0 ? "+" : ""}
                  {roundTransfer(totalRow.transfer)} €
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
};

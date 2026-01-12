import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "../../../ui/Card";
import { Wallet, Pencil, Check, X, Users, Percent, Ban, Calculator } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { BalanceRow } from "../../../../hooks/balances";
import { OperationFilters } from "../../../../types";

interface BalancesTableProps {
  rows: BalanceRow[];
  onUpdateBalance: (accountId: string, newBalance: number) => void;
  title?: string;
  totalRow?: BalanceRow;
  hasCurrentAccountsSurplus?: boolean;
}

export const BalancesTable: React.FC<BalancesTableProps> = ({
  rows,
  onUpdateBalance,
  title,
  totalRow,
  hasCurrentAccountsSurplus = false,
  onNavigateToPlanner,
  currentDate,
  activeWeek,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>("");
  const [editMode, setEditMode] = useState<"WITH_PENDING" | "WITHOUT_PENDING">("WITH_PENDING");

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

  // Fonction pour déterminer le label de virement intelligent
  const getTransferLabel = (row: BalanceRow): string => {
    if (row.transfer > 0) {
      // Crédit : le compte reçoit de l'argent
      if (row.isJoint) {
        // Compte joint : analyser les sources de financement
        const fromPersonals = row.calculation?.fromPersonals || 0;
        const fromLdds = row.calculation?.fromLdds || 0;

        if (fromPersonals > 0 && fromLdds > 0) {
          // Les deux sources contribuent
          return "Depuis C. Courants + LDDS";
        } else if (fromPersonals > 0) {
          // Uniquement comptes courants
          return "Depuis C. Courants";
        } else if (fromLdds > 0) {
          // Uniquement LDDS
          return "Depuis LDDS";
        } else {
          // Cas par défaut (ne devrait pas arriver)
          return "Depuis Épargne";
        }
      } else {
        return "Depuis C. Joint";
      }
    } else {
      // Débit : le compte donne de l'argent
      return row.isJoint ? "Vers LDDS" : "Vers C. Joint";
    }
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
                      <p className="font-bold text-indigo-300 border-b border-white/10 pb-1 mb-1">Deux visions du solde :</p>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-300 font-bold">Avec attente</span>
                        <span className="text-slate-300">Solde réel incluant les opérations non encore validées</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-300 font-bold">Hors attente</span>
                        <span className="text-slate-300">Solde en excluant les opérations à venir</span>
                      </div>
                      <p className="text-slate-400 text-[9px] italic mt-1 pt-1 border-t border-white/10">Cliquez sur le solde pour le modifier.</p>
                    </div>
                  }
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
                  text="Montant exact à transférer pour atteindre la cible. Si négatif, c'est un excédent à virer vers le compte pivot."
                  iconClassName="text-indigo-600 hover:text-indigo-400 transition-colors"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
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
                          >
                            <Check size={12} />
                          </button>
                          <button onClick={(e) => cancelEdit(e)} className="bg-slate-100 text-slate-500 p-1 rounded hover:bg-slate-200">
                            <X size={12} />
                          </button>
                        </div>
                        <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-medium">{editMode === "WITH_PENDING" ? "Édition: Avec attente" : "Édition: Hors attente"}</span>
                          {row.pendingAmount !== undefined && Math.abs(row.pendingAmount) > 0.01 && (
                            <>
                              <span className="text-slate-300">→</span>
                              <span className="font-medium">{editMode === "WITH_PENDING" ? "Hors attente:" : "Avec attente:"}</span>
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
                      <div className="flex flex-col items-end">
                        <div
                          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 rounded font-mono font-bold text-xs text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Cliquer pour modifier le solde"
                        >
                          {row.balance.toFixed(2)} €
                          <div className="p-0.5 bg-slate-200 rounded-full text-slate-400 hover:text-indigo-600 transition-colors">
                            <Pencil size={10} />
                          </div>
                        </div>
                        {/* Ligne "Hors attente" cliquable */}
                        {row.pendingAmount !== undefined && Math.abs(row.pendingAmount) > 0.01 && (
                          <div
                            className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(row.id, row.balance + row.pendingAmount, e, "WITHOUT_PENDING");
                            }}
                          >
                            <span className="font-medium">Hors attente:</span>
                            <span className="font-mono font-bold text-slate-700">{(row.balance + row.pendingAmount).toFixed(2)} €</span>
                            <div className="p-0.5 bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors">
                              <Pencil size={8} />
                            </div>
                            <MobileTooltip
                              text={
                                <div className="space-y-1 text-[10px]">
                                  <p className="font-bold text-slate-300 border-b border-white/10 pb-1 mb-1">Calcul :</p>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Solde actuel (avec attente)</span>
                                    <span className="font-mono font-bold text-slate-200">{row.balance.toFixed(2)}€</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Retrait de l'impact</span>
                                    <span className="font-mono font-bold text-emerald-300">+{row.pendingAmount.toFixed(2)}€</span>
                                  </div>
                                  <div className="flex justify-between gap-4 border-t border-white/10 pt-1">
                                    <span className="text-slate-300 font-bold">Hors attente</span>
                                    <span className="font-mono font-bold text-slate-100">{(row.balance + row.pendingAmount).toFixed(2)}€</span>
                                  </div>
                                  <p className="text-slate-400 text-[9px] italic mt-1 pt-1 border-t border-white/10">
                                    Solde réel sans l'impact des opérations futures.
                                  </p>
                                </div>
                              }
                              icon={<Calculator size={9} className="text-slate-400 hover:text-slate-600" />}
                              widthClass="w-48"
                            />
                          </div>
                        )}
                        {/* Opérations réelles (pointées) */}
                        {row.paidAmount !== undefined && row.paidStandard !== undefined && row.paidExtra !== undefined && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-2.5 text-[9px]">
                              {onNavigateToPlanner && currentDate ? (
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "REAL", extra: "ALL", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-emerald-50 px-1 py-0.5 rounded"
                                  title="Cliquer pour voir toutes les opérations réelles"
                                >
                                  <span className="text-emerald-600 font-bold">Réel:</span>
                                  <span className="text-emerald-700 font-medium">{row.paidAmount.toFixed(2)}€</span>
                                </ClickableAmount>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-emerald-600 font-bold">Réel:</span>
                                  <span className="text-emerald-700 font-medium">{row.paidAmount.toFixed(2)}€</span>
                                </div>
                              )}
                              <span className="text-slate-300">|</span>
                              {onNavigateToPlanner && currentDate ? (
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "REAL", extra: "EXCLUDE", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-blue-50 px-1 py-0.5 rounded"
                                  title="Cliquer pour voir les opérations réelles Standard"
                                >
                                  <span className="text-blue-600 font-bold">Standard:</span>
                                  <span className="text-blue-700 font-medium">{row.paidStandard.toFixed(2)}€</span>
                                </ClickableAmount>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 font-bold">Standard:</span>
                                  <span className="text-blue-700 font-medium">{row.paidStandard.toFixed(2)}€</span>
                                </div>
                              )}
                              <span className="text-slate-300">|</span>
                              {onNavigateToPlanner && currentDate ? (
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "REAL", extra: "ONLY", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-purple-50 px-1 py-0.5 rounded"
                                  title="Cliquer pour voir les opérations réelles Extra (hors budget)"
                                >
                                  <span className="text-purple-600 font-bold">Extra:</span>
                                  <span className="text-purple-700 font-medium">{row.paidExtra.toFixed(2)}€</span>
                                </ClickableAmount>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-purple-600 font-bold">Extra:</span>
                                  <span className="text-purple-700 font-medium">{row.paidExtra.toFixed(2)}€</span>
                                </div>
                              )}
                            </div>
                            <MobileTooltip
                              text={
                                <div className="space-y-1.5 text-[10px]">
                                  <p className="font-bold text-emerald-300 border-b border-white/10 pb-1 mb-1">Opérations réelles</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-300 font-bold">Réel</span>
                                    <span className="text-slate-300">Toutes les opérations validées</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-300 font-bold">Standard</span>
                                    <span className="text-slate-300">Part dans le budget</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-purple-300 font-bold">Extra</span>
                                    <span className="text-slate-300">Part hors budget</span>
                                  </div>
                                  <p className="text-slate-400 text-[9px] italic mt-1 pt-1 border-t border-white/10">Ces montants ont déjà impacté le solde.</p>
                                </div>
                              }
                              icon={<Calculator size={10} className="text-slate-400 hover:text-slate-600" />}
                              widthClass="w-56"
                            />
                          </div>
                        )}
                        {/* Opérations en attente (vision rapide du futur) */}
                        {row.pendingAmount !== undefined && row.pendingStandard !== undefined && row.pendingExtra !== undefined && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-2.5 text-[9px]">
                              {onNavigateToPlanner && currentDate ? (
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "WAITING", extra: "ALL", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-amber-50 px-1 py-0.5 rounded"
                                  title="Cliquer pour voir toutes les opérations en attente"
                                >
                                  <span className="text-amber-600 font-bold">En attente:</span>
                                  <span className="text-amber-700 font-medium">{row.pendingAmount.toFixed(2)}€</span>
                                </ClickableAmount>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-600 font-bold">En attente:</span>
                                  <span className="text-amber-700 font-medium">{row.pendingAmount.toFixed(2)}€</span>
                                </div>
                              )}
                              <span className="text-slate-300">|</span>
                              {onNavigateToPlanner && currentDate ? (
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "WAITING", extra: "EXCLUDE", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-slate-50 px-1 py-0.5 rounded"
                                  title="Cliquer pour voir les opérations Standard en attente"
                                >
                                  <span className="text-slate-500 font-bold">Standard:</span>
                                  <span className="text-slate-700 font-medium">{row.pendingStandard.toFixed(2)}€</span>
                                </ClickableAmount>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500 font-bold">Standard:</span>
                                  <span className="text-slate-700 font-medium">{row.pendingStandard.toFixed(2)}€</span>
                                </div>
                              )}
                              <span className="text-slate-300">|</span>
                              {onNavigateToPlanner && currentDate ? (
                                <ClickableAmount
                                  date={currentDate}
                                  filters={{ status: "WAITING", extra: "ONLY", accountIds: [row.id] }}
                                  weekNumber={activeWeek}
                                  onNavigate={onNavigateToPlanner}
                                  className="flex items-center gap-1 hover:bg-rose-50 px-1 py-0.5 rounded"
                                  title="Cliquer pour voir les opérations Extra en attente"
                                >
                                  <span className="text-rose-500 font-bold">Extra:</span>
                                  <span className="text-rose-700 font-medium">{row.pendingExtra.toFixed(2)}€</span>
                                </ClickableAmount>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-rose-500 font-bold">Extra:</span>
                                  <span className="text-rose-700 font-medium">{row.pendingExtra.toFixed(2)}€</span>
                                </div>
                              )}
                            </div>
                            <MobileTooltip
                              text={
                                <div className="space-y-1.5 text-[10px]">
                                  <p className="font-bold text-amber-300 border-b border-white/10 pb-1 mb-1">Opérations en attente</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-300 font-bold">Total</span>
                                    <span className="text-slate-300">Toutes les opérations à venir</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-300 font-bold">Standard</span>
                                    <span className="text-slate-300">Part dans le budget</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-rose-300 font-bold">Extra</span>
                                    <span className="text-slate-300">Part hors budget</span>
                                  </div>
                                  <p className="text-slate-400 text-[9px] italic mt-1 pt-1 border-t border-white/10">
                                    Le solde actuel inclut déjà ces opérations.
                                  </p>
                                </div>
                              }
                              icon={<Calculator size={10} className="text-slate-400 hover:text-slate-600" />}
                              widthClass="w-56"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold text-xs">{row.target.toFixed(2)} €</div>
                    {row.isJoint && <p className="text-[9px] text-slate-400 mt-0.5">Inclus factures</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right bg-indigo-50/30 font-bold font-mono">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${row.transfer > 0 ? "text-indigo-600" : "text-emerald-600"}`}>
                          {row.transfer > 0 ? "+" : ""}
                          {row.transfer.toFixed(2)} €
                        </span>

                        {/* Tooltip explicatif du calcul */}
                        {row.calculation && (
                          <MobileTooltip
                            text={
                              <div className="space-y-2 text-xs">
                                {row.isJoint ? (
                                  // Explication pour compte joint
                                  <>
                                    <p className="font-bold text-indigo-200 border-b border-white/10 pb-1">Calcul du virement reçu :</p>

                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-300">Dettes en attente :</span>
                                        <span className="font-mono font-bold text-white">{row.calculation.jointDebts?.toFixed(2)}€</span>
                                      </div>
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-300">Solde actuel :</span>
                                        <span className="font-mono font-bold text-white">{row.balance.toFixed(2)}€</span>
                                      </div>
                                      <div className="flex justify-between gap-3 border-t border-white/10 pt-1 font-bold">
                                        <span className="text-indigo-200">Gap (besoin) :</span>
                                        <span className="font-mono text-indigo-200">{row.calculation.jointGap?.toFixed(2)}€</span>
                                      </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-2 space-y-1">
                                      <p className="text-slate-300 text-[10px] uppercase tracking-wide">Couvert par :</p>
                                      <div className="flex justify-between gap-3">
                                        <span className="text-emerald-300">Excédents C. Persos :</span>
                                        <span className="font-mono font-bold text-emerald-300">{row.calculation.fromPersonals?.toFixed(2)}€</span>
                                      </div>
                                      {row.calculation.fromLdds && row.calculation.fromLdds > 0 ? (
                                        <div className="flex justify-between gap-3">
                                          <span className="text-amber-300">Complément LDDS :</span>
                                          <span className="font-mono font-bold text-amber-300">{row.calculation.fromLdds.toFixed(2)}€</span>
                                        </div>
                                      ) : (
                                        <p className="text-emerald-300 text-[10px] italic">✓ Pas besoin du LDDS</p>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  // Explication pour comptes personnels
                                  <>
                                    <p className="font-bold text-indigo-200 border-b border-white/10 pb-1">Calcul de la contribution :</p>

                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-300">Solde actuel :</span>
                                        <span className="font-mono font-bold text-white">{row.balance.toFixed(2)}€</span>
                                      </div>
                                      {row.calculation.sharePercent !== undefined && (
                                        <div className="flex justify-between gap-3">
                                          <span className="text-slate-300">Part du total :</span>
                                          <span className="font-mono font-bold text-indigo-200">{row.calculation.sharePercent.toFixed(1)}%</span>
                                        </div>
                                      )}
                                      {row.calculation.theoreticalAmount !== undefined && (
                                        <div className="flex justify-between gap-3">
                                          <span className="text-slate-300">Montant théorique :</span>
                                          <span className="font-mono text-slate-300">{row.calculation.theoreticalAmount.toFixed(2)}€</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="border-t border-white/10 pt-2">
                                      {row.calculation.isContributor ? (
                                        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded p-2">
                                          <p className="text-emerald-200 text-[10px] font-bold mb-1">✓ CONTRIBUTEUR</p>
                                          <p className="text-slate-300 text-[10px]">Montant ≥ 10€ : contribue au virement vers le compte joint.</p>
                                        </div>
                                      ) : (
                                        <div className="bg-amber-500/20 border border-amber-400/30 rounded p-2">
                                          <p className="text-amber-200 text-[10px] font-bold mb-1">○ NON-CONTRIBUTEUR</p>
                                          <p className="text-slate-300 text-[10px]">Montant {"<"} 10€ : redistribué aux autres comptes contributeurs.</p>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            }
                            icon={<Calculator size={12} className="text-indigo-400 hover:text-indigo-600" />}
                            widthClass="w-80"
                          />
                        )}
                      </div>
                      <span className="text-[9px] text-indigo-400 uppercase font-medium">{getTransferLabel(row)}</span>
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
                <td className="px-4 py-2.5 text-right">{totalRow.target.toFixed(2)} €</td>
                <td className="px-4 py-2.5 text-right bg-indigo-100/50 text-indigo-800">
                  {totalRow.transfer > 0 ? "+" : ""}
                  {totalRow.transfer.toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
};

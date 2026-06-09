import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "../../../ui/Card";
import { Wallet, Pencil, Check, X, Users, Calculator, AlertTriangle, Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { BalanceRow } from "../../../../hooks/balances";
import { OperationFilters } from "../../../../types";

interface VarianceData {
  availableTotal: number;
  paidConsumedAmount: number;
  availableTarget: number;
  accountPendingAmount: number;
  pendingCreditAmount: number;
  hasPendingCredit: boolean;
  countedPendingAmount: number;
  personalProjectedAmount: number;
  hasSamePendingAmount: boolean;
}

interface ExcessAccountData extends VarianceData {
  accountId: string;
  beneficiaryId?: string;
  accountName: string;
  excessAmount: number;
  immediateAmount: number;
  projectedAmount: number;
}

interface DeficitAccountData extends VarianceData {
  accountId: string;
  beneficiaryId?: string;
  accountName: string;
  deficitAmount: number;
  immediateAmount: number;
  projectedAmount: number;
}

interface AccountVarianceData extends VarianceData {
  accountId: string;
  beneficiaryId?: string;
  accountName: string;
  immediateAmount: number;
  projectedAmount: number;
}

interface VarianceLookupEntry extends VarianceData {
  beneficiaryId?: string;
  accountName: string;
  varianceAmount: number;
  immediateAmount: number;
  projectedAmount: number;
}

interface BalancesTableProps {
  rows: BalanceRow[];
  onUpdateBalance: (accountId: string, newBalance: number) => void;
  title?: string;
  totalRow?: BalanceRow;
  onNavigateToPlanner?: (date: Date, filters: Record<string, unknown>, weekNumber?: number) => void;
  currentDate?: Date;
  activeWeek?: number;
  totalPersonalRemainingAmount?: number;
  varianceAccounts?: AccountVarianceData[];
  excessAccounts?: ExcessAccountData[];
  deficitAccounts?: DeficitAccountData[];
  canEditBalances?: boolean;
}

interface BalanceDisplayProps {
  label: string;
  amount: number;
  onClick: (e: React.MouseEvent) => void;
  tooltipContent: React.ReactNode;
  canEdit?: boolean;
}

interface VarianceNavProps {
  accountId?: string;
  beneficiaryId?: string;
  onNavigate?: (date: Date, filters: Partial<OperationFilters>, weekNumber?: number) => void;
  currentDate?: Date;
  activeWeek?: number;
}

interface VarianceTooltipContentProps extends VarianceNavProps {
  type: "EXCESS" | "DEFICIT" | "NEUTRAL";
  data?: VarianceData;
  accountBalance: number;
  displayedAmount: number;
}

interface VarianceBadgeProps extends VarianceNavProps {
  type: "EXCESS" | "DEFICIT";
  amount: number;
  data?: VarianceData;
  accountBalance: number;
  threshold: number;
}

const formatAmount = (amount: number) => `${amount.toFixed(2)}€`;
const tooltipLabelClass = "text-slate-700";
const tooltipLabelStrongClass = "text-slate-900 font-semibold";
const tooltipValueBudgetClass = "font-mono tabular-nums font-semibold text-indigo-700";
const tooltipValueConsumedClass = "font-mono tabular-nums font-semibold text-rose-700";
const tooltipValueNeutralClass = "font-mono tabular-nums font-semibold text-slate-900";
const tooltipValuePendingClass = "font-mono tabular-nums font-semibold text-amber-700";
const tooltipValueExcessClass = "font-mono tabular-nums font-bold text-rose-700";
const tooltipValueDeficitClass = "font-mono tabular-nums font-bold text-amber-700";

const buildVarianceLookup = <T extends ExcessAccountData | DeficitAccountData>(
  entries: T[],
  getAmount: (entry: T) => number
): Record<string, VarianceLookupEntry> => {
  return entries.reduce<Record<string, VarianceLookupEntry>>((acc, entry) => {
    acc[entry.accountId] = {
      accountName: entry.accountName,
      beneficiaryId: entry.beneficiaryId,
      varianceAmount: getAmount(entry),
      countedPendingAmount: entry.countedPendingAmount,
      paidConsumedAmount: entry.paidConsumedAmount,
      accountPendingAmount: entry.accountPendingAmount,
      pendingCreditAmount: entry.pendingCreditAmount,
      hasPendingCredit: entry.hasPendingCredit,
      availableTarget: entry.availableTarget,
      availableTotal: entry.availableTotal,
      immediateAmount: entry.immediateAmount,
      projectedAmount: entry.projectedAmount,
      personalProjectedAmount: entry.personalProjectedAmount,
      hasSamePendingAmount: entry.hasSamePendingAmount,
    };
    return acc;
  }, {});
};

const VarianceTooltipContent: React.FC<VarianceTooltipContentProps> = ({
  type,
  data,
  accountBalance,
  displayedAmount,
  accountId,
  beneficiaryId,
  onNavigate,
  currentDate,
  activeWeek,
}) => {
  const projectedLabel = type === "EXCESS" ? "Excédent (Solde - Restant)" : type === "DEFICIT" ? "Déficit (Solde - Restant)" : "Ecart (Solde - Restant)";
  const projectedValueClass = type === "EXCESS" ? tooltipValueExcessClass : type === "DEFICIT" ? tooltipValueDeficitClass : tooltipValueNeutralClass;
  const accountIds = accountId ? [accountId] : [];
  const beneficiaryIds = beneficiaryId ? [beneficiaryId] : [];

  return (
    <div className="space-y-1.5 text-[10px]">
      <div className="flex justify-between gap-4">
        <span className={tooltipLabelClass}>Perso disponible pour la période</span>
        <span className={tooltipValueBudgetClass}>{formatAmount(data?.availableTotal ?? 0)}</span>
      </div>
      <ClickableAmount
        date={currentDate}
        filters={{ status: "REAL", nature: "EXCLUDE", accountIds, beneficiaryIds }}
        weekNumber={activeWeek}
        onNavigate={onNavigate}
        className="flex justify-between gap-4 hover:bg-rose-50 px-1 -mx-1 rounded cursor-pointer"
        title="Voir les opérations standards réelles"
      >
        <span className={tooltipLabelClass}>Opérations déjà enregistrées</span>
        <span className={tooltipValueConsumedClass}>{formatAmount(data?.paidConsumedAmount ?? 0)}</span>
      </ClickableAmount>
      <div className="flex justify-between gap-4">
        <span className={tooltipLabelClass}>Perso disponible restant</span>
        <span className={tooltipValueBudgetClass}>{formatAmount((data?.availableTotal ?? 0) - (data?.paidConsumedAmount ?? 0))}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className={tooltipLabelClass}>Solde du compte perso</span>
        <span className={tooltipValueNeutralClass}>{formatAmount(accountBalance)}</span>
      </div>
      {data?.hasPendingCredit && (
        <div className="flex justify-between gap-4">
          <span className={tooltipLabelClass}>Crédit en attente</span>
          <span className={tooltipValuePendingClass}>{formatAmount(data?.pendingCreditAmount ?? 0)}</span>
        </div>
      )}
      {!data?.hasSamePendingAmount && (data?.accountPendingAmount ?? 0) > 0.01 && (
        <ClickableAmount
          date={currentDate}
          filters={{ status: "WAITING", nature: "ALL", accountIds, beneficiaryIds }}
          weekNumber={activeWeek}
          onNavigate={onNavigate}
          className="flex justify-between gap-4 hover:bg-amber-50 px-1 -mx-1 rounded cursor-pointer"
          title="Voir les opérations en attente du compte"
        >
          <span className={tooltipLabelClass}>Opérations en attente du compte</span>
          <span className={tooltipValuePendingClass}>{formatAmount(data?.accountPendingAmount ?? 0)}</span>
        </ClickableAmount>
      )}
      <div className="flex justify-between gap-4">
        <span className={tooltipLabelStrongClass}>{projectedLabel}</span>
        <span className={projectedValueClass}>{formatAmount(displayedAmount)}</span>
      </div>
      <hr className="border-slate-200/80" />
      {data?.hasSamePendingAmount ? (
        <ClickableAmount
          date={currentDate}
          filters={{ status: "WAITING", nature: "ALL", beneficiaryIds }}
          weekNumber={activeWeek}
          onNavigate={onNavigate}
          className="flex justify-between gap-4 hover:bg-amber-50 px-1 -mx-1 rounded cursor-pointer"
          title="Voir les opérations en attente"
        >
          <span className={tooltipLabelClass}>Opérations en attente</span>
          <span className={tooltipValuePendingClass}>{formatAmount(data?.countedPendingAmount ?? 0)}</span>
        </ClickableAmount>
      ) : (
        <ClickableAmount
          date={currentDate}
          filters={{ status: "WAITING", nature: "ALL", beneficiaryIds }}
          weekNumber={activeWeek}
          onNavigate={onNavigate}
          className="flex justify-between gap-4 hover:bg-amber-50 px-1 -mx-1 rounded cursor-pointer"
          title="Voir les opérations en attente perso"
        >
          <span className={tooltipLabelClass}>Opérations en attente perso</span>
          <span className={tooltipValuePendingClass}>{formatAmount(data?.countedPendingAmount ?? 0)}</span>
        </ClickableAmount>
      )}
      <div className="flex justify-between gap-4">
        <span className={tooltipLabelStrongClass}>Perso projeté</span>
        <span className={tooltipValueBudgetClass}>{formatAmount(data?.personalProjectedAmount ?? 0)}</span>
      </div>
    </div>
  );
};

const VarianceBadge: React.FC<VarianceBadgeProps> = ({
  type,
  amount,
  data,
  accountBalance,
  threshold,
  accountId,
  beneficiaryId,
  onNavigate,
  currentDate,
  activeWeek,
}) => {
  if (amount <= threshold) return null;

  const isExcess = type === "EXCESS";
  const badgeClass = isExcess
    ? "text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold"
    : "text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold";
  const badgeLabel = isExcess ? `Excédent +${amount.toFixed(2)}€` : `Déficit -${amount.toFixed(2)}€`;
  const ariaLabel = isExcess ? "Voir le détail du calcul de l'excédent" : "Voir le détail du calcul du déficit";

  return (
    <span className="inline-flex items-center">
      <span className={badgeClass}>{badgeLabel}</span>
      <MobileTooltip
        ariaLabel={ariaLabel}
        widthClass="w-64"
        text={
          <VarianceTooltipContent
            type={type}
            data={data}
            accountBalance={accountBalance}
            displayedAmount={amount}
            accountId={accountId}
            beneficiaryId={beneficiaryId}
            onNavigate={onNavigate}
            currentDate={currentDate}
            activeWeek={activeWeek}
          />
        }
      />
    </span>
  );
};

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ label, amount, onClick, tooltipContent, canEdit = false }) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-slate-500 font-medium">{label}</span>
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded font-mono font-bold text-xs text-slate-700 transition-colors ${
          canEdit ? "hover:bg-slate-200 cursor-pointer" : ""
        }`}
        onClick={onClick}
        title={canEdit ? "Cliquer pour modifier le solde" : undefined}
      >
        {amount.toFixed(2)} €
        {canEdit && (
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
        )}
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
  varianceAccounts = [],
  excessAccounts = [],
  deficitAccounts = [],
  canEditBalances = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>("");
  const [editMode, setEditMode] = useState<"WITH_PENDING" | "WITHOUT_PENDING">("WITH_PENDING");

  const sortedRows = [...rows].sort((a, b) => b.name.localeCompare(a.name, "fr", { sensitivity: "base" }));
  const accountVarianceDisplayThreshold = 10;

  const excessByAccountId = buildVarianceLookup(excessAccounts, (entry) => entry.excessAmount);
  const deficitByAccountId = buildVarianceLookup(deficitAccounts, (entry) => entry.deficitAmount);
  const varianceByAccountId = varianceAccounts.reduce<Record<string, AccountVarianceData>>((acc, entry) => {
    acc[entry.accountId] = entry;
    return acc;
  }, {});

  const startEdit = (id: string, balance: number, e: React.MouseEvent, mode: "WITH_PENDING" | "WITHOUT_PENDING" = "WITH_PENDING") => {
    e.stopPropagation();
    if (!canEditBalances) return;

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
    if (!canEditBalances) return;

    const editedValue = parseFloat(tempBalance);
    if (!isNaN(editedValue)) {
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

                      {canEditBalances && (
                        <p className="text-slate-600 text-[9px] italic mt-1 pt-1 border-t border-slate-200">Cliquez sur le solde pour le modifier.</p>
                      )}
                    </div>
                  }
                  iconClassName="text-indigo-500 hover:text-indigo-700 transition-colors"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => {
              const excessData = excessByAccountId[row.id];
              const excessAmount = excessData?.varianceAmount ?? 0;

              const deficitData = deficitByAccountId[row.id];
              const deficitAmount = deficitData?.varianceAmount ?? 0;
              const varianceData = varianceByAccountId[row.id];
              const hasVarianceBadge = excessAmount > accountVarianceDisplayThreshold || deficitAmount > accountVarianceDisplayThreshold;
              const neutralVarianceType = (varianceData?.immediateAmount ?? 0) >= 0 ? "EXCESS" : "DEFICIT";
              const neutralVarianceAmount = Math.abs(varianceData?.immediateAmount ?? 0);

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
                          {!row.isJoint && (
                            <VarianceBadge
                              type="EXCESS"
                              amount={excessAmount}
                              data={excessData}
                              accountBalance={row.balance}
                              threshold={accountVarianceDisplayThreshold}
                              accountId={row.id}
                              beneficiaryId={excessData?.beneficiaryId}
                              onNavigate={onNavigateToPlanner}
                              currentDate={currentDate}
                              activeWeek={activeWeek}
                            />
                          )}
                          {!row.isJoint && (
                            <VarianceBadge
                              type="DEFICIT"
                              amount={deficitAmount}
                              data={deficitData}
                              accountBalance={row.balance}
                              threshold={accountVarianceDisplayThreshold}
                              accountId={row.id}
                              beneficiaryId={deficitData?.beneficiaryId}
                              onNavigate={onNavigateToPlanner}
                              currentDate={currentDate}
                              activeWeek={activeWeek}
                            />
                          )}
                          {!row.isJoint && !hasVarianceBadge && varianceData && (
                            <MobileTooltip
                              ariaLabel="Voir le détail du calcul"
                              widthClass="w-64"
                              icon={<Info size={12} className="text-slate-400 hover:text-slate-600" />}
                              text={
                                <VarianceTooltipContent
                                  type={neutralVarianceType}
                                  data={varianceData}
                                  accountBalance={row.balance}
                                  displayedAmount={neutralVarianceAmount}
                                  accountId={row.id}
                                  beneficiaryId={varianceData.beneficiaryId}
                                  onNavigate={onNavigateToPlanner}
                                  currentDate={currentDate}
                                  activeWeek={activeWeek}
                                />
                              }
                            />
                          )}
                          <span className="text-[10px] text-slate-500">({row.owner})</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right ${canEditBalances ? "cursor-pointer" : ""}`}
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
                        <BalanceDisplay
                          label="Solde réél:"
                          amount={row.balance}
                          onClick={(e) => {
                            if (editingId !== row.id) startEdit(row.id, row.balance, e, "WITH_PENDING");
                          }}
                          canEdit={canEditBalances}
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
                                  <span className="font-mono font-bold text-blue-700 hover:text-blue-800">{(row.paidStandard ?? 0).toFixed(2)}€</span>
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
                                  <span className="font-mono font-bold text-purple-700 hover:text-purple-800">{(row.paidExtra ?? 0).toFixed(2)}€</span>
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
                                  <span className="font-mono font-bold text-emerald-700 hover:text-emerald-800">{(row.paidAmount ?? 0).toFixed(2)}€</span>
                                </div>
                              </ClickableAmount>
                            </div>
                          }
                        />

                        {row.pendingAmount !== undefined && Math.abs(row.pendingAmount) > 0.01 && (
                          <BalanceDisplay
                            label="Solde prévisionnel:"
                            amount={row.balance + row.pendingAmount}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(row.id, row.balance + (row.pendingAmount ?? 0), e, "WITHOUT_PENDING");
                            }}
                            canEdit={canEditBalances}
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

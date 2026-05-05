import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { OperationFilters } from "../../../../types";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";

type BeneficiaryDetail = { beneficiaryId?: string; name: string; amount: number; available?: number; remaining?: number };

interface PersonalBudgetSummaryProps {
  totalPersonalBudgetAmount: number;
  spentPersonalBudgetAmount: number;
  totalPersonalRemainingAmount: number;
  beneficiariesDetails?: BeneficiaryDetail[];
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

interface BudgetSubCardProps {
  label: string;
  tooltipText: string;
  tooltipWidth?: string;
  emptyMessage: string;
  beneficiariesDetails: BeneficiaryDetail[];
  nameClass: string;
  renderValue: (d: BeneficiaryDetail) => React.ReactNode;
  renderTotal: () => React.ReactNode;
  totalBorderClass?: string;
}

const subCardClass = "rounded-2xl p-4 border border-slate-200 !bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start";
const sectionLabelClass = "text-xs uppercase tracking-widest text-slate-400 font-bold";

const BudgetSubCard: React.FC<BudgetSubCardProps> = ({
  label,
  tooltipText,
  tooltipWidth = "w-48",
  emptyMessage,
  beneficiariesDetails,
  nameClass,
  renderValue,
  renderTotal,
  totalBorderClass = "border-slate-200",
}) => (
  <Card className={subCardClass}>
    <div className="space-y-1.5">
      <div className="flex items-center">
        <span className={`${sectionLabelClass} mb-2 w-full text-left`}>{label}</span>
        <MobileTooltip text={tooltipText} icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />} widthClass={tooltipWidth} />
      </div>
      {beneficiariesDetails.length > 0 ? (
        <>
          {beneficiariesDetails.map((d, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
              <span className={`${nameClass} truncate`}>{d.name}</span>
              {renderValue(d)}
            </div>
          ))}
          <div className={`flex items-baseline justify-between gap-3 text-[11px] border-t ${totalBorderClass} pt-1 mt-1`}>{renderTotal()}</div>
        </>
      ) : (
        <div className="text-[11px] text-slate-400 italic">{emptyMessage}</div>
      )}
    </div>
  </Card>
);

export const PersonalBudgetSummary: React.FC<PersonalBudgetSummaryProps> = ({
  totalPersonalRemainingAmount,
  beneficiariesDetails = [],
  currentDate,
  onNavigateToOperations,
}) => (
  <Card className="rounded-3xl">
    <CardHeader className="p-4 pb-0 border-b-0">
      <div className="flex items-center gap-1.5">
        <CardTitle className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget personnel (Mensuel)</CardTitle>
        <MobileTooltip text="Vue d'ensemble du budget personnel : montant total, consommé, disponible." icon={<Info size={16} />} widthClass="w-72" />
      </div>
      <div className="space-y-3">
        {beneficiariesDetails.length > 0 ? (
          beneficiariesDetails.map((d, i) => {
            const remaining = d.remaining ?? 0;
            const budget = d.amount + remaining;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 truncate">{d.name}</span>
                  <span className="font-black text-slate-600 whitespace-nowrap">
                    {d.amount.toFixed(0)} € / {budget.toFixed(0)} €
                  </span>
                </div>
                <BudgetProgressBar consumed={d.amount} budget={budget} />
              </div>
            );
          })
        ) : (
          <div className="text-[11px] text-slate-400/80 italic">Aucun bénéficiaire.</div>
        )}
      </div>
    </CardHeader>

    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <BudgetSubCard
            label="Disponible"
            tooltipText="Détail du budget personnel disponible par bénéficiaire (reports inclus)."
            tooltipWidth="w-48"
            emptyMessage="Aucun bénéficiaire personnel configuré."
            beneficiariesDetails={beneficiariesDetails}
            nameClass="font-bold text-indigo-700"
            renderValue={(d) => <span className="font-black text-indigo-700 whitespace-nowrap">{(d.available ?? 0).toFixed(2)} €</span>}
            renderTotal={() => (
              <>
                <span className="font-bold text-slate-500 truncate">Total</span>
                <span className="font-black text-slate-700 whitespace-nowrap">
                  {beneficiariesDetails.reduce((s, d) => s + (d.available ?? 0), 0).toFixed(2)} €
                </span>
              </>
            )}
          />

          <BudgetSubCard
            label="Dépenses"
            tooltipText="Dépenses standard (Réél + en attente) affectées aux bénéficiaires (hors Extra, hors virements internes)."
            tooltipWidth="w-60"
            emptyMessage="Aucune consommation."
            beneficiariesDetails={beneficiariesDetails}
            nameClass="font-bold text-rose-700"
            renderValue={(d) => (
              <ClickableAmount
                date={currentDate}
                filters={buildOperationsFilters({
                  flux: "ALL",
                  source: "ALL",
                  status: "ALL",
                  nature: "EXCLUDE",
                  beneficiaryIds: d.beneficiaryId ? [d.beneficiaryId] : [],
                })}
                onNavigate={onNavigateToOperations}
                as="button"
                className="font-black text-rose-700 whitespace-nowrap hover:underline hover:text-rose-500"
              >
                {d.amount.toFixed(2)} €
              </ClickableAmount>
            )}
            renderTotal={() => (
              <>
                <span className="font-bold text-rose-400 truncate">Total</span>
                <span className="font-black text-rose-700 whitespace-nowrap">{beneficiariesDetails.reduce((s, d) => s + d.amount, 0).toFixed(2)} €</span>
              </>
            )}
            totalBorderClass="border-rose-200"
          />

          <BudgetSubCard
            label="Reste"
            tooltipText="Reste individuel par bénéficiaire (disponible - dépensé)."
            tooltipWidth="w-56"
            emptyMessage="Aucun reste à afficher."
            beneficiariesDetails={beneficiariesDetails}
            nameClass="font-bold text-slate-700"
            renderValue={(d) => {
              const remaining = d.remaining ?? 0;
              return <span className={`font-black whitespace-nowrap ${remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{remaining.toFixed(2)} €</span>;
            }}
            renderTotal={() => (
              <>
                <span className="font-bold text-slate-500 truncate">Total</span>
                <span className={`font-black whitespace-nowrap ${totalPersonalRemainingAmount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {totalPersonalRemainingAmount.toFixed(2)} €
                </span>
              </>
            )}
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

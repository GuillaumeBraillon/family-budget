import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { OperationFilters } from "../../../../types";
import { BudgetProgressBar } from "../../Dashboard/components/BudgetProgressBar";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";

interface PersonalBudgetSummaryProps {
  totalPersonalBudgetAmount: number;
  spentPersonalBudgetAmount: number;
  distributableBudgetAmount: number;
  beneficiariesDetails?: { beneficiaryId?: string; name: string; amount: number; available?: number; remaining?: number }[];
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const PersonalBudgetSummary: React.FC<PersonalBudgetSummaryProps> = ({
  totalPersonalBudgetAmount,
  spentPersonalBudgetAmount,
  distributableBudgetAmount: _distributableAmount,
  beneficiariesDetails = [],
  currentDate,
  onNavigateToOperations,
}) => {
  const subCardClass = "rounded-2xl p-4 border border-slate-200 !bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start";
  const sectionLabelClass = "text-xs uppercase tracking-widest text-slate-400 font-bold";

  return (
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
            {/* Budget personnel disponible */}
            <Card className={subCardClass}>
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className={`${sectionLabelClass} mb-2 w-full text-left`}>Disponible</span>
                  <MobileTooltip
                    text="Détail du budget personnel disponible par bénéficiaire (reports inclus)."
                    icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
                    widthClass="w-48"
                  />
                </div>
                {beneficiariesDetails.length > 0 ? (
                  <>
                    {beneficiariesDetails.map((d, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
                        <span className="font-bold text-indigo-700 truncate">{d.name}</span>
                        <span className="font-black text-indigo-700 whitespace-nowrap">{(d.available ?? 0).toFixed(2)} €</span>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-3 text-[11px] border-t border-slate-200 pt-1 mt-1">
                      <span className="font-bold text-slate-500 truncate">Total</span>
                      <span className="font-black text-slate-700 whitespace-nowrap">
                        {beneficiariesDetails.reduce((s, d) => s + (d.available ?? 0), 0).toFixed(2)} €
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">Aucun bénéficiaire personnel configuré.</div>
                )}
              </div>
            </Card>

            {/* Budget personnel dépensé */}
            <Card className={subCardClass}>
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className={`${sectionLabelClass} mb-2 w-full text-left`}>Dépensé</span>
                  <MobileTooltip
                    text="Dépenses standard affectées aux bénéficiaires (hors Extra, hors virements internes)."
                    icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
                    widthClass="w-60"
                  />
                </div>
                {beneficiariesDetails.length > 0 ? (
                  <>
                    {beneficiariesDetails.map((d, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
                        <span className="font-bold text-rose-700 truncate">{d.name}</span>
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
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-3 text-[11px] border-t border-rose-200 pt-1 mt-1">
                      <span className="font-bold text-rose-400 truncate">Total</span>
                      <span className="font-black text-rose-700 whitespace-nowrap">{beneficiariesDetails.reduce((s, d) => s + d.amount, 0).toFixed(2)} €</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-rose-300/80 italic">Aucune consommation.</div>
                )}
              </div>
            </Card>

            {/* Reste budget personnel */}
            <Card className={subCardClass}>
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className={`${sectionLabelClass} mb-2 w-full text-left`}>Reste</span>
                  <MobileTooltip
                    text="Reste individuel par bénéficiaire (disponible - dépensé)."
                    icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
                    widthClass="w-56"
                  />
                </div>
                {beneficiariesDetails.length > 0 ? (
                  <>
                    {beneficiariesDetails.map((d, i) => {
                      const remaining = d.remaining ?? 0;
                      return (
                        <div key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
                          <span className="font-bold text-slate-700 truncate">{d.name}</span>
                          <span className={`font-black whitespace-nowrap ${remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {remaining.toFixed(2)} €
                          </span>
                        </div>
                      );
                    })}
                    {(() => {
                      const totalRemaining = beneficiariesDetails.reduce((s, d) => s + (d.remaining ?? 0), 0);
                      return (
                        <div className="flex items-baseline justify-between gap-3 text-[11px] border-t border-slate-200 pt-1 mt-1">
                          <span className="font-bold text-slate-500 truncate">Total</span>
                          <span className={`font-black whitespace-nowrap ${totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {totalRemaining.toFixed(2)} €
                          </span>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400/80 italic">Aucun reste à afficher.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

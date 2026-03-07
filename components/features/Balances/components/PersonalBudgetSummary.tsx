import React from "react";
import { Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { buildOperationsFilters } from "../../../../services/financeUtils";
import { OperationFilters } from "../../../../types";

interface PersonalBudgetSummaryProps {
  totalPersonalBudget: number;
  spentPersonalBudget: number;
  distributableBudget: number;
  beneficiariesDetails?: { beneficiaryId?: string; name: string; amount: number; available?: number; remaining?: number }[];
  currentDate?: Date;
  onNavigateToOperations?: (date: Date, filters: Partial<OperationFilters>) => void;
}

export const PersonalBudgetSummary: React.FC<PersonalBudgetSummaryProps> = ({
  totalPersonalBudget,
  spentPersonalBudget,
  distributableBudget: _distributable,
  beneficiariesDetails = [],
  currentDate,
  onNavigateToOperations,
}) => {
  return (
    <div className="rounded-3xl bg-white shadow-xl border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-sm uppercase tracking-widest text-slate-500 font-bold">Budget personnel (Mensuel)</h2>
          <MobileTooltip text="Vue d'ensemble du budget personnel : montant total, consommé, disponible." icon={<Info size={16} />} widthClass="w-72" />
        </div>
      </div>

      {/* Contenu de la carte : Budget personnel disponible, dépensé et reste */}
      <div className="flex flex-col items-stretch justify-between gap-1.5 md:gap-2">
        {/* Affichage du budget personnel par bénéficiaire */}
        <div className="flex flex-col md:flex-row gap-2">
          {/* Budget personnel disponible */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disponible</span>
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
            </div>
          </div>

          {/* Budget personnel dépensé */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200">
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dépensé</span>
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
                        {d.beneficiaryId && onNavigateToOperations && currentDate ? (
                          <ClickableAmount
                            date={currentDate}
                            filters={buildOperationsFilters({
                              flux: "ALL",
                              source: "ALL",
                              status: "ALL",
                              nature: "EXCLUDE",
                              beneficiaryIds: [d.beneficiaryId],
                            })}
                            onNavigate={onNavigateToOperations}
                            as="button"
                            className="font-black text-rose-700 whitespace-nowrap hover:underline hover:text-rose-500"
                          >
                            {d.amount.toFixed(2)} €
                          </ClickableAmount>
                        ) : (
                          <span className="font-black text-rose-700 whitespace-nowrap">{d.amount.toFixed(2)} €</span>
                        )}
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
            </div>
          </div>
        </div>
        {/* Reste budget personnel */}
        <div className="flex-1 flex flex-col gap-2">
          <div
            className={`rounded-2xl p-4 border ${totalPersonalBudget - spentPersonalBudget >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reste</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

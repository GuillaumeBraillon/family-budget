import React from "react";
import { Card, CardContent } from "../../../ui/Card";
import { ArrowRightLeft, PiggyBank } from "lucide-react";
import { TransferSummary } from "../../../../hooks/balances";

interface TransferSummaryCardProps {
  transferSummary: TransferSummary;
}

export const TransferSummaryCard: React.FC<TransferSummaryCardProps> = ({ transferSummary }) => {
  const { exactLddsToPivot, roundedLddsToPivot, jointPendingNeed, netPersonalNeed, hasNeedToPivot, hasReturnToLdds } = transferSummary;
  const hasPersonalDeficit = netPersonalNeed > 0.01;
  const hasPersonalExcess = netPersonalNeed < -0.01;

  return (
    <div className="mt-8">
      <Card
        className={`border-l-4 shadow-md transition-all ${
          hasNeedToPivot ? "border-l-indigo-600 bg-white" : hasReturnToLdds ? "border-l-amber-500 bg-amber-50/50" : "border-l-emerald-500 bg-emerald-50/50"
        }`}
      >
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-full shadow-sm ${
                hasNeedToPivot ? "bg-indigo-100 text-indigo-600" : hasReturnToLdds ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {hasNeedToPivot ? <ArrowRightLeft size={32} /> : <PiggyBank size={32} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vir LDDS vers Joint</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                {hasNeedToPivot
                  ? "Montant à transférer vers le compte joint (pivot) pour couvrir les dépenses en attente du joint et les besoins nets des comptes perso."
                  : hasReturnToLdds
                    ? "Le compte joint est provisionné au-delà du seuil de sécurité (10%). Montant à remettre sur le LDDS."
                    : "Aucun virement nécessaire entre LDDS et compte joint."}
              </p>
              {hasNeedToPivot && (jointPendingNeed > 0.01 || hasPersonalDeficit || hasPersonalExcess) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {jointPendingNeed > 0.01 && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">En attente Joint</span>
                      <span className="text-sm font-black text-indigo-700">{jointPendingNeed.toFixed(2)} €</span>
                    </div>
                  )}
                  {hasPersonalDeficit && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Besoins Perso (Net)</span>
                      <span className="text-sm font-black text-amber-700">{netPersonalNeed.toFixed(2)} €</span>
                    </div>
                  )}
                  {hasPersonalExcess && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Excédents Perso (Net)</span>
                      <span className="text-sm font-black text-emerald-700">-{Math.abs(netPersonalNeed).toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-4xl font-black tracking-tighter ${hasNeedToPivot ? "text-indigo-600" : hasReturnToLdds ? "text-amber-600" : "text-emerald-600"}`}
            >
              {hasNeedToPivot ? roundedLddsToPivot : hasReturnToLdds ? Math.abs(roundedLddsToPivot) : "0"} €
            </div>
            {Math.abs(roundedLddsToPivot - exactLddsToPivot) > 0.01 && (
              <div className="text-xs font-bold text-slate-400 mt-1">Exact : {exactLddsToPivot.toFixed(2)} €</div>
            )}
            {hasReturnToLdds && (
              <p className="text-xs font-bold text-amber-700 mt-1 uppercase bg-amber-100 px-2 py-1 rounded inline-block">
                Reversement LDDS : {Math.abs(roundedLddsToPivot)} €
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";
import { MobileTooltip } from "@/components/ui/MobileTooltip";
import { Info } from "lucide-react";
import { BudgetProgressBar } from "./BudgetProgressBar";

interface SavingsJointFlowLine {
  from: string;
  to: string;
  amount: number;
}

interface SavingsAccountNetRow {
  accountName: string;
  balance: number;
  usedAmount: number;
  netAfterUsed: number;
}

interface SavingsJointFlowSummary {
  savedAmount: number;
  usedAmount: number;
  savingsBalanceTotal: number;
  savingsNetAfterUsed: number;
  lines: SavingsJointFlowLine[];
  savingsRows: SavingsAccountNetRow[];
}

interface SavingsJointFlowsCardProps {
  summary: SavingsJointFlowSummary;
}

export const SavingsJointFlowsCard: React.FC<SavingsJointFlowsCardProps> = ({ summary }) => {
  const roundTo0 = (n: number) => Math.round(n);
  const hasFlows = summary.savedAmount > 0 || summary.usedAmount > 0 || summary.lines.length > 0;
  const netSavingsAmount = summary.savedAmount - summary.usedAmount;
  const remainingAmount = Math.max(0, summary.savedAmount - summary.usedAmount);
  const overspendAmount = Math.max(0, summary.usedAmount - summary.savedAmount);
  const trendLabel = netSavingsAmount > 0 ? "Plus épargné" : netSavingsAmount < 0 ? "Plus utilisé" : "Équilibré";

  if (!hasFlows && summary.savingsBalanceTotal === 0) return null;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-2 border-b-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm uppercase tracking-widest text-slate-500 font-bold">Flux Joint / Épargne</CardTitle>
          <MobileTooltip
            text="Vue d'ensemble des flux entre les comptes d'épargne et le compte joint. La barre est basée sur le montant épargné et montre la part utilisée, la part restante et un éventuel dépassement."
            icon={<Info size={16} />}
            widthClass="w-72"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex flex-col gap-5">
        {/* Section Utilisé */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">{trendLabel}</span>
          <div className="flex items-center justify-between text-[11px] gap-3">
            <span className="font-bold text-slate-700 truncate">Utilisé</span>
            <span className="font-black text-slate-600 whitespace-nowrap">
              {roundTo0(summary.usedAmount)} € / {roundTo0(summary.savedAmount)} €
            </span>
          </div>
          <BudgetProgressBar consumed={summary.usedAmount} budget={summary.savedAmount} />
        </div>

        {/* Section Reste */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Épargne</span>
          <div className="flex items-center justify-between text-[11px] gap-3">
            <span className="font-bold text-slate-700 truncate">Reste</span>
            <span className={`font-black whitespace-nowrap ${netSavingsAmount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {roundTo0(remainingAmount)} € / {roundTo0(summary.savedAmount)} €
            </span>
          </div>
          <BudgetProgressBar consumed={remainingAmount} budget={summary.savedAmount} />
        </div>

        {/* Trois pills de valeurs */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-2xl p-3 border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Épargné</span>
            <span className="text-sm font-black text-emerald-700">{roundTo0(summary.savedAmount)} €</span>
          </div>
          <div className="rounded-2xl p-3 border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Utilisé</span>
            <span className="text-sm font-black text-rose-700">{roundTo0(summary.usedAmount)} €</span>
          </div>
          <div className="rounded-2xl p-3 border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Reste</span>
            <span className={`text-sm font-black ${netSavingsAmount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{roundTo0(netSavingsAmount)} €</span>
          </div>
        </div>

        {overspendAmount > 0 && (
          <div className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">
            Dépassement : +{roundTo0(overspendAmount)} € au-delà de l'épargne du mois
          </div>
        )}
      </CardContent>
    </Card>
  );
};

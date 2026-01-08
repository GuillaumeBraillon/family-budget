import React from "react";
import { Layers, TrendingDown, Wallet, Info } from "lucide-react";
import { MobileTooltip } from "../../../ui/MobileTooltip";

interface BudgetDistributionSummaryProps {
  totalEnvelope: number;
  usedEnvelope: number;
  distributable: number;
  consumedDetails?: { name: string; amount: number }[];
}

export const BudgetDistributionSummary: React.FC<BudgetDistributionSummaryProps> = ({ totalEnvelope, usedEnvelope, distributable, consumedDetails = [] }) => {
  // Helpers d'arrondi
  const roundTo0 = (amount: number) => Math.round(amount);
  const roundTo5 = (amount: number) => Math.round(amount / 5) * 5;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch justify-between gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      {/* 1. Enveloppe Total */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
            <Layers size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enveloppe Total</span>
          <MobileTooltip
            text="Montant du budget variable alloué pour la période en cours."
            icon={<Info size={14} className="text-slate-500 hover:text-white" />}
            widthClass="w-48"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-indigo-200">{roundTo5(totalEnvelope)} €</span>
          {Math.abs(roundTo5(totalEnvelope) - totalEnvelope) > 0.01 && (
            <span className="text-[10px] text-slate-500 font-medium">({totalEnvelope.toFixed(2)})</span>
          )}
        </div>
        <div className="mt-2 text-[10px] text-indigo-300/70 leading-tight">Budget alloué pour la période.</div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* 2. Déjà utilisé */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
            <TrendingDown size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Déjà consommé</span>
          <MobileTooltip
            text={
              <div className="space-y-1">
                <p className="font-bold text-indigo-200 border-b border-white/10 pb-1 mb-1">Détail par compte :</p>
                {consumedDetails.length > 0 ? (
                  consumedDetails.map((d, i) => (
                    <div key={i} className="flex justify-between gap-4">
                      <span>{d.name}</span>
                      <span className="font-mono font-bold">{d.amount.toFixed(2)}€</span>
                    </div>
                  ))
                ) : (
                  <span className="italic opacity-70">Aucune consommation.</span>
                )}
              </div>
            }
            icon={<Info size={14} className="text-slate-500 hover:text-white" />}
            widthClass="w-56"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-300">{-roundTo0(usedEnvelope)} €</span>
          {Math.abs(roundTo0(usedEnvelope) - usedEnvelope) > 0.01 && (
            <span className="text-[10px] text-slate-500 font-medium">({(-usedEnvelope).toFixed(2)})</span>
          )}
        </div>
        <div className="mt-2 text-[10px] text-rose-300/70 leading-tight">Dépenses variables nettes.</div>
      </div>

      <div className="hidden md:block w-px bg-white/10"></div>

      {/* 3. Reste à répartir */}
      <div className="flex-1 flex flex-col justify-between items-end text-right">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reste à répartir</span>
          <div className="p-1.5 bg-white/10 rounded-lg text-white">
            <Wallet size={16} />
          </div>
          <MobileTooltip
            text="Budget Période - Conso. Réelle. C'est le montant théorique disponible pour recharger les comptes persos."
            icon={<Info size={14} className="text-slate-500 hover:text-white" />}
            widthClass="w-48"
          />
        </div>
        <div>
          <span className={`text-3xl font-black tracking-tighter ${distributable >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {roundTo5(distributable)} €
          </span>
        </div>
        <div className="mt-3 flex flex-col items-end gap-1">
          {Math.abs(roundTo5(distributable) - distributable) > 0.01 && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 italic">
              Exact : <span className="font-bold text-slate-200">{distributable.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">Disponible pour les comptes persos</div>
        </div>
      </div>
    </div>
  );
};

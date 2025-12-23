
import React from 'react';
import { CalendarClock, ShoppingBag, Wallet, Info } from 'lucide-react';
import { MobileTooltip } from '../../../ui/MobileTooltip';

interface BalancesHeaderProps {
  resteAPayer: number;
  pendingRecurring: number;
  pendingVariablesDetails?: { name: string; amount: number }[];
  pendingRecurringDetails?: { name: string; amount: number }[];
  totalDetails?: { name: string; amount: number }[];
}

export const BalancesHeader: React.FC<BalancesHeaderProps> = ({ 
  resteAPayer, 
  pendingRecurring,
  pendingVariablesDetails = [],
  pendingRecurringDetails = [],
  totalDetails = []
}) => {
  const totalPendingVariable = pendingVariablesDetails.reduce((sum, d) => sum + d.amount, 0);

  // Arrondi pour l'affichage propre
  const roundTo0 = (amount: number) => Math.round(amount);

  const renderTooltipContent = (details: { name: string; amount: number }[]) => (
    <div className="space-y-1">
        <p className="font-bold text-indigo-200 border-b border-white/10 pb-1 mb-1">Détail par compte :</p>
        {details.length > 0 ? (
            details.map((d, i) => (
                <div key={i} className="flex justify-between gap-4">
                    <span>{d.name}</span>
                    <span className="font-mono font-bold">{d.amount.toFixed(2)}€</span>
                </div>
            ))
        ) : (
            <span className="italic opacity-70">Aucun montant.</span>
        )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch justify-between gap-6 animate-in slide-in-from-top-2 duration-500 border border-white/10">
      
        {/* Section 1: Récurrentes */}
        <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-slate-700/50 rounded-lg text-slate-300">
                    <CalendarClock size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Récurrentes (Attente)</span>
                <MobileTooltip 
                    text={renderTooltipContent(pendingRecurringDetails)}
                    icon={<Info size={14} className="text-slate-500 hover:text-white" />}
                    widthClass="w-56"
                />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{roundTo0(pendingRecurring)} €</span>
                {Math.abs(pendingRecurring - roundTo0(pendingRecurring)) > 0.01 && (
                    <span className="text-[10px] text-slate-500 font-medium">({pendingRecurring.toFixed(2)})</span>
                )}
            </div>
            <div className="mt-2 text-[10px] text-slate-400 leading-tight">
                Charges fixes restant à payer.
            </div>
        </div>

        <div className="hidden md:block w-px bg-white/10"></div>

        {/* Section 2: Variables */}
        <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <ShoppingBag size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variables (Attente)</span>
                <MobileTooltip 
                    text={renderTooltipContent(pendingVariablesDetails)} 
                    icon={<Info size={14} className="text-indigo-400 hover:text-white" />}
                    widthClass="w-56"
                />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-200">{roundTo0(totalPendingVariable)} €</span>
            </div>
            <div className="mt-2 text-[10px] text-indigo-300/70 leading-tight">
                Achats CB non encore débités.
            </div>
        </div>

        <div className="hidden md:block w-px bg-white/10"></div>

        {/* Section 3: Total */}
        <div className="flex-1 flex flex-col justify-between items-end text-right">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dette (Reste à payer)</span>
                <div className="p-1.5 bg-white/10 rounded-lg text-white">
                    <Wallet size={16} />
                </div>
                <MobileTooltip 
                    text={renderTooltipContent(totalDetails)}
                    icon={<Info size={14} className="text-slate-500 hover:text-white" />}
                    widthClass="w-56"
                />
            </div>
            <div>
                <span className="text-3xl font-black tracking-tighter text-white">
                    {roundTo0(resteAPayer)} €
                </span>
            </div>
            <div className="mt-3 flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 italic">
                    Exact : <span className="font-bold text-slate-200">{resteAPayer.toFixed(2)} €</span>
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                    À couvrir par le compte joint
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { ArrowRight, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { PlannedItem, Account } from '../../../../types';
import { DataList } from '../../../ui/molecules/DataList';

export interface TransferPair {
  id: string; // timestamp or ID
  date: number; // day of month
  monthShort: string;
  amount: number;
  label: string;
  from?: PlannedItem;
  to?: PlannedItem;
}

interface TransfersListProps {
  pairs: TransferPair[];
  accounts: Account[];
  onItemClick: (item: PlannedItem) => void;
  onAddClick: () => void;
}

export const TransfersList: React.FC<TransfersListProps> = ({ pairs, accounts, onItemClick, onAddClick }) => {
  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'Inconnu';

  return (
    <DataList 
        title="Historique des Virements" 
        count={pairs.length} 
        onAdd={onAddClick} 
        addButtonLabel="Nouveau virement" 
        emptyMessage="Aucun virement trouvé pour cette période."
    >
      {pairs.map(pair => {
        const isPaid = (pair.from?.isPaid && pair.to?.isPaid) || (pair.from?.isPaid && !pair.to) || (!pair.from && pair.to?.isPaid);
        // Si l'un des deux n'est pas payé, on considère l'ensemble comme en attente (sauf si orphelin)
        const isPending = !isPaid;
        
        // Nettoyage du libellé pour l'affichage (enlève le préfixe "Virement interne : ...")
        const displayLabel = pair.label.replace(/^Virement interne : .*? => .*? \((.*)\)$/, '$1');

        return (
          <div 
            key={pair.id} 
            className={`p-4 flex items-center gap-4 group transition-all cursor-pointer border-b border-slate-100 last:border-0 ${isPending ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
            onClick={() => onItemClick(pair.from || pair.to!)}
          >
            {/* Status & Date */}
            <div className="flex flex-col items-center gap-1">
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {isPending ? <Clock size={18} className="text-amber-500 animate-pulse" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
                <div className={`flex-shrink-0 w-12 text-center flex flex-col items-center justify-center rounded-lg py-1 border ${isPending ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-sm font-bold block text-slate-700 leading-none">{pair.date}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mt-0.5">{pair.monthShort}</span>
                </div>
            </div>

            {/* Transfer Flow */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-900 truncate">{displayLabel}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                    {/* Source */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${pair.from ? 'bg-white border-slate-200' : 'bg-red-50 border-red-100 text-red-400 dashed'}`}>
                        {pair.from ? (
                            <span className="font-medium text-slate-700">{getAccountName(pair.from.accountId)}</span>
                        ) : (
                            <span className="italic flex items-center gap-1"><AlertCircle size={10}/> Source inconnue</span>
                        )}
                    </div>

                    <ArrowRight size={14} className="text-indigo-400" />

                    {/* Destination */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${pair.to ? 'bg-white border-slate-200' : 'bg-red-50 border-red-100 text-red-400 dashed'}`}>
                        {pair.to ? (
                            <span className="font-medium text-slate-700">{getAccountName(pair.to.accountId)}</span>
                        ) : (
                            <span className="italic flex items-center gap-1"><AlertCircle size={10}/> Dest. inconnue</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Amount */}
            <div className="text-right">
                <div className="font-black text-base text-indigo-700">
                    {pair.amount.toFixed(2)} €
                </div>
            </div>
          </div>
        );
      })}
    </DataList>
  );
};

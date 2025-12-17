import React from 'react';
import { Check, Tag, User, Users, CreditCard, ArrowRightLeft } from 'lucide-react';
import { PlannedItem, Person, Account } from '../../../types';

interface OperationRowProps {
  item: PlannedItem;
  person?: Person;
  account?: Account;
  monthShort: string;
  extraProgress: { text: string; isLast: boolean } | null;
  onClick: () => void;
}

export const OperationRow: React.FC<OperationRowProps> = ({ 
  item, person, account, monthShort, extraProgress, onClick 
}) => {
  const isIncome = item.type === 'INCOME';
  
  return (
    <div 
      onClick={onClick} 
      className={`p-4 flex items-center gap-4 cursor-pointer transition-all group ${item.isPaid ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50'}`}
    >
      <div className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
        item.isPaid 
          ? (isIncome ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-slate-900 text-white') 
          : 'border-slate-300 bg-white group-hover:border-indigo-400'
      }`}>
        {item.isPaid && <Check size={14} strokeWidth={3} />}
      </div>

      <div className="flex-shrink-0 w-12 text-center">
          <span className={`text-sm font-bold block ${item.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>{item.day}</span>
          <span className="text-[10px] text-slate-400 uppercase font-medium">{monthShort}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-medium truncate ${item.isPaid ? 'line-through text-slate-500' : 'text-slate-900'}`}>
            {item.label}
          </span>
          {item.isExtra && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
              extraProgress?.isLast ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              Temp. {extraProgress && `(${extraProgress.text})`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1"><Tag size={12}/> {item.category}{item.subCategory && <span className="opacity-75"> &gt; {item.subCategory}</span>}</span>
          {person && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
              {person.isChild ? <User size={10} /> : <Users size={10} />}
              {person.name}
            </span>
          )}
          {account && <span className="flex items-center gap-1 text-slate-400"><CreditCard size={10} /> {account.name}</span>}
        </div>
      </div>

      <div className="text-right">
        <div className={`font-mono font-bold text-sm ${item.isPaid ? 'text-slate-400' : (isIncome ? 'text-emerald-600' : 'text-slate-900')}`}>
          {isIncome ? '+' : '-'} {item.amount.toFixed(2)} €
        </div>
        {Math.abs(item.amount - item.originalAmount) > 0.01 && (
          <div className="text-[10px] text-amber-600 font-medium flex items-center justify-end gap-1">
            <ArrowRightLeft size={10} />Prévu: {item.originalAmount.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};
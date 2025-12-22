
import React from 'react';
import { ChevronRight, Tag, User, Users, CreditCard, Clock, CheckCircle2, Info } from 'lucide-react';
import { MobileTooltip } from '../MobileTooltip';

interface DataListRowProps {
  date?: { day: string | number; month: string };
  icon?: React.ReactNode;
  label: string;
  amount?: number;
  originalAmount?: number;
  isIncome?: boolean;
  category?: string;
  subCategory?: string;
  beneficiary?: string;
  isChild?: boolean;
  accountName?: string;
  isPaid?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
  comments?: string;
}

export const DataListRow: React.FC<DataListRowProps> = ({
  date, icon, label, amount, originalAmount, isIncome, category, subCategory, 
  beneficiary, isChild, accountName, isPaid, onClick, badge, comments
}) => {
  const isPending = isPaid === false;
  const bgClass = isPending ? 'bg-amber-50/50 border-l-4 border-l-amber-400' : 'hover:bg-slate-50';

  return (
    <div onClick={onClick} className={`p-4 flex items-center gap-4 group transition-all cursor-pointer ${bgClass}`}>
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
         {isPending ? <Clock size={18} className="text-amber-500 animate-pulse" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
      </div>

      {date ? (
        <div className={`flex-shrink-0 w-12 text-center flex flex-col items-center justify-center rounded-lg py-1.5 border ${isPending ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-lg font-bold block text-slate-700 leading-none">{date.day}</span>
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mt-0.5">{date.month}</span>
        </div>
      ) : icon ? (
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">{icon}</div>
      ) : null}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold truncate text-slate-900">{label}</span>
          {badge}
          {comments && (
             <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
                <MobileTooltip text={comments} icon={<Info size={12} className="text-indigo-400 hover:text-indigo-600" />} widthClass="w-48" />
             </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          {(category || subCategory) && (
            <span className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200/50">
                <Tag size={10}/> {category}{subCategory && <span className="opacity-70"> &gt; {subCategory}</span>}
            </span>
          )}
          {beneficiary && (
            <span className="flex items-center gap-1 text-slate-500 font-medium">
                {isChild ? <User size={10} /> : <Users size={10} />} {beneficiary}
            </span>
          )}
          {accountName && (
            <span className="flex items-center gap-1 text-slate-400 font-medium px-1.5 py-0.5 rounded">
                <CreditCard size={10} /> {accountName}
            </span>
          )}
        </div>
      </div>

      <div className="text-right flex items-center gap-3">
        {amount !== undefined && (
            <div>
                <div className={`font-black text-base ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isIncome ? '+' : ''}{amount.toFixed(2)} €
                </div>
                {originalAmount !== undefined && Math.abs(amount - originalAmount) > 0.01 && (
                    <div className="text-[10px] text-amber-600 font-bold">Prévu: {originalAmount.toFixed(2)}</div>
                )}
            </div>
        )}
        {onClick && <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />}
      </div>
    </div>
  );
};

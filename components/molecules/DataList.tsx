
import React from 'react';
import { Plus, ChevronRight, Tag, User, Users, CreditCard, Calendar } from 'lucide-react';

// --- CONTENEUR DE LISTE ---
interface DataListProps {
  title: string;
  count?: number;
  onAdd?: () => void;
  addButtonLabel?: string;
  children: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export const DataList: React.FC<DataListProps> = ({ 
  title, count, onAdd, addButtonLabel = "Ajouter une ligne", children, emptyMessage = "Aucun élément.", className = ""
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </h3>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={14} /> {addButtonLabel}
          </button>
        )}
      </div>
      
      <div className="divide-y divide-slate-100 overflow-y-auto">
        {React.Children.count(children) > 0 ? children : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div className="bg-slate-50 p-4 rounded-full mb-3">
                    <Calendar size={24} className="text-slate-300" />
                </div>
                <p className="text-sm">{emptyMessage}</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- LIGNE DE LISTE ---
interface DataListRowProps {
  date?: { day: string | number; month: string }; // Rendu optionnel
  icon?: React.ReactNode; // Alternative à la date (ex: icône de compte)
  label: string;
  amount?: number; // Rendu optionnel (ex: membres)
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
}

export const DataListRow: React.FC<DataListRowProps> = ({
  date, icon, label, amount, originalAmount, isIncome, category, subCategory, 
  beneficiary, isChild, accountName, isPaid, onClick, badge
}) => {
  return (
    <div 
      onClick={onClick} 
      className={`p-4 flex items-center gap-4 group transition-colors ${
        isPaid ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50 cursor-pointer'
      }`}
    >
      {/* DATE / ICONE */}
      {date ? (
        <div className="flex-shrink-0 w-12 text-center flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1.5 border border-slate-100">
            <span className="text-lg font-bold block text-slate-700 leading-none">{date.day}</span>
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mt-0.5">{date.month}</span>
        </div>
      ) : icon ? (
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            {icon}
        </div>
      ) : null}

      {/* INFOS PRINCIPALES */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-bold truncate ${isPaid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {label}
          </span>
          {badge}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          {(category || subCategory) && (
            <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                <Tag size={10}/> 
                {category}{subCategory && <span className="opacity-70"> &gt; {subCategory}</span>}
            </span>
          )}
          {beneficiary && (
            <span className="flex items-center gap-1 text-slate-500">
                {isChild ? <User size={10} /> : <Users size={10} />} {beneficiary}
            </span>
          )}
          {accountName && (
            <span className="flex items-center gap-1 text-slate-400 font-medium border border-slate-100 px-1.5 py-0.5 rounded">
                <CreditCard size={10} /> {accountName}
            </span>
          )}
        </div>
      </div>

      {/* MONTANT & ACTION */}
      <div className="text-right flex items-center gap-3">
        {amount !== undefined && (
            <div>
                <div className={`font-bold text-base ${isPaid ? 'text-slate-400' : (isIncome ? 'text-emerald-600' : 'text-slate-900')}`}>
                    {isIncome ? '+' : ''}{amount.toFixed(2)} €
                </div>
                {originalAmount !== undefined && Math.abs(amount - originalAmount) > 0.01 && (
                    <div className="text-[10px] text-amber-600 font-medium">
                        Prévu: {originalAmount.toFixed(2)}
                    </div>
                )}
            </div>
        )}
        
        {onClick && (
            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
        )}
      </div>
    </div>
  );
};
